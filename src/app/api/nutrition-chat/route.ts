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

    // Gather nutrition-specific health context
    const [activeReport, nutritionPlan, activeMeds, latestVitals, recentAlerts] = await Promise.all([
      prisma.labReport.findFirst({ where: { userId, isActive: true }, orderBy: { createdAt: 'desc' } }),
      prisma.nutritionPlan.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      prisma.medication.findMany({ where: { userId, active: true }, orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.vital.findMany({ where: { userId }, orderBy: { recordedAt: 'desc' }, take: 10 }),
      prisma.healthAlert.findMany({ where: { userId, read: false }, orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);

    // Build nutrition-focused health context
    const healthContext: string[] = [];

    if (activeReport) {
      const ed = activeReport.extractedData as any;
      const flags = activeReport.flags as any;
      if (ed?.healthScore) healthContext.push(`Health Score: ${ed.healthScore}/100`);
      if (ed?.conditions?.length) healthContext.push(`Detected Conditions: ${ed.conditions.map((c: any) => typeof c === 'string' ? c : c.name).join(', ')}`);
      if (ed?.abnormalValues?.length) {
        const abnormalStr = ed.abnormalValues.slice(0, 8).map((v: any) => `${v.name}: ${v.value} (${v.status})`).join(', ');
        healthContext.push(`Abnormal Lab Values: ${abnormalStr}`);
      }
      if (flags?.recommendations?.length) healthContext.push(`Medical Recommendations: ${flags.recommendations.slice(0, 3).map((r: any) => typeof r === 'string' ? r : r.text).join('; ')}`);
    }

    if (nutritionPlan) {
      const pd = nutritionPlan.planData as any;
      if (pd) {
        healthContext.push(`Current Nutrition Plan: ${JSON.stringify(pd).slice(0, 1000)}`);
      }
    }

    if (activeMeds.length > 0) {
      healthContext.push(`Active Medications: ${activeMeds.map(m => `${m.name} ${m.dosage}`).join(', ')}`);
    }

    if (latestVitals.length > 0) {
      const vitalsStr = latestVitals.slice(0, 6).map(v => `${v.type}: ${v.value} ${v.unit}`).join(', ');
      healthContext.push(`Recent Vitals: ${vitalsStr}`);
    }

    if (recentAlerts.length > 0) {
      healthContext.push(`Active Health Alerts: ${recentAlerts.slice(0, 3).map(a => a.title).join(', ')}`);
    }

    const systemPrompt = `You are **Nafexa AI** — a specialized AI nutrition and diet assistant built into the AI Health Analyzer platform. You are warm, knowledgeable, and passionate about helping users achieve their health goals through proper nutrition.

YOUR PERSONALITY:
- You introduce yourself as "Nafexa AI" when relevant
- You are encouraging, supportive, and never judgmental about food choices
- You explain nutritional concepts in simple, easy-to-understand language
- You use emojis occasionally to make conversations friendly (🥗🍎💪🌿)
- You remember context from the conversation

YOUR EXPERTISE:
- Creating complete, detailed diet plans based on user's health conditions
- Suggesting meal plans for specific conditions (diabetes, heart disease, anemia, etc.)
- Recommending foods based on lab values and deficiencies
- Explaining how nutrients affect the body and lab results
- Providing calorie-specific meal plans with macro breakdowns
- Suggesting alternatives for restricted foods
- Creating weekly meal plans with recipes and portions
- Recommending supplements based on deficiencies

IMPORTANT RULES:
- You have access to the user's REAL health data and lab results below — use it to give personalized nutrition advice
- Always reference their specific conditions and lab values when relevant
- When asked for a diet plan, provide a COMPLETE plan with:
  * Daily calorie target and macro split (protein/carbs/fats)
  * Meal-by-meal breakdown (breakfast, lunch, dinner, snacks)
  * Specific food items with approximate portions
  * Foods to add and foods to avoid
  * Any supplement recommendations
  * A brief weekly outline if requested
- Always add a disclaimer that this is AI-generated advice and they should consult a dietitian
- Keep responses well-structured with headers and bullet points for readability
- If asked about something outside nutrition, gently redirect to nutrition topics
- Be specific — give exact food names, portions, and timings rather than vague advice

${healthContext.length > 0 ? `USER'S CURRENT HEALTH DATA:\n${healthContext.join('\n')}` : 'No health data uploaded yet. Ask the user to upload a lab report for personalized nutrition advice.'}`;

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
      max_tokens: 1200,
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
    console.error('Nutrition chat error:', error);
    return new Response(JSON.stringify({ error: 'Chat failed' }), { status: 500 });
  }
}