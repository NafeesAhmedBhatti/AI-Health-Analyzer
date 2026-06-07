import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/get-user';

export const maxDuration = 60;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: process.env.OPENAI_BASE_URL });

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    const { message, history = [] } = await req.json();

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: 'Message required' }), { status: 400 });
    }

    // Gather user's health context for personalized responses
    const [activeReport, latestVitals, activeMeds, latestMood, recentAlerts] = await Promise.all([
      prisma.labReport.findFirst({ where: { userId, isActive: true }, orderBy: { createdAt: 'desc' } }),
      prisma.vital.findMany({ where: { userId }, orderBy: { recordedAt: 'desc' }, take: 10 }),
      prisma.medication.findMany({ where: { userId, active: true }, orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.moodEntry.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      prisma.healthAlert.findMany({ where: { userId, read: false }, orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);

    // Build health context
    const healthContext: string[] = [];
    if (activeReport) {
      const ed = activeReport.extractedData as any;
      const flags = activeReport.flags as any;
      if (ed?.healthScore) healthContext.push(`Health Score: ${ed.healthScore}/100`);
      if (ed?.conditions?.length) healthContext.push(`Conditions: ${ed.conditions.map((c: any) => typeof c === 'string' ? c : c.name).join(', ')}`);
      if (activeReport.aiSummary) healthContext.push(`Latest AI Summary: ${activeReport.aiSummary.slice(0, 500)}`);
      if (flags?.recommendations?.length) healthContext.push(`Active Recommendations: ${flags.recommendations.slice(0, 3).map((r: any) => typeof r === 'string' ? r : r.text).join('; ')}`);
    }
    if (latestVitals.length > 0) {
const vitalsStr = latestVitals
  .slice(0, 5)
  .map((v: any) => `${v.type}: ${v.value} ${v.unit}`)
  .join(', ');
      healthContext.push(`Recent Vitals: ${vitalsStr}`);
    }
    if (activeMeds.length > 0) {
healthContext.push(
  `Active Medications: ${activeMeds
    .map((m: any) => `${m.name} ${m.dosage}`)
    .join(', ')}`
);
    }
    if (latestMood) {
      healthContext.push(`Mood: ${latestMood.moodScore}/5, Anxiety: ${latestMood.anxietyScore}/10, Sleep: ${latestMood.sleepQuality}/10`);
    }
    if (recentAlerts.length > 0) {
healthContext.push(
  `Active Alerts: ${recentAlerts
    .slice(0, 3)
    .map((a: any) => a.title)
    .join(', ')}`
);
    }

    const systemPrompt = `You are **Nafexa AI** — a friendly and knowledgeable AI health companion built into the AI Health Analyzer platform. You help users understand their lab results, medications, symptoms, and overall health.

IMPORTANT RULES:
- You have access to the user's REAL health data below. Reference it naturally in conversations.
- Always remind users this is AI-generated advice, not medical diagnosis. Consult a doctor for medical decisions.
- Be warm, supportive, and clear. Use simple language.
- If asked about something not in the data, give general health information and suggest uploading a lab report.
- Keep responses concise (2-4 paragraphs max). Use bullet points for lists.
- You can explain lab values, suggest lifestyle changes, interpret trends, and answer health questions.

${healthContext.length > 0 ? `USER'S CURRENT HEALTH DATA:\n${healthContext.join('\n')}` : 'No health data uploaded yet. Encourage the user to upload a lab report.'}`;

    // Build messages array with history
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map((h: any) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    // Stream the response
    const stream = await openai.chat.completions.create({
      model: 'drytis/kimi-k2.5',
      messages,
      temperature: 0.7,
      max_tokens: 800,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: 'Chat failed' }), { status: 500 });
  }
}