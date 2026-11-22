import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { registerSchema } from '@/lib/validations';

const hasMysqlUrl = () => Boolean(process.env.DATABASE_URL?.startsWith('mysql://'));

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const { name, email, password, gender } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    if (hasMysqlUrl()) {
      try {
        const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existing) {
          return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
        }
        const passwordHash = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
          data: { name, email: normalizedEmail, passwordHash, gender: gender || null },
        });
        return NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 });
      } catch (dbErr) {
        console.warn('[Register] DB unavailable, falling back to stateless account:', dbErr);
      }
    }

    // Stateless fallback registration when MySQL isn't attached
    return NextResponse.json(
      {
        id: `guest_${Buffer.from(normalizedEmail).toString('hex').slice(0, 12)}`,
        email: normalizedEmail,
        name,
        mode: 'stateless',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
