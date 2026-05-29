import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/get-user';
import prisma from '@/lib/prisma';
import { moodSchema } from '@/lib/validations';

export async function GET() {
  try {
    const entries = await prisma.moodEntry.findMany({
      where: { userId: await getUserId() },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    return NextResponse.json(entries.map((e) => {
      const tags = (e.tags as any) || {};
      return {
        id: e.id,
        moodScore: e.moodScore,
        anxietyScore: e.anxietyScore,
        energyScore: e.energyScore,
        sleepQuality: e.sleepQuality,
        notes: e.notes,
        tags: e.tags,
        createdAt: e.createdAt,
      };
    }));
  } catch (error) {
    console.error('GET /api/mental-health error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = moodSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    const { mood, note, stress, sleep } = parsed.data;
    const entry = await prisma.moodEntry.create({
      data: {
        userId: await getUserId(),
        moodScore: mood,
        anxietyScore: stress,
        sleepQuality: sleep,
        notes: note || null,
      },
    });
    return NextResponse.json({ id: entry.id }, { status: 201 });
  } catch (error) {
    console.error('POST /api/mental-health error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}