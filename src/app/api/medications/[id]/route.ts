import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/get-user';
import prisma from '@/lib/prisma';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await getUserId();
    const med = await prisma.medication.findFirst({ where: { id, userId } });
    if (!med) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.medication.update({ where: { id }, data: { active: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/medications/[id] error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await getUserId();
    const med = await prisma.medication.findFirst({ where: { id, userId } });
    if (!med) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(med);
  } catch (error) {
    console.error('GET /api/medications/[id] error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}