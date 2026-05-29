import { NextRequest, NextResponse } from 'next/server';

import { getUserId } from '@/lib/get-user';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
        const members = await prisma.familyMember.findMany({
      where: { ownerUserId: await getUserId() },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(members);
  } catch (error) {
    console.error('GET /api/family error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
        const { name, email, relationship } = await req.json();
    const member = await prisma.familyMember.create({
      data: { ownerUserId: await getUserId(), name, relation: relationship || 'other' },
    });
    return NextResponse.json({
      id: member.id, name: member.name, email: email || '', role: 'member', relationship: member.relation,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/family error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}