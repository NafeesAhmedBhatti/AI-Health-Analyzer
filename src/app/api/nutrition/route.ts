import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/get-user';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const userId = await getUserId();
    const plans = await prisma.nutritionPlan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    return NextResponse.json(plans.map(p => ({
      id: p.id,
      goals: p.goals,
      planData: p.planData,
      aiGenerated: p.aiGenerated,
      validFrom: p.validFrom,
      createdAt: p.createdAt,
    })));
  } catch (error) {
    console.error('GET /api/nutrition error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    const { name, calories, protein, carbs, fat } = await req.json();
    const entry = await prisma.nutritionPlan.create({
      data: {
        userId,
        goals: {},
        planData: { name, calories, protein, carbs, fat },
      },
    });
    return NextResponse.json({
      id: entry.id, name, calories, protein, carbs, fat, createdAt: entry.createdAt,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/nutrition error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}