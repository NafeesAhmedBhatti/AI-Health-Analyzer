import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/get-user';
import OpenAI from 'openai';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: process.env.OPENAI_BASE_URL });

export async function GET() {
  try {
    const userId = await getUserId();
    const reports = await prisma.healthReport.findMany({
      where: { userId },
      orderBy: { generatedAt: 'desc' },
      take: 20,
    });
    return NextResponse.json(reports);
  } catch (error: any) {
    console.error('GET /api/reports error:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();

    // Gather all health data
    const [user, vitals, meds, alerts, labs, nutrition, symptoms, mood] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.vital.findMany({ where: { userId }, orderBy: { recordedAt: 'desc' }, take: 20 }),
      prisma.medication.findMany({ where: { userId, active: true } }),
      prisma.healthAlert.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 20 }),
      prisma.labReport.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.nutritionPlan.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 1 }),
      prisma.symptomCheck.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.moodEntry.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);

    // Build AI prompt with real data
    const vitalSummary = vitals.slice(0, 10).map(v => `${v.type}: ${v.value} ${v.unit}`).join(', ');
    const medSummary = meds.map(m => `${m.name} ${m.dosage}`).join(', ');
    const labSummary = labs.map(l => `${l.fileName} (score: ${l.extractedData && typeof l.extractedData === 'object' ? (l.extractedData as any).healthScore || '?' : '?'})`).join(', ');
    const alertSummary = alerts.slice(0, 5).map(a => `[${a.severity}] ${a.title}`).join('; ');
    const symptomSummary = symptoms.slice(0, 5).map(s => `${(s.symptomsInput as any)?.description || '?'}`).join(', ');
    const moodSummary = mood.slice(0, 3).map(m => `mood:${m.moodScore} anxiety:${m.anxietyScore} sleep:${m.sleepQuality}`).join(', ');

    const aiPrompt = `Generate a comprehensive health report narrative for this patient. Include:
1. Executive Summary (2-3 sentences)
2. Vital Signs Analysis (are they in range? any concerns?)
3. Active Medications Assessment
4. Lab Findings Summary
5. Mental Health Overview
6. Key Recommendations (3-5 actionable items)
7. Risk Assessment (low/medium/high with explanation)

Patient: ${user?.name || 'Patient'}
Recent Vitals: ${vitalSummary || 'No vitals recorded'}
Active Medications: ${medSummary || 'None'}
Lab Reports: ${labSummary || 'No lab reports'}
Recent Alerts: ${alertSummary || 'No active alerts'}
Symptoms Being Monitored: ${symptomSummary || 'None'}
Mental Health Scores: ${moodSummary || 'Not assessed'}

Return ONLY valid JSON: {"executiveSummary":"...","vitalsAnalysis":"...","medicationsAssessment":"...","labFindings":"...","mentalHealth":"...","recommendations":["rec1","rec2","rec3"],"riskLevel":"low|medium|high","riskExplanation":"...","overallAssessment":"..."}`;

    // Get AI analysis
    let aiData: any = {};
    try {
      const aiResponse = await openai.chat.completions.create({
        model: 'drytis/kimi-k2.5',
        temperature: 0.3,
        max_tokens: 1200,
        messages: [
          { role: 'system', content: 'You are a senior physician writing a clinical health report. Return ONLY valid JSON.' },
          { role: 'user', content: aiPrompt },
        ],
      });
      const text = aiResponse.choices?.[0]?.message?.content || '{}';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) aiData = JSON.parse(match[0]);
    } catch (e) {
      console.error('AI report error:', e);
      aiData = { executiveSummary: 'Report generated from available health data.', overallAssessment: 'Please review individual sections.' };
    }

    // Generate PDF
    const doc = new jsPDF() as any;
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(6, 6, 15);
    doc.rect(0, 0, pageWidth, 297, 'F');
    doc.setTextColor(0, 212, 255);
    doc.setFontSize(22);
    doc.text('AI Health Analyzer — Comprehensive Health Report', 14, 20);
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(10);
    doc.text(`Patient: ${user?.name || 'Patient'} | Generated: ${new Date().toLocaleDateString()} | Risk: ${(aiData.riskLevel || 'unknown').toUpperCase()}`, 14, 28);

    let y = 38;

    const addSection = (title: string, content: string) => {
      if (y > 260) { doc.addPage(); doc.setFillColor(6, 6, 15); doc.rect(0, 0, pageWidth, 297, 'F'); y = 15; }
      doc.setTextColor(0, 212, 255);
      doc.setFontSize(12);
      doc.text(title, 14, y);
      y += 6;
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(content, pageWidth - 28);
      doc.text(lines, 14, y);
      y += lines.length * 4.5 + 4;
    };

    addSection('Executive Summary', aiData.executiveSummary || 'No summary available.');
    addSection('Overall Assessment', aiData.overallAssessment || 'No assessment available.');
    addSection('Vital Signs Analysis', aiData.vitalsAnalysis || 'No vitals analysis available.');
    addSection('Medications Assessment', aiData.medicationsAssessment || 'No medication assessment available.');
    addSection('Lab Findings', aiData.labFindings || 'No lab findings available.');
    addSection('Mental Health', aiData.mentalHealth || 'No mental health data available.');
    addSection('Risk Assessment', `${(aiData.riskLevel || 'unknown').toUpperCase()}: ${aiData.riskExplanation || 'No risk assessment available.'}`);

    if (aiData.recommendations?.length > 0) {
      addSection('Key Recommendations', aiData.recommendations.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n'));
    }

    // Vitals Table
    if (vitals.length > 0) {
      if (y > 240) { doc.addPage(); doc.setFillColor(6, 6, 15); doc.rect(0, 0, pageWidth, 297, 'F'); y = 15; }
      doc.setTextColor(0, 212, 255);
      doc.setFontSize(12);
      doc.text('Recent Vitals', 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [['Type', 'Value', 'Unit', 'Date']],
        body: vitals.slice(0, 15).map((v: any) => [v.type, v.value.toString(), v.unit, new Date(v.recordedAt).toLocaleDateString()]),
        theme: 'grid',
        styles: { fillColor: [18, 18, 30], textColor: [200, 200, 200], fontSize: 8 },
        headStyles: { fillColor: [0, 100, 150], textColor: [255, 255, 255] },
      });
    }

    // Disclaimer
    const finalY = Math.max((doc.lastAutoTable?.finalY || 200) + 10, y + 10);
    if (finalY > 280) { doc.addPage(); doc.setFillColor(6, 6, 15); doc.rect(0, 0, pageWidth, 297, 'F'); }
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.text('⚠️ AI-generated report. Not medical advice. Always consult your healthcare provider.', 14, Math.min(finalY, 290));

    const pdfBase64 = Buffer.from(doc.output('arraybuffer')).toString('base64');

    // Save report metadata
    const report = await prisma.healthReport.create({
      data: {
        userId,
        title: `Health Report — ${new Date().toLocaleDateString()}`,
        reportType: 'comprehensive',
        summary: aiData.executiveSummary || 'Comprehensive health report',
        data: {
          ai: aiData,
          vitalsCount: vitals.length,
          medicationsCount: meds.length,
          alertsCount: alerts.length,
          labsCount: labs.length,
        },
        pdfData: pdfBase64,
      },
    });

    return NextResponse.json({ ...report, pdfBase64 });
  } catch (error: any) {
    console.error('POST /api/reports error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}