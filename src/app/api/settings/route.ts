import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId, getCurrentUser } from '@/lib/get-user';

export async function GET() {
  try {
    const userId = await getUserId();
    const user = await getCurrentUser();

    const settings = await prisma.userSettings.findUnique({ where: { userId } });
    const healthProfile = await prisma.healthProfile.findUnique({ where: { userId } });
    const fullUser = await prisma.user.findUnique({ where: { id: userId } });

    return NextResponse.json({
      user: {
        id: fullUser?.id,
        name: fullUser?.name || '',
        email: fullUser?.email || '',
        phone: fullUser?.phone || '',
        avatarUrl: fullUser?.avatarUrl || '',
        dateOfBirth: fullUser?.dateOfBirth?.toISOString() || null,
        gender: fullUser?.gender || '',
      },
      healthProfile: {
        bloodType: healthProfile?.bloodType || '',
        heightCm: healthProfile?.heightCm || null,
        weightKg: healthProfile?.weightKg || null,
        allergies: healthProfile?.allergies || [],
        emergencyContact: healthProfile?.emergencyContact || {},
      },
      settings: settings ? {
        units: settings.units,
        language: settings.language,
        theme: settings.theme,
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        weeklyReportEmail: settings.weeklyReportEmail,
        criticalAlertsOnly: settings.criticalAlertsOnly,
        shareDataWithDoctor: settings.shareDataWithDoctor,
        dataRetentionDays: settings.dataRetentionDays,
        aiModelPreference: settings.aiModelPreference,
      } : {
        units: 'metric',
        language: 'en',
        theme: 'dark',
        emailNotifications: true,
        pushNotifications: true,
        weeklyReportEmail: true,
        criticalAlertsOnly: false,
        shareDataWithDoctor: false,
        dataRetentionDays: 365,
        aiModelPreference: 'balanced',
      },
    });
  } catch (error: any) {
    console.error('GET /api/settings error:', error);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await req.json();
    const { section, data } = body;

    if (section === 'account') {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.phone !== undefined && { phone: data.phone || null }),
          ...(data.dateOfBirth !== undefined && { dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null }),
          ...(data.gender !== undefined && { gender: data.gender || null }),
        },
      });
    }

    else if (section === 'healthProfile') {
      await prisma.healthProfile.upsert({
        where: { userId },
        update: {
          ...(data.bloodType !== undefined && { bloodType: data.bloodType || null }),
          ...(data.heightCm !== undefined && { heightCm: data.heightCm ? parseFloat(data.heightCm) : null }),
          ...(data.weightKg !== undefined && { weightKg: data.weightKg ? parseFloat(data.weightKg) : null }),
          ...(data.allergies !== undefined && { allergies: data.allergies }),
          ...(data.emergencyContact !== undefined && { emergencyContact: data.emergencyContact }),
        },
        create: {
          userId,
          bloodType: data.bloodType || null,
          heightCm: data.heightCm ? parseFloat(data.heightCm) : null,
          weightKg: data.weightKg ? parseFloat(data.weightKg) : null,
          allergies: data.allergies || [],
          emergencyContact: data.emergencyContact || {},
        },
      });
    }

    else if (section === 'preferences' || section === 'notifications' || section === 'privacy') {
      await prisma.userSettings.upsert({
        where: { userId },
        update: { ...data },
        create: { userId, ...data },
      });
    }

    else if (section === 'exportData') {
      // Export all user data as JSON
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const hp = await prisma.healthProfile.findUnique({ where: { userId } });
      const vitals = await prisma.vital.findMany({ where: { userId }, orderBy: { recordedAt: 'desc' }, take: 100 });
      const labs = await prisma.labReport.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
      const meds = await prisma.medication.findMany({ where: { userId } });
      const alerts = await prisma.healthAlert.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 100 });
      const nutrition = await prisma.nutritionPlan.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 10 });
      const symptoms = await prisma.symptomCheck.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 });
      const mood = await prisma.moodEntry.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 });

      return NextResponse.json({
        exportedAt: new Date().toISOString(),
        user: { name: user?.name, email: user?.email, phone: user?.phone, dateOfBirth: user?.dateOfBirth, gender: user?.gender },
        healthProfile: hp,
        vitals, labReports: labs, medications: meds, alerts,
        nutritionPlans: nutrition, symptoms, moodEntries: mood,
      });
    }

    else if (section === 'clearData') {
      // Clear all health data but keep the user account
      await prisma.medication.deleteMany({ where: { userId } });
      await prisma.healthAlert.deleteMany({ where: { userId } });
      await prisma.nutritionPlan.deleteMany({ where: { userId } });
      await prisma.symptomCheck.deleteMany({ where: { userId } });
      await prisma.moodEntry.deleteMany({ where: { userId } });
      await prisma.vital.deleteMany({ where: { userId } });
      await prisma.labReport.deleteMany({ where: { userId } });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('PUT /api/settings error:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}