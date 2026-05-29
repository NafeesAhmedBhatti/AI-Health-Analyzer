import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/get-user';
import prisma from '@/lib/prisma';
import { symptomSchema } from '@/lib/validations';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: process.env.OPENAI_BASE_URL });

export async function GET() {
  try {
    const userId = await getUserId();
    const symptoms = await prisma.symptomCheck.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return NextResponse.json(symptoms.map((s) => {
      const input = (s.symptomsInput as any) || {};
      const response = (s.aiResponse as any) || {};
      return {
        id: s.id,
        symptomsInput: { description: input.description || 'Unknown Symptom', severity: input.severity || 5, duration: input.duration || '', bodyRegion: input.bodyRegion || '' },
        aiResponse: {
          conditionName: response.conditionName || '',
          description: response.description || '',
          possibleCauses: response.possibleCauses || [],
          recommendations: response.recommendations || [],
          redFlags: response.redFlags || [],
          when: response.when || '',
          relatedCondition: response.relatedCondition || '',
          relatedLabValue: response.relatedLabValue || '',
          urgency: response.urgency || s.urgency || 'low',
          followUpQuestions: response.followUpQuestions || [],
        },
        urgency: s.urgency,
        createdAt: s.createdAt,
      };
    }));
  } catch (error) {
    console.error('GET /api/symptoms error:', error);
    return NextResponse.json({ error: 'Failed to fetch symptoms' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await req.json();
    const parsed = symptomSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    const { description, severity } = parsed.data;
    const duration = body.duration || '';
    const bodyRegion = body.bodyRegion || '';

    // Get recent vitals for context
    const recentVitals = await prisma.vital.findMany({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
      take: 10,
    });
    const vitalContext = recentVitals.map(v => `${v.type}: ${v.value} ${v.unit}`).join(', ');

    // Get active medications
    const activeMeds = await prisma.medication.findMany({
      where: { userId, active: true },
      take: 10,
    });
    const medContext = activeMeds.map(m => `${m.name} ${m.dosage}`).join(', ');

    // AI Analysis
    let aiResponse: any = {};
    try {
      const aiResult = await openai.chat.completions.create({
        model: 'drytis/kimi-k2.5',
        temperature: 0.2,
        max_tokens: 1000,
        messages: [
          {
            role: 'system',
            content: `You are a clinical AI assistant analyzing patient symptoms. Provide thorough analysis based on the symptom description, severity, and patient context. Return ONLY valid JSON.`,
          },
          {
            role: 'user',
            content: `Analyze this symptom:
Description: "${description}"
Severity: ${severity}/10
Duration: ${duration || 'Not specified'}
Body Region: ${bodyRegion || 'Not specified'}
Recent Vitals: ${vitalContext || 'No vitals available'}
Active Medications: ${medContext || 'None'}

Return JSON with:
{
  "conditionName": "Most likely condition name",
  "description": "2-3 sentence clinical explanation",
  "possibleCauses": [{"name":"cause1","probability":0.8},{"name":"cause2","probability":0.5}],
  "recommendations": ["rec1","rec2","rec3"],
  "redFlags": ["warning sign 1","warning sign 2"],
  "urgency": "low|medium|high|emergency",
  "when": "When to seek medical attention",
  "relatedCondition": "Related underlying condition",
  "relatedLabValue": "Lab test that should be checked",
  "followUpQuestions": ["question1","question2"]
}`,
          },
        ],
      });

      const text = aiResult.choices?.[0]?.message?.content || '{}';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) aiResponse = JSON.parse(match[0]);
    } catch (e) {
      console.error('AI symptom error:', e);
      aiResponse = {
        conditionName: 'Analysis pending',
        description: `Patient reports: ${description}. Further evaluation recommended.`,
        recommendations: ['Monitor symptoms', 'Consult healthcare provider if symptoms persist'],
        urgency: severity >= 7 ? 'high' : 'medium',
      };
    }

    const urgencyLevel = aiResponse.urgency || (severity >= 7 ? 'high' : severity >= 4 ? 'medium' : 'low');

    // Create symptom check with AI response
    const symptom = await prisma.symptomCheck.create({
      data: {
        userId,
        symptomsInput: { description, severity, duration, bodyRegion },
        aiResponse: {
          ...aiResponse,
          urgency: urgencyLevel,
        },
        urgency: urgencyLevel,
      },
    });

    // Create alert for high-urgency symptoms
    if (urgencyLevel === 'high' || urgencyLevel === 'emergency') {
      await prisma.healthAlert.create({
        data: {
          userId,
          type: urgencyLevel === 'emergency' ? 'critical' : 'warning',
          title: `${urgencyLevel === 'emergency' ? '🚨' : '⚠️'} Symptom Alert: ${description.substring(0, 50)}`,
          message: `AI detected a ${urgencyLevel} urgency symptom: "${description}". ${aiResponse.when || 'Seek medical attention.'}`,
          severity: urgencyLevel === 'emergency' ? 'critical' : 'warning',
          read: false,
        },
      });
    }

    return NextResponse.json({
      id: symptom.id,
      aiResponse: {
        ...aiResponse,
        urgency: urgencyLevel,
      },
      urgency: urgencyLevel,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/symptoms error:', error);
    return NextResponse.json({ error: 'Failed to analyze symptom' }, { status: 500 });
  }
}