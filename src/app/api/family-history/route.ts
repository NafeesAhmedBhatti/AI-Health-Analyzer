import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/get-user';
import prisma from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: process.env.OPENAI_BASE_URL });

export async function GET() {
  try {
    const userId = await getUserId();
    const members = await prisma.familyHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Get AI hereditary risk analysis if there are family members
    let riskAnalysis: any = null;
    if (members.length > 0) {
      try {
        const familyData = members.map(m => `${m.relation}: ${typeof m.conditions === 'string' ? m.conditions : JSON.stringify(m.conditions)}`).join('\n');
        // Get user's own conditions
        const user = await prisma.user.findUnique({ where: { id: userId }, include: { healthProfile: true } });
        const userConditions = user?.healthProfile?.chronicConditions ? JSON.stringify(user.healthProfile.chronicConditions) : 'None';

        const aiResult = await openai.chat.completions.create({
          model: 'drytis/kimi-k2.5',
          temperature: 0.2,
          max_tokens: 800,
          messages: [{
            role: 'system',
            content: 'You are a genetic counselor AI. Analyze family history for hereditary risk patterns. Return ONLY valid JSON.'
          }, {
            role: 'user',
            content: `Analyze this family health history for hereditary risk:
${familyData}
Patient's own conditions: ${userConditions}

Return JSON: {"riskFactors":[{"condition":"name","risk":"low|moderate|high","explanation":"why","screeningRecommendation":"when/how often"}],"overallRisk":"low|moderate|high","summary":"2-3 sentence assessment","preventiveMeasures":["measure1","measure2","measure3"]}`
          }]
        });
        const text = aiResult.choices?.[0]?.message?.content || '{}';
        const match = text.match(/\{[\s\S]*\}/);
        if (match) riskAnalysis = JSON.parse(match[0]);
      } catch (e) {
        console.error('Family risk AI error:', e);
      }
    }

    return NextResponse.json({
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        relation: m.relation,
        conditions: typeof m.conditions === 'string' ? m.conditions : JSON.stringify(m.conditions),
        side: m.side,
        createdAt: m.createdAt,
      })),
      riskAnalysis,
    });
  } catch (error) {
    console.error('GET /api/family-history error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    const { name, relation, conditions, side } = await req.json();
    if (!relation) return NextResponse.json({ error: 'Relation is required' }, { status: 400 });

    const member = await prisma.familyHistory.create({
      data: {
        userId,
        name: name || null,
        relation,
        conditions: conditions ? conditions.split(',').map((c: string) => c.trim()).filter(Boolean) : [],
        side: side || null,
      },
    });
    return NextResponse.json({
      id: member.id,
      name: member.name,
      relation: member.relation,
      conditions: typeof member.conditions === 'string' ? member.conditions : JSON.stringify(member.conditions),
      side: member.side,
      createdAt: member.createdAt,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/family-history error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await prisma.familyHistory.delete({ where: { id, userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/family-history error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}