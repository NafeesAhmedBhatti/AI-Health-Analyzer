import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/get-user';

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(req.url);
    const id1 = searchParams.get('id1');
    const id2 = searchParams.get('id2');

    if (!id1 || !id2) {
      return NextResponse.json({ error: 'Two report IDs required' }, { status: 400 });
    }

    const [report1, report2] = await Promise.all([
      prisma.labReport.findFirst({ where: { id: id1, userId } }),
      prisma.labReport.findFirst({ where: { id: id2, userId } }),
    ]);

    if (!report1 || !report2) {
      return NextResponse.json({ error: 'Report(s) not found' }, { status: 404 });
    }

    const extract = (r: any) => {
      const ed = r.extractedData as any || {};
      const fl = r.flags as any || {};
      return {
        id: r.id,
        fileName: r.fileName,
        date: r.createdAt.toISOString(),
        healthScore: ed.healthScore || null,
        aiSummary: r.aiSummary || '',
        conditions: ed.conditions || [],
        abnormalValues: ed.abnormalValues || [],
        recommendations: fl.recommendations || [],
        medications: fl.medications || [],
        vitalsFromReport: fl.vitalsFromReport || {},
        symptomsToWatch: fl.symptomsToWatch || [],
      };
    };

    return NextResponse.json({ report1: extract(report1), report2: extract(report2) });
  } catch (error: any) {
    console.error('Compare error:', error);
    return NextResponse.json({ error: 'Comparison failed' }, { status: 500 });
  }
}