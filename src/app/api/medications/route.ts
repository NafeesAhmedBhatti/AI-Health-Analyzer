import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/get-user';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const medications = await prisma.medication.findMany({
      where: { userId: await getUserId() },
      orderBy: { startDate: 'desc' },
    });
    return NextResponse.json(medications);
  } catch (error) {
    console.error('GET /api/medications error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await req.json();
    const { name, dosage, frequency, startDate, notes } = body;
    const medication = await prisma.medication.create({
      data: { userId, name, dosage, frequency, startDate: startDate ? new Date(startDate) : new Date(), notes, active: true },
    });
    return NextResponse.json(medication, { status: 201 });
  } catch (error) {
    console.error('POST /api/medications error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}