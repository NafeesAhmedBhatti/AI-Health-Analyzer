import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/get-user';
import OpenAI from 'openai';
import path from 'path';
import fs from 'fs/promises';

export const maxDuration = 120;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: process.env.OPENAI_BASE_URL });

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract text from file
    let extractedText = '';
    const fileExt = path.extname(file.name).toLowerCase();
    
    if (fileExt === '.pdf') {
      // Try multiple PDF extraction strategies
      // Strategy 1: pdf-parse (works for text-based PDFs)
      try {
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(buffer);
        if (pdfData.text && pdfData.text.trim().length > 30) {
          extractedText = pdfData.text;
        }
      } catch (e: any) {
        console.error('pdf-parse failed:', e?.message?.slice(0, 100));
      }

      // Strategy 2: unpdf (uses pdf.js under the hood, more tolerant)
      if (!extractedText.trim()) {
        try {
          const { getDocumentProxy } = require('unpdf');
          const pdf = await getDocumentProxy(new Uint8Array(buffer));
          const pages: string[] = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map((item: any) => item.str || '').join(' ');
            if (pageText.trim()) pages.push(pageText);
          }
          const unpdfText = pages.join('\n');
          if (unpdfText.trim().length > 30) {
            extractedText = unpdfText;
          }
        } catch (e: any) {
          console.error('unpdf failed:', e?.message?.slice(0, 100));
        }
      }

      // Strategy 3: Raw text extraction (find readable ASCII/Unicode sequences)
      if (!extractedText.trim()) {
        const rawStr = buffer.toString('utf-8');
        // Extract text between stream/endstream markers (PDF content streams)
        const streamRegex = /stream\r?\n([\s\S]*?)endstream/g;
        let match;
        const textParts: string[] = [];
        while ((match = streamRegex.exec(rawStr)) !== null) {
          const content = match[1];
          // Look for text operators: Tj, TJ, ', "
          const tjMatches = content.match(/\(([^)]+)\)\s*Tj/g);
          if (tjMatches) {
            for (const tj of tjMatches) {
              const txt = tj.replace(/\(([^)]+)\)\s*Tj/, '$1');
              if (txt.trim()) textParts.push(txt);
            }
          }
          // Also try BT...ET blocks
          const btBlocks = content.match(/BT[\s\S]*?ET/g);
          if (btBlocks) {
            for (const block of btBlocks) {
              const textOps = block.match(/\(([^)]+)\)/g);
              if (textOps) {
                for (const op of textOps) {
                  const cleaned = op.replace(/[()]/g, '').trim();
                  if (cleaned.length > 1) textParts.push(cleaned);
                }
              }
            }
          }
        }
        if (textParts.length > 0) {
          extractedText = textParts.join(' ').replace(/\s+/g, ' ').trim();
        }
      }

      // Strategy 4: Fallback to readable ASCII filter
      if (!extractedText.trim()) {
        const filtered = buffer.toString('latin1')
          .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        // Only use if it has enough readable content
        const readableRatio = (filtered.match(/[a-zA-Z]/g) || []).length / Math.max(filtered.length, 1);
        if (readableRatio > 0.3 && filtered.length > 100) {
          extractedText = filtered.slice(0, 15000);
        }
      }

    } else {
      // TXT, DOC, DOCX etc — read as plain text
      extractedText = buffer.toString('utf-8');
    }

    if (!extractedText.trim()) {
      return NextResponse.json({ 
        error: 'Could not extract text from this PDF. The file may be a scanned image or password-protected. Please upload a text-based PDF or a .txt file instead.' 
      }, { status: 400 });
    }

    console.info(`PDF extraction: ${extractedText.length} chars from ${file.name}`);

    // Quality check: ensure extracted text has meaningful medical content (not garbled binary)
    // Strategy 4 can extract random binary that looks like words but isn't medical content
    const medicalTerms = /\b(glucose|hgb|hba1c|cholesterol|ldl|hdl|triglyceride|creatinine|bun|sodium|potassium|calcium|hemoglobin|wbc|rbc|platelet|blood|urine|serum|plasma|normal|high|low|elevated|range|mg|dL|mEq|IU|mmol|patient|doctor|lab|test|value|result|vital|pressure|heart|bmi|temperature|pulse|oxygen|abnormal|positive|negative|reference|fasting|tsh|t4|iron|ferritin|vitamin|albumin|protein|bilirubin|alt|ast|esr|crp|thyroid|diabetes|anemia|kidney|liver|lipid|metabolic|panel|count|cbc|cmp|a1c)\b/i;
    const hasMedicalContent = medicalTerms.test(extractedText);
    
    if (!hasMedicalContent) {
      console.info('Text quality too low: no medical/lab terms found in extracted text');
      return NextResponse.json({ 
        error: 'Could not extract readable lab data from this PDF. The file may be a scanned image, contain only images, or be password-protected. Please try uploading a text-based PDF or a .txt file with your lab results instead.' 
      }, { status: 400 });
    }

    // Save file
    const uploadDir = path.join(process.cwd(), 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, `${userId}-${Date.now()}-${file.name}`);
    await fs.writeFile(filePath, buffer);

    // Save initial report record
    const report = await prisma.labReport.create({
      data: { userId, fileName: file.name, fileType: path.extname(file.name).replace('.', '').toUpperCase() || 'PDF',
        filePath, status: 'pending', extractedData: { rawText: extractedText.slice(0, 5000) } },
    });

    // ── AI CLINICAL ANALYSIS ──
    // Single focused call with reduced scope for speed
    const aiResponse = await openai.chat.completions.create({
      model: 'drytis/kimi-k2.5',
      temperature: 0.1,
      max_tokens: 1500,
      messages: [{
        role: 'system',
        content: `You are a senior clinical pathologist. Return ONLY valid JSON. No markdown. No extra text. Keep arrays short (max 5 items each).`
      }, {
        role: 'user',
        content: `Analyze lab report and return compact JSON:
{"healthScore":0-100,"summary":"brief summary","abnormalValues":[{"name":"Test","value":"result","normalRange":"range","status":"critical|high|low","clinicalSignificance":"meaning","possibleCauses":["cause"]}],"conditions":[{"name":"Name","severity":"severe","description":"brief"}],"recommendations":["rec1","rec2"],"alerts":[{"title":"alert","severity":"critical","message":"detail"}],"medications":[{"name":"Drug","dosage":"amount","frequency":"when","reason":"why","sideEffectsToWatch":["effect"]}],"nutrition":{"dailyCalories":1800,"meals":[{"name":"Breakfast","foods":["food1"]}],"foodsToAdd":["food1 - reason"],"foodsToAvoid":["food1 - reason"],"supplements":["supp - dosage"]},"symptomsToWatch":[{"name":"Symptom","severity":"severe","redFlag":"emergency sign","relatedLabValue":"test"}],"mentalHealth":{"overallAssessment":"brief","stressLevel":"high","exerciseRecommendation":"brief","relaxationTips":["tip1"]},"vitalsFromReport":{"heart_rate":null,"blood_pressure_systolic":null,"blood_pressure_diastolic":null,"weight":null,"bmi":null}}

REPORT:
${extractedText.slice(0, 5000)}`
      }],
    });

    const aiText = aiResponse.choices?.[0]?.message?.content || '';

    // Robust JSON parser
    function safeParseJSON(text: string, fallback: any = {}) {
      if (!text) return fallback;
      try {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
      } catch {}
      try {
        let json = text.match(/\{[\s\S]*\}/)?.[0] || '';
        json = json.replace(/,\s*([\]}])/g, '$1');
        return JSON.parse(json);
      } catch {}
      try {
        const result: any = {};
        const hs = text.match(/"healthScore"\s*:\s*(\d+)/);
        if (hs) result.healthScore = parseInt(hs[1]);
        const sm = text.match(/"summary"\s*:\s*"([^"]+)"/);
        if (sm) result.summary = sm[1];
        return Object.keys(result).length > 0 ? result : fallback;
      } catch {}
      return fallback;
    }

    const analysis = safeParseJSON(aiText, { summary: 'Analysis complete. Please review results.', healthScore: 50 });

    // ── CLEAR ALL OLD DATA BEFORE INSERTING NEW ──
    await prisma.medication.updateMany({ where: { userId, active: true }, data: { active: false } });
    await prisma.healthAlert.updateMany({ where: { userId, read: false }, data: { read: true } });
    await prisma.nutritionPlan.deleteMany({ where: { userId } });
    // Deactivate old reports, activate this one
    await prisma.labReport.updateMany({ where: { userId, isActive: true }, data: { isActive: false } });

    // ── Store all analysis in the report record ──
    await prisma.labReport.update({
      where: { id: report.id },
      data: {
        status: 'reviewed',
        isActive: true,
        aiSummary: analysis.summary || '',
        extractedData: {
          rawText: extractedText.slice(0, 5000),
          abnormalValues: analysis.abnormalValues || [],
          normalValues: analysis.normalValues || [],
          conditions: analysis.conditions || [],
          healthScore: analysis.healthScore,
          confidence: analysis.confidence,
        },
        flags: {
          vitalsFromReport: analysis.vitalsFromReport || {},
          medications: analysis.medications || [],
          nutrition: analysis.nutrition || {},
          symptomsToWatch: analysis.symptomsToWatch || [],
          mentalHealth: analysis.mentalHealth || {},
          recommendations: analysis.recommendations || [],
          alerts: analysis.alerts || [],
        },
      },
    });

    // ── Create vitals from report ──
    const vitalsData = analysis.vitalsFromReport || {};
    const units: Record<string, string> = { heart_rate: 'bpm', blood_pressure_systolic: 'mmHg', blood_pressure_diastolic: 'mmHg', temperature: '°C', oxygen: '%', weight: 'kg' };
    for (const [vType, value] of Object.entries(vitalsData)) {
      if (value !== null && value !== undefined && typeof value === 'number') {
        await prisma.vital.create({ data: { userId, type: vType, value, unit: units[vType] || '', recordedAt: new Date(), source: 'lab_report' } });
      }
    }

    // ── Create medications ──
    for (const med of (analysis.medications || [])) {
      await prisma.medication.create({
        data: { userId, name: med.name, dosage: med.dosage, frequency: med.frequency,
          startDate: new Date(),
          notes: JSON.stringify({ reason: med.reason, brandName: med.brandName, category: med.category, sideEffects: med.sideEffectsToWatch, contraindications: med.contraindications, monitoring: med.monitoringNeeded, durationWeeks: med.durationWeeks }),
          active: true },
      });
    }

    // ── Create nutrition plan ──
    if (analysis.nutrition) {
      await prisma.nutritionPlan.create({
        data: { userId,
          goals: { conditions: (analysis.conditions || []).map((c: any) => typeof c === 'string' ? c : c.name), activeReportId: report.id },
          planData: analysis.nutrition, aiGenerated: true, validFrom: new Date() },
      });
    }

    // ── Create alerts ──
    for (const av of (analysis.abnormalValues || [])) {
      await prisma.healthAlert.create({
        data: { userId, type: av.status === 'critical' ? 'critical' : 'warning',
          title: `${av.name}: ${av.value}`,
          message: av.clinicalSignificance || `Value ${av.status}: ${av.value} (Normal: ${av.normalRange}). ${av.possibleCauses ? 'Causes: ' + av.possibleCauses.join(', ') : ''}. ${av.recommendedAction || ''}`,
          severity: av.status === 'critical' ? 'critical' : 'warning', read: false },
      });
    }
    for (const alert of (analysis.alerts || [])) {
      await prisma.healthAlert.create({
        data: { userId, type: alert.severity === 'critical' ? 'critical' : 'warning',
          title: alert.title, message: `${alert.message}. Action: ${alert.action || 'Consult your doctor'}`,
          severity: alert.severity || 'warning', read: false },
      });
    }
    for (const cond of (analysis.conditions || [])) {
      await prisma.healthAlert.create({
        data: { userId, type: 'info',
          title: `Condition: ${cond.name}`,
          message: `${cond.description}. Evidence: ${(cond.supportingEvidence || []).join(', ')}. Complications if untreated: ${(cond.complicationsIfUntreated || []).join(', ')}. ICD: ${cond.icdCode || 'N/A'}`,
          severity: cond.severity === 'severe' ? 'warning' : 'info', read: false },
      });
    }

    // ── Create symptom checks ──
    for (const sym of (analysis.symptomsToWatch || [])) {
      await prisma.symptomCheck.create({
        data: { userId,
          symptomsInput: { description: sym.name, severity: sym.severity === 'severe' ? 9 : sym.severity === 'moderate' ? 6 : 3 },
          aiResponse: { description: sym.description, when: sym.whenToExpect, redFlag: sym.redFlag, relatedCondition: sym.relatedCondition, relatedLabValue: sym.relatedLabValue },
          urgency: sym.severity },
      });
    }

    // ── Create mood/mental health ──
    if (analysis.mentalHealth) {
      const mh = analysis.mentalHealth;
      const stressNum = mh.stressLevel === 'high' ? 8 : mh.stressLevel === 'moderate' ? 5 : 2;
      await prisma.moodEntry.create({
        data: { userId,
          moodScore: mh.stressLevel === 'high' ? 2 : mh.stressLevel === 'moderate' ? 3 : 4,
          anxietyScore: stressNum, energyScore: 10 - stressNum,
          sleepQuality: mh.sleepRecommendation?.hours || 7,
          notes: mh.overallAssessment || mh.moodImpact || '',
          tags: { type: 'ai_generated', exercise: mh.exerciseRecommendation, relaxationTips: mh.relaxationTips, cognitiveEffects: mh.cognitiveEffects, professionalHelp: mh.professionalHelp, anxietyRisk: mh.anxietyRisk } },
      });
    }

    return NextResponse.json({ success: true, reportId: report.id, healthScore: analysis.healthScore, conditions: (analysis.conditions || []).length, abnormalValues: (analysis.abnormalValues || []).length });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}