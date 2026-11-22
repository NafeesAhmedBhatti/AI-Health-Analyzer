import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/get-user';
import { addDemoReport, getDemoReports, isDbConfigured } from '@/lib/demo-store';

export async function GET() {
  try {
    const userId = await getUserId();
    if (!isDbConfigured()) {
      return NextResponse.json(getDemoReports(userId));
    }
    const reports = await prisma.labReport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    const mapped = reports.map(r => ({
      id: r.id,
      fileName: r.fileName,
      title: r.fileName,
      fileType: r.fileType,
      type: r.fileType,
      date: r.reportDate?.toISOString() || r.createdAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
      status: r.aiSummary && r.aiSummary.length > 50 ? 'reviewed' : 'pending',
      aiSummary: r.aiSummary || undefined,
      extractedData: r.extractedData as any || undefined,
      flags: r.flags as any || undefined,
    }));
    return NextResponse.json(mapped);
  } catch (error) {
    console.error('GET /api/lab-reports error:', error);
    try {
      const userId = await getUserId();
      return NextResponse.json(getDemoReports(userId));
    } catch {
      return NextResponse.json([]);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await req.json();
    const { title, type } = body;

    if (!isDbConfigured()) {
      const now = new Date().toISOString();
      const demoReport = {
        id: `demo_rep_${Date.now()}`,
        fileName: title || 'Lab Report',
        title: title || 'Lab Report',
        fileType: type || 'other',
        type: type || 'other',
        date: now,
        createdAt: now,
        status: 'pending' as const,
        aiSummary: 'AI analysis pending — upload a file for automatic analysis. Note: This is not medical advice.',
      };
      addDemoReport(userId, demoReport);
      return NextResponse.json(demoReport, { status: 201 });
    }

    const report = await prisma.labReport.create({
      data: {
        userId,
        fileName: title,
        filePath: '',
        fileType: type || 'other',
        aiSummary: 'AI analysis pending — upload a file for automatic analysis. Note: This is not medical advice.',
      },
    });
    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('POST /api/lab-reports error:', error);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}
