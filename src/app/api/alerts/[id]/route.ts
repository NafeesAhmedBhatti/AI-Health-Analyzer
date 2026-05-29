import { NextRequest, NextResponse } from 'next/server';

import { getUserId } from '@/lib/get-user';
import prisma from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
        const { id } = await params;
    const userId = await getUserId();
    // Verify ownership before updating
    const alert = await prisma.healthAlert.findFirst({ where: { id, userId } });
    if (!alert) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = await prisma.healthAlert.update({
      where: { id },
      data: { read: true },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH /api/alerts/[id] error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}