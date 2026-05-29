import { NextRequest, NextResponse } from 'next/server';

import { getUserId } from '@/lib/get-user';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
        const alerts = await prisma.healthAlert.findMany({
      where: { userId: await getUserId() },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json(alerts);
  } catch (error) {
    console.error('GET /api/alerts error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
        const { type, message, severity } = await req.json();
    const alert = await prisma.healthAlert.create({
      data: { userId: await getUserId(), type, title: type, message, severity: severity || 'info', read: false },
    });
    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error('POST /api/alerts error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}