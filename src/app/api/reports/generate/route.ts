import { NextRequest, NextResponse } from 'next/server';

import { getUserId } from '@/lib/get-user';
import prisma from '@/lib/prisma';
import { generatePDF } from '@/lib/pdf-generator';

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const userName = user?.name || 'Health User';

    // Gather user data for report
    const [vitals, symptoms, moodEntries, medications, labReports] = await Promise.all([
      prisma.vital.findMany({ where: { userId }, orderBy: { recordedAt: 'desc' }, take: 10 }),
      prisma.symptomCheck.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.moodEntry.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.medication.findMany({ where: { userId }, take: 10 }),
      prisma.labReport.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);

    const sections = [];

    if (vitals.length > 0) {
      sections.push({
        heading: 'Vital Signs Summary',
        content: `Last ${vitals.length} recorded readings across all vital types.`,
        data: vitals.map((v) => ({
          Type: v.type,
          Value: `${v.value} ${v.unit}`,
          Date: new Date(v.recordedAt).toLocaleDateString(),
        })),
      });
    }

    if (symptoms.length > 0) {
      sections.push({
        heading: 'Symptom History',
        content: `Recent symptom checks with AI analysis.`,
        data: symptoms.map((s) => ({
          Symptoms: String((s.symptomsInput as any)?.description || '').substring(0, 40),
          Severity: String((s.symptomsInput as any)?.severity || '-'),
          Urgency: s.urgency || '-',
          Date: new Date(s.createdAt).toLocaleDateString(),
        })),
      });
    }

    if (moodEntries.length > 0) {
      const avgMood = (moodEntries.reduce((s, e) => s + e.moodScore, 0) / moodEntries.length).toFixed(1);
      const avgStress = (moodEntries.reduce((s, e) => s + (e.anxietyScore || 0), 0) / moodEntries.length).toFixed(1);
      sections.push({
        heading: 'Mental Health Overview',
        content: `Average mood: ${avgMood}/5, Average stress: ${avgStress}/10 across ${moodEntries.length} entries.`,
        data: moodEntries.slice(0, 5).map((e) => ({
          Mood: `${e.moodScore}/5`,
          Stress: `${e.anxietyScore || '-'}/10`,
          Sleep: `${e.sleepQuality || '-'}h`,
          Date: new Date(e.createdAt).toLocaleDateString(),
        })),
      });
    }

    if (medications.length > 0) {
      sections.push({
        heading: 'Current Medications',
        content: `${medications.length} medication(s) on file.`,
        data: medications.map((m) => ({
          Name: m.name,
          Dosage: m.dosage,
          Frequency: m.frequency,
        })),
      });
    }

    if (labReports.length > 0) {
      sections.push({
        heading: 'Lab Reports',
        content: `${labReports.length} lab report(s) on file.`,
        data: labReports.map((r) => ({
          Title: r.fileName,
          Type: r.fileType || '-',
          Status: r.aiSummary ? 'Reviewed' : 'Pending',
          Date: new Date(r.reportDate || r.createdAt).toLocaleDateString(),
        })),
      });
    }

    if (sections.length === 0) {
      sections.push({
        heading: 'No Data Yet',
        content: 'Start using AI Health Analyzer to build your health profile. Record vitals, log symptoms, and track your mood to see comprehensive insights here.',
      });
    }

    const title = `Health Report — ${new Date().toLocaleDateString()}`;
    const reportData = {
      title,
      type: 'comprehensive',
      generatedAt: new Date().toISOString(),
      userName,
      sections,
    };

    // Store report metadata in DB
    const report = await prisma.healthReport.create({
      data: {
        userId,
        title,
        reportType: 'comprehensive',
        data: { summary: sections.map((s) => s.content).join(' ') },
      },
    });

    // Generate PDF
    const pdfBuffer = generatePDF(reportData);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="health-report-${new Date().toISOString().slice(0, 10)}.pdf"`,
      },
    });
  } catch (error) {
    console.error('POST /api/reports/generate error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}