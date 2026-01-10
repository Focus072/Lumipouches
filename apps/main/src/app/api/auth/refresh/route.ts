/**
 * Refresh session endpoint
 * POST /api/auth/refresh - Extend session expiration
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@lumi/db';
import { authenticateRequest } from '@/lib/api-auth';
import { generateSessionToken } from '@/lib/api-auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
        },
        { status: 401 }
      );
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find and update session
    const session = await prisma.session.findUnique({
      where: { tokenHash },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'SESSION_EXPIRED', message: 'Session expired' },
        },
        { status: 401 }
      );
    }

    // Extend session by 30 days
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 30);

    await prisma.session.update({
      where: { tokenHash },
      data: { expiresAt: newExpiresAt },
    });

    return NextResponse.json({
      success: true,
      data: {
        expiresAt: newExpiresAt,
      },
    });
  } catch (error) {
    console.error('Refresh session error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An error occurred' },
      },
      { status: 500 }
    );
  }
}
