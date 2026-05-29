import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/get-user';

export async function GET() {
  try {
    const userId = await getUserId();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, gender: true, dateOfBirth: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const profile = await prisma.healthProfile.findUnique({
      where: { userId },
    });
    return NextResponse.json({
      user,
      heightCm: profile?.heightCm || 0,
      weightKg: profile?.weightKg || 0,
      chronicConditions: profile?.chronicConditions ? JSON.stringify(profile.chronicConditions) : '',
      medicationsList: profile?.medicationsList ? JSON.stringify(profile.medicationsList) : '',
    });
  } catch (error) {
    console.error('GET /api/profile error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
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