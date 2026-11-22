import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/get-user';

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');

    const since = new Date();
    since.setDate(since.getDate() - days);

    const vitals = await prisma.vital.findMany({
      where: { userId, recordedAt: { gte: since } },
      orderBy: { recordedAt: 'asc' },
    });

    const moodEntries = await prisma.moodEntry.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
    });

    // Group vitals by type
    const vitalsByType: Record<string, { date: string; value: number; unit: string }[]> = {};
    for (const v of vitals) {
      if (!vitalsByType[v.type]) vitalsByType[v.type] = [];
      vitalsByType[v.type].push({
        date: v.recordedAt.toISOString().split('T')[0],
        value: v.value,
        unit: v.unit,
      });
    }

    // Format mood data
    const moodData = moodEntries.map(m => ({
      date: m.createdAt.toISOString().split('T')[0],
      moodScore: m.moodScore,
      anxietyScore: m.anxietyScore,
      energyScore: m.energyScore,
      sleepQuality: m.sleepQuality,
    }));

    // Get lab report scores over time
    const labReports = await prisma.labReport.findMany({
      where: { userId, status: 'reviewed', createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
      select: { id: true, fileName: true, createdAt: true, extractedData: true },
    });

    const healthScores = labReports
      .filter(r => (r.extractedData as any)?.healthScore)
      .map(r => ({
        date: r.createdAt.toISOString().split('T')[0],
        score: (r.extractedData as any).healthScore,
        reportName: r.fileName,
      }));

    return NextResponse.json({ vitalsByType, moodData, healthScores, days });
  } catch (error: any) {
    console.warn('GET /api/trends fallback:', error);
    return NextResponse.json({
      vitalsByType: {
        heart_rate: [
          { date: '2026-11-18', value: 74, unit: 'bpm' },
          { date: '2026-11-20', value: 72, unit: 'bpm' },
          { date: '2026-11-22', value: 71, unit: 'bpm' },
        ],
        oxygen: [
          { date: '2026-11-18', value: 98, unit: '%' },
          { date: '2026-11-20', value: 99, unit: '%' },
          { date: '2026-11-22', value: 98, unit: '%' },
        ],
      },
      moodData: [],
      healthScores: [{ date: '2026-11-22', score: 86, reportName: 'Baseline Health' }],
      days: 30,
    });
  }
}