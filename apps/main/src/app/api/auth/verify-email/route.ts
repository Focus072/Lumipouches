/**
 * Verify email endpoint
 * POST /api/auth/verify-email - Verify email using token
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma, ActorType } from '@lumi/db';
import { formatApiError } from '@/lib/utils/error-messages';
import { logError } from '@/lib/services/monitoring';

const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = verifyEmailSchema.parse(body);

    // Find user by verification token
    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: data.token },
    });

    if (!user) {
      const error = formatApiError('INVALID_TOKEN', 'Invalid or expired verification token');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.userMessage,
          },
        },
        { status: 400 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        data: {
          message: 'Email is already verified.',
        },
      });
    }

    // Check if token is expired
    if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
      const error = formatApiError('TOKEN_EXPIRED', 'Verification token has expired');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.userMessage,
          },
        },
        { status: 400 }
      );
    }

    // Verify email
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    // Audit log
    await prisma.auditEvent.create({
      data: {
        actorUserId: user.id,
        actorType: ActorType.USER,
        action: 'VERIFY_EMAIL',
        entityType: 'USER',
        entityId: user.id,
        result: 'SUCCESS',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Email verified successfully.',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedError = formatApiError('VALIDATION_ERROR', error.errors[0].message);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: formattedError.code,
            message: formattedError.userMessage,
          },
        },
        { status: 400 }
      );
    }

    await logError(error, {
      metadata: { component: 'auth-api', endpoint: 'POST /api/auth/verify-email' },
    });

    const formattedError = formatApiError('INTERNAL_ERROR');
    return NextResponse.json(
      {
        success: false,
        error: {
          code: formattedError.code,
          message: formattedError.userMessage,
        },
      },
      { status: 500 }
    );
  }
}
