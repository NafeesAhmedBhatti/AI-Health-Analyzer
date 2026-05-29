import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getUserId } from '@/lib/get-user';

export async function GET() {
  try {
    const userId = await getUserId();

    // Get health scores from lab reports over time
    const labReports = await prisma.labReport.findMany({
      where: { userId, extractedData: { not: Prisma.DbNull } },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        fileName: true,
        createdAt: true,
        extractedData: true,
        status: true,
      },
    });

    const scores = labReports.map(r => {
      const data = r.extractedData as any;
      return {
        id: r.id,
        fileName: r.fileName,
        date: r.createdAt,
        score: data?.healthScore || 0,
        conditions: data?.conditions || [],
      };
    }).filter(s => s.score > 0);

    // Current score (latest)
    const currentScore = scores.length > 0 ? scores[scores.length - 1].score : 75;

    // Score trend
    const trend = scores.length >= 2
      ? scores[scores.length - 1].score - scores[scores.length - 2].score
      : 0;

    // Get vitals summary for real-time scoring
    const latestVitals = await prisma.vital.findMany({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
      take: 20,
    });

    // Calculate real-time penalty/bonus from vitals
    let vitalBonus = 0;
    const vitalTypes = [...new Set(latestVitals.map(v => v.type))];
    vitalTypes.forEach(type => {
      const latest = latestVitals.find(v => v.type === type);
      if (!latest) return;
      const ranges: Record<string, { min: number; max: number }> = {
        heart_rate: { min: 60, max: 100 },
        blood_pressure_systolic: { min: 90, max: 140 },
        blood_pressure_diastolic: { min: 60, max: 90 },
        oxygen: { min: 95, max: 100 },
        glucose: { min: 70, max: 140 },
        bmi: { min: 18.5, max: 30 },
        temperature: { min: 36.1, max: 37.2 },
      };
      const r = ranges[type];
      if (r && latest.value >= r.min && latest.value <= r.max) {
        vitalBonus += 2; // bonus for each normal vital
      } else if (r) {
        vitalBonus -= 3; // penalty for abnormal
      }
    });

    const adjustedScore = Math.max(0, Math.min(100, currentScore + vitalBonus));

    return NextResponse.json({
      currentScore: adjustedScore,
      trend,
      scores,
      vitalBonus,
    });
  } catch (error) {
    console.error('GET /api/health-score error:', error);
    return NextResponse.json({ error: 'Failed to fetch health score' }, { status: 500 });
  }
}