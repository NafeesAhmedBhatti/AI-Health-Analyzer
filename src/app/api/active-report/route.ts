import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/get-user';

export async function GET() {
  try {
    const userId = await getUserId();

    // Get active lab report
    const activeReport = await prisma.labReport.findFirst({
      where: { userId, isActive: true },
      select: { id: true, fileName: true, createdAt: true },
    });

    // Fallback: most recent reviewed report
    const report = activeReport || await prisma.labReport.findFirst({
      where: { userId, status: 'reviewed' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, fileName: true, createdAt: true },
    });

    return NextResponse.json({
      activeReport: report ? {
        id: report.id,
        fileName: report.fileName,
        createdAt: report.createdAt,
      } : null,
    });
  } catch (error) {
    console.error('GET /api/active-report error:', error);
    return NextResponse.json({ activeReport: null }, { status: 500 });
  }
}