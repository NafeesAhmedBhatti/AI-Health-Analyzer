import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/get-user';

export async function GET() {
  try {
    const userId = await getUserId();
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
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await req.json();
    const { title, type } = body;

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