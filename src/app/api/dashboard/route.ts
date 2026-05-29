import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/get-user';

export async function GET() {
  try {
    const userId = await getUserId();

    // Get active lab report
    const activeReport = await prisma.labReport.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    // Fallback: if no report is explicitly active, use the most recent reviewed one
    const report = activeReport || await prisma.labReport.findFirst({
      where: { userId, status: 'reviewed' },
      orderBy: { createdAt: 'desc' },
    });

    const extractedData = (report?.extractedData as Record<string, unknown>) || {};
    const flags = (report?.flags as Record<string, unknown>) || {};
    const abnormalValues = (extractedData.abnormalValues as any[]) || [];
    const normalValues = (extractedData.normalValues as any[]) || [];
    const conditions = (extractedData.conditions as any[]) || [];

    // Health Score — directly from AI analysis, or calculate from data
    const healthScore = (extractedData.healthScore as number) ??
      calculateHealthScore(abnormalValues, normalValues);

    // AI Insight — from report summary (clean any raw JSON/markdown)
    let aiInsight = report?.aiSummary || 'Upload a lab report for detailed AI analysis.';
    // Strip markdown code fences if present (including leading/trailing whitespace)
    aiInsight = aiInsight.replace(/\s*```(?:json)?\s*/gi, '').trim();
    // If it looks like raw JSON, try to extract just the summary
    if (aiInsight.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(aiInsight.trim());
        if (parsed.summary) aiInsight = parsed.summary;
      } catch {
        // If JSON parse fails, try to extract summary with regex
        const summaryMatch = aiInsight.match(/"summary"\s*:\s*"([^"]+)"/);
        if (summaryMatch) aiInsight = summaryMatch[1];
      }
    }

    // Recommendations — from flags
    const recommendations = (flags.recommendations as any[]) || [];

    // Ensure recommendations are properly structured
    const cleanRecommendations = (recommendations as any[]).map((rec: any) => {
      if (typeof rec === 'string') return { text: rec, urgency: 'routine', category: '', evidence: '' };
      return rec;
    });

    // Ensure conditions are properly structured
    const cleanConditions = conditions.map((cond: any) => {
      if (typeof cond === 'string') return { name: cond, severity: 'moderate', description: '' };
      return cond;
    });

    // Stats from DB
    const [latestVital, activeMeds, unreadAlerts, totalReports, recentReports] = await Promise.all([
      prisma.vital.findFirst({ where: { userId }, orderBy: { recordedAt: 'desc' } }),
      prisma.medication.count({ where: { userId, active: true } }),
      prisma.healthAlert.count({ where: { userId, read: false } }),
      prisma.labReport.count({ where: { userId } }),
      prisma.labReport.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5,
        select: { id: true, fileName: true, fileType: true, status: true, createdAt: true } }),
    ]);

    // Build vitals from latest entries per type
    const vitalsFromReport = (flags.vitalsFromReport as Record<string, number>) || {};
    const latestVitals: Record<string, number> = {};
    // Use lab report vitals if available, else DB vitals
    if (Object.keys(vitalsFromReport).length > 0) {
      for (const [k, v] of Object.entries(vitalsFromReport)) {
        if (v !== null && v !== undefined) latestVitals[k] = v;
      }
    }
    // Also check DB for any additional vitals
    const dbVitals = await prisma.vital.findMany({
      where: { userId }, orderBy: { recordedAt: 'desc' }, take: 20,
    });
    for (const v of dbVitals) {
      if (!(v.type in latestVitals) && v.value !== null) latestVitals[v.type] = v.value;
    }

    // Alerts from DB (recent, unread)
    const alerts = await prisma.healthAlert.findMany({
      where: { userId, read: false }, orderBy: { createdAt: 'desc' }, take: 10,
      select: { id: true, title: true, message: true, severity: true, type: true, createdAt: true },
    });

    return NextResponse.json({
      healthScore,
      aiInsight,
      confidence: (extractedData.confidence as number) || 0.5,
      recommendations: cleanRecommendations,
      conditions: cleanConditions,
      abnormalValues,
      activeReport: report ? {
        id: report.id, fileName: report.fileName,
        fileType: report.fileType, createdAt: report.createdAt,
      } : null,
      stats: {
        heartRate: latestVitals.heart_rate ?? null,
        bloodPressure: latestVitals.blood_pressure_systolic && latestVitals.blood_pressure_diastolic
          ? `${latestVitals.blood_pressure_systolic}/${latestVitals.blood_pressure_diastolic}` : null,
        bloodPressureSys: latestVitals.blood_pressure_systolic ?? null,
        bloodPressureDia: latestVitals.blood_pressure_diastolic ?? null,
        oxygenLevel: latestVitals.oxygen ?? null,
        weight: latestVitals.weight ?? null,
        temperature: latestVitals.temperature ?? null,
        bmi: latestVitals.bmi ?? null,
        activeMedications: activeMeds,
        unreadAlerts,
        totalLabReports: totalReports,
      },
      labReports: recentReports,
      alerts,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}

function calculateHealthScore(abnormal: any[], normal: any[]): number {
  if (abnormal.length === 0 && normal.length === 0) return 75;
  const total = abnormal.length + normal.length;
  const normalRatio = normal.length / total;
  let penalty = 0;
  for (const av of abnormal) {
    if (av.status === 'critical') penalty += 15;
    else if (av.status === 'high' || av.status === 'low') penalty += 8;
    else penalty += 4;
  }
  return Math.max(10, Math.min(100, Math.round(normalRatio * 100 - penalty)));
}