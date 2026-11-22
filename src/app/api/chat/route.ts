import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/get-user';
import { generateAIResponse, ChatMessage } from '@/lib/ai-client';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const { message, history = [] } = await req.json();

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: 'Message required' }), { status: 400 });
    }

    const healthContext: string[] = [];

    // Gather user's health context safely (works even if DB isn't attached)
    try {
      if (process.env.DATABASE_URL?.startsWith('mysql://')) {
        const [activeReport, latestVitals, activeMeds, latestMood, recentAlerts] = await Promise.all([
          prisma.labReport.findFirst({ where: { userId, isActive: true }, orderBy: { createdAt: 'desc' } }),
          prisma.vital.findMany({ where: { userId }, orderBy: { recordedAt: 'desc' }, take: 10 }),
          prisma.medication.findMany({ where: { userId, active: true }, orderBy: { createdAt: 'desc' }, take: 10 }),
          prisma.moodEntry.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
          prisma.healthAlert.findMany({ where: { userId, read: false }, orderBy: { createdAt: 'desc' }, take: 5 }),
        ]);

        if (activeReport) {
          const ed = activeReport.extractedData as any;
          const flags = activeReport.flags as any;
          if (ed?.healthScore) healthContext.push(`Health Score: ${ed.healthScore}/100`);
          if (ed?.conditions?.length) healthContext.push(`Conditions: ${ed.conditions.map((c: any) => typeof c === 'string' ? c : c.name).join(', ')}`);
          if (activeReport.aiSummary) healthContext.push(`Latest AI Summary: ${activeReport.aiSummary.slice(0, 500)}`);
          if (flags?.recommendations?.length) healthContext.push(`Active Recommendations: ${flags.recommendations.slice(0, 3).map((r: any) => typeof r === 'string' ? r : r.text).join('; ')}`);
        }
        if (latestVitals.length > 0) {
          healthContext.push(`Recent Vitals: ${latestVitals.slice(0, 5).map((v: any) => `${v.type}: ${v.value} ${v.unit}`).join(', ')}`);
        }
        if (activeMeds.length > 0) {
          healthContext.push(`Active Medications: ${activeMeds.map((m: any) => `${m.name} ${m.dosage}`).join(', ')}`);
        }
        if (latestMood) {
          healthContext.push(`Mood: ${latestMood.moodScore}/5, Anxiety: ${latestMood.anxietyScore}/10, Sleep: ${latestMood.sleepQuality}/10`);
        }
        if (recentAlerts.length > 0) {
          healthContext.push(`Active Alerts: ${recentAlerts.slice(0, 3).map((a: any) => a.title).join(', ')}`);
        }
      }
    } catch {
      // Fallback gracefully when DB is offline
    }

    const systemPrompt = `You are Nafexa AI — a friendly, concise, and knowledgeable AI health companion built into the AI Health Analyzer platform.

IMPORTANT RULES:
- Remind users briefly that this is AI-generated guidance, not a medical diagnosis.
- Be warm, clear, and concise (2-3 short paragraphs max). Use bullet points for lists.
- Answer directly what the user asked without unnecessary filler.

${healthContext.length > 0 ? `USER'S CURRENT HEALTH DATA:\n${healthContext.join('\n')}` : 'No lab reports uploaded yet. Give helpful general health guidance and invite the user to upload a report if relevant.'}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map((h: any) => ({ role: h.role as 'user' | 'assistant', content: String(h.content || '') })),
      { role: 'user', content: message },
    ];

    const replyText = await generateAIResponse(messages, { temperature: 0.6, maxTokens: 900 });

    // Stream back cleanly in chunks so existing streaming UI works seamlessly
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(replyText));
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: 'Chat failed. Please try again.' }), { status: 500 });
  }
}
