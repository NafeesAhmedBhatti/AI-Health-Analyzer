import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/get-user';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions).catch(() => null);
    const fallbackUser = {
      id: (session?.user as any)?.id || 'demo_user_001',
      name: session?.user?.name || 'Nafees Demo',
      email: session?.user?.email || 'demo@aihealth.app',
      gender: null,
      dateOfBirth: null,
    };

    if (!process.env.DATABASE_URL?.startsWith('mysql://')) {
      return NextResponse.json({
        user: fallbackUser,
        name: fallbackUser.name,
        heightCm: 175,
        weightKg: 70,
        chronicConditions: '',
        medicationsList: '',
      });
    }

    const userId = await getUserId();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, gender: true, dateOfBirth: true },
    });
    if (!user) {
      return NextResponse.json({ user: fallbackUser, name: fallbackUser.name, heightCm: 0, weightKg: 0, chronicConditions: '', medicationsList: '' });
    }
    const profile = await prisma.healthProfile.findUnique({
      where: { userId },
    });
    return NextResponse.json({
      user,
      name: user.name,
      heightCm: profile?.heightCm || 0,
      weightKg: profile?.weightKg || 0,
      chronicConditions: profile?.chronicConditions ? JSON.stringify(profile.chronicConditions) : '',
      medicationsList: profile?.medicationsList ? JSON.stringify(profile.medicationsList) : '',
    });
  } catch (error) {
    console.warn('GET /api/profile fallback:', error);
    return NextResponse.json({
      user: { id: 'demo_user_001', name: 'Nafees Demo', email: 'demo@aihealth.app' },
      name: 'Nafees Demo',
      heightCm: 175,
      weightKg: 70,
      chronicConditions: '',
      medicationsList: '',
    });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await getUserId();
    const data = await req.json();
    await prisma.user.update({
      where: { id: userId },
      data: { name: data.name, gender: data.gender, dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined },
    });
    await prisma.healthProfile.upsert({
      where: { userId },
      update: { heightCm: data.heightCm, weightKg: data.weightKg, chronicConditions: data.chronicConditions || {}, medicationsList: data.medicationsList || {} },
      create: { userId, heightCm: data.heightCm, weightKg: data.weightKg, chronicConditions: data.chronicConditions || {}, medicationsList: data.medicationsList || {} },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}