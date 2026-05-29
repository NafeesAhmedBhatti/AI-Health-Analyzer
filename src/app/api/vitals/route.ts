import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/get-user';
import prisma from '@/lib/prisma';
import { vitalSchema } from '@/lib/validations';

// Normal ranges for anomaly detection
const NORMAL_RANGES: Record<string, { min: number; max: number; unit: string; label: string; criticalLow: number; criticalHigh: number }> = {
  heart_rate:              { min: 60,  max: 100, unit: 'bpm',  label: 'Heart Rate',           criticalLow: 40,  criticalHigh: 150 },
  blood_pressure_systolic: { min: 90,  max: 140, unit: 'mmHg', label: 'Blood Pressure (Sys)',  criticalLow: 70,  criticalHigh: 180 },
  blood_pressure_diastolic:{ min: 60,  max: 90,  unit: 'mmHg', label: 'Blood Pressure (Dia)',  criticalLow: 40,  criticalHigh: 120 },
  temperature:             { min: 36.1,max: 37.2,unit: '°C',   label: 'Temperature',           criticalLow: 35,  criticalHigh: 40 },
  oxygen:                  { min: 95,  max: 100, unit: '%',    label: 'Oxygen Saturation',     criticalLow: 90,  criticalHigh: 100 },
  weight:                  { min: 40,  max: 200, unit: 'kg',   label: 'Weight',                criticalLow: 30,  criticalHigh: 250 },
  bmi:                     { min: 18.5,max: 30,  unit: '',     label: 'BMI',                   criticalLow: 15,  criticalHigh: 50 },
  glucose:                 { min: 70,  max: 140, unit: 'mg/dL',label: 'Glucose',               criticalLow: 50,  criticalHigh: 300 },
  respiratory_rate:        { min: 12,  max: 20,  unit: '/min', label: 'Respiratory Rate',      criticalLow: 8,   criticalHigh: 30 },
};

function checkAnomaly(type: string, value: number): { isAbnormal: boolean; severity: 'normal' | 'warning' | 'critical'; message: string } | null {
  const range = NORMAL_RANGES[type];
  if (!range) return null;

  if (value < range.criticalLow) {
    return { isAbnormal: true, severity: 'critical', message: `${range.label} critically LOW: ${value} ${range.unit} (Normal: ${range.min}-${range.max})` };
  }
  if (value > range.criticalHigh) {
    return { isAbnormal: true, severity: 'critical', message: `${range.label} critically HIGH: ${value} ${range.unit} (Normal: ${range.min}-${range.max})` };
  }
  if (value < range.min) {
    return { isAbnormal: true, severity: 'warning', message: `${range.label} below normal: ${value} ${range.unit} (Normal: ${range.min}-${range.max})` };
  }
  if (value > range.max) {
    return { isAbnormal: true, severity: 'warning', message: `${range.label} above normal: ${value} ${range.unit} (Normal: ${range.min}-${range.max})` };
  }
  return { isAbnormal: false, severity: 'normal', message: '' };
}

export async function GET() {
  try {
    const userId = await getUserId();
    const vitals = await prisma.vital.findMany({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
      take: 100,
    });

    // Enrich with anomaly data
    const enriched = vitals.map(v => ({
      ...v,
      anomaly: checkAnomaly(v.type, v.value),
    }));

    // Get summary stats
    const types = [...new Set(vitals.map(v => v.type))];
    const latestByType = types.map(type => {
      const items = vitals.filter(v => v.type === type);
      const latest = items[0];
      return {
        type,
        value: latest?.value,
        unit: latest?.unit,
        recordedAt: latest?.recordedAt,
        anomaly: checkAnomaly(type, latest?.value || 0),
        count: items.length,
      };
    });

    return NextResponse.json({ vitals: enriched, summary: latestByType, ranges: NORMAL_RANGES });
  } catch (error) {
    console.error('GET /api/vitals error:', error);
    return NextResponse.json({ error: 'Failed to fetch vitals' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await req.json();
    const parsed = vitalSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    const { type, value, unit } = parsed.data;

    const vital = await prisma.vital.create({
      data: { userId, type, value, unit, recordedAt: new Date(), source: 'manual' },
    });

    // Check for anomalies and auto-create alert
    const anomaly = checkAnomaly(type, value);
    if (anomaly?.isAbnormal) {
      await prisma.healthAlert.create({
        data: {
          userId,
          type: anomaly.severity === 'critical' ? 'critical' : 'warning',
          title: anomaly.severity === 'critical' ? `⚠️ Critical: ${NORMAL_RANGES[type]?.label || type}` : `Vital Out of Range: ${NORMAL_RANGES[type]?.label || type}`,
          message: anomaly.message,
          severity: anomaly.severity,
          read: false,
        },
      });
    }

    return NextResponse.json({ ...vital, anomaly }, { status: 201 });
  } catch (error) {
    console.error('POST /api/vitals error:', error);
    return NextResponse.json({ error: 'Failed to record vital' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await getUserId();
    const { id, value } = await req.json();
    if (!id || value === undefined) return NextResponse.json({ error: 'id and value required' }, { status: 400 });

    const vital = await prisma.vital.update({
      where: { id, userId },
      data: { value },
    });
    return NextResponse.json(vital);
  } catch (error) {
    console.error('PUT /api/vitals error:', error);
    return NextResponse.json({ error: 'Failed to update vital' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await prisma.vital.delete({ where: { id, userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/vitals error:', error);
    return NextResponse.json({ error: 'Failed to delete vital' }, { status: 500 });
  }
}