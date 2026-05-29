import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import prisma from './prisma';

/**
 * Get the current authenticated user ID for API routes.
 *
 * Resolution order:
 * 1. NextAuth session (multi-user with login)
 * 2. x-user-id header from middleware JWT
 * 3. Single-user fallback: user with active lab reports, or first user
 */
export async function getUserId(req?: NextRequest): Promise<string> {
  // 1. Try NextAuth session
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as Record<string, unknown> | undefined)?.id as string | undefined;
    if (userId) return userId;
  } catch {
    // Session not available
  }

  // 2. Check x-user-id header set by middleware (if JWT token found)
  const headerId = req?.headers?.get('x-user-id');
  if (headerId) return headerId;

  // 3. Single-user fallback: find user with active lab reports
  try {
    const userWithActiveReport = await prisma.labReport.findFirst({
      where: { isActive: true },
      select: { userId: true },
    });
    if (userWithActiveReport) return userWithActiveReport.userId;

    // Or any user with reviewed reports
    const userWithReports = await prisma.labReport.findFirst({
      where: { status: 'reviewed' },
      orderBy: { createdAt: 'desc' },
      select: { userId: true },
    });
    if (userWithReports) return userWithReports.userId;

    // Last resort: first user
    const firstUser = await prisma.user.findFirst({ select: { id: true } });
    if (firstUser) return firstUser.id;
  } catch {
    // Database not available
  }

  throw new Error('Unauthorized — no authenticated user found');
}

/**
 * Get the current user profile with name.
 */
export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as Record<string, unknown> | undefined)?.id as string | undefined;
    if (!userId) return null;

    return prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
  } catch {
    return null;
  }
}