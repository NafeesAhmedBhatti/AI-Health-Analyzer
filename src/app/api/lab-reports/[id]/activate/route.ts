import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/get-user';
import path from 'path';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await getUserId();

    const report = await prisma.labReport.findFirst({ where: { id, userId } });
    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

    // Deactivate all other reports, activate this one
    await prisma.labReport.updateMany({ where: { userId, isActive: true }, data: { isActive: false } });
    await prisma.labReport.update({ where: { id }, data: { isActive: true } });

    const flags = (report.flags as Record<string, unknown>) || {};
    const extractedData = (report.extractedData as Record<string, unknown>) || {};

    const medications = (flags.medications as any[]) || [];
    const nutrition = flags.nutrition as Record<string, unknown> || {};
    const abnormalValues = (extractedData.abnormalValues as any[]) || [];
    const conditions = (extractedData.conditions as any[]) || [];
    const symptomsToWatch = (flags.symptomsToWatch as any[]) || [];
    const mentalHealth = flags.mentalHealth as Record<string, unknown> || {};

    const hasData = medications.length > 0 || Object.keys(nutrition).length > 0 ||
      abnormalValues.length > 0 || conditions.length > 0 ||
      symptomsToWatch.length > 0 || Object.keys(mentalHealth).length > 0;

    if (hasData) {

      // ── WIPE old data and re-create from THIS report ──
      
      // Deactivate old medications, activate from this report
      await prisma.medication.updateMany({ where: { userId, active: true }, data: { active: false } });
      for (const med of medications) {
        await prisma.medication.create({
          data: { userId, name: med.name, dosage: med.dosage, frequency: med.frequency,
            startDate: new Date(),
            notes: JSON.stringify({ reason: med.reason, brandName: med.brandName, category: med.category, sideEffects: med.sideEffectsToWatch, contraindications: med.contraindications, monitoring: med.monitoringNeeded }),
            active: true },
        });
      }

      // Wipe and re-create nutrition
      await prisma.nutritionPlan.deleteMany({ where: { userId } });
      if (Object.keys(nutrition).length > 0) {
        await prisma.nutritionPlan.create({
          data: { userId,
            goals: { conditions: conditions.map((c: any) => typeof c === 'string' ? c : c.name), activeReportId: id },
            planData: nutrition as any, aiGenerated: true, validFrom: new Date() },
        });
      }

      // Re-create vitals
      const vitalsData = (flags.vitalsFromReport as Record<string, number>) || {};
      const units: Record<string, string> = { heart_rate: 'bpm', blood_pressure_systolic: 'mmHg', blood_pressure_diastolic: 'mmHg', temperature: '°C', oxygen: '%', weight: 'kg' };
      for (const [vType, value] of Object.entries(vitalsData)) {
        if (value !== null && value !== undefined && typeof value === 'number') {
          await prisma.vital.create({ data: { userId, type: vType, value, unit: units[vType] || '', recordedAt: new Date(), source: 'lab_report' } });
        }
      }

      // Mark old alerts read, create fresh from this report
      await prisma.healthAlert.updateMany({ where: { userId, read: false }, data: { read: true } });
      // Re-create from stored abnormal values + conditions
      for (const av of abnormalValues) {
        await prisma.healthAlert.create({
          data: { userId, type: av.status === 'critical' ? 'critical' : 'warning',
            title: `${av.name}: ${av.value}`,
            message: av.clinicalSignificance || `Value ${av.status}: ${av.value} (Normal: ${av.normalRange}). ${av.possibleCauses ? 'Possible causes: ' + av.possibleCauses.join(', ') : ''}`,
            severity: av.status === 'critical' ? 'critical' : 'warning', read: false },
        });
      }
      for (const cond of conditions) {
        const condName = typeof cond === 'string' ? cond : cond.name;
        const condDesc = typeof cond === 'string' ? '' : cond.description || '';
        await prisma.healthAlert.create({
          data: { userId, type: 'info', title: `Condition: ${condName}`,
            message: condDesc || `Detected condition: ${condName}. Follow up with your healthcare provider.`,
            severity: 'info', read: false },
        });
      }

      // Re-create symptom checks
      for (const sym of symptomsToWatch) {
        await prisma.symptomCheck.create({
          data: { userId,
            symptomsInput: { description: sym.name, severity: sym.severity === 'severe' ? 9 : sym.severity === 'moderate' ? 6 : 3 },
            aiResponse: { description: sym.description, when: sym.whenToExpect, redFlag: sym.redFlag, relatedCondition: sym.relatedCondition, relatedLabValue: sym.relatedLabValue },
            urgency: sym.severity },
        });
      }

      // Re-create mood/mental health
      if (Object.keys(mentalHealth).length > 0) {
        const stressNum = mentalHealth.stressLevel === 'high' ? 8 : mentalHealth.stressLevel === 'moderate' ? 5 : 2;
        await prisma.moodEntry.create({
          data: { userId,
            moodScore: mentalHealth.stressLevel === 'high' ? 2 : mentalHealth.stressLevel === 'moderate' ? 3 : 4,
            anxietyScore: stressNum, energyScore: 10 - stressNum,
            sleepQuality: typeof mentalHealth.sleepRecommendation === 'object' && mentalHealth.sleepRecommendation !== null ? (mentalHealth.sleepRecommendation as any).hours || 7 : 7,
            notes: mentalHealth.overallAssessment as string || mentalHealth.moodImpact as string || '',
            tags: { type: 'ai_generated', exercise: mentalHealth.exerciseRecommendation as any, relaxationTips: mentalHealth.relaxationTips as any, cognitiveEffects: mentalHealth.cognitiveEffects as any } },
        });
      }

      return NextResponse.json({ success: true, reportId: id });
    }

    // If no comprehensive data, still activate but don't wipe existing data
    // The report is marked active but dashboard will show limited info
    return NextResponse.json({ 
      success: true, 
      reportId: id, 
      warning: 'This report has limited analysis data. Some sections may appear empty. Re-upload the file for a complete AI analysis.' 
    });
  } catch (error) {
    console.error('Activate error:', error);
    return NextResponse.json({ error: 'Failed to activate report' }, { status: 500 });
  }
}