/**
 * Reset user password
 * POST /api/admin/users/[id]/reset-password
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma, ActorType } from '@lumi/db';
import { requireAdmin, hashPassword } from '@/lib/api-auth';

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user: adminUser } = authResult;
    const body = await request.json();
    const data = resetPasswordSchema.parse(body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User not found' },
        },
        { status: 404 }
      );
    }

    const passwordHash = await hashPassword(data.newPassword);

    await prisma.user.update({
      where: { id: params.id },
      data: { passwordHash },
    });

    // Revoke all existing sessions for this user
    await prisma.session.updateMany({
      where: { userId: params.id },
      data: { revokedAt: new Date() },
    });

    // Audit log
    await prisma.auditEvent.create({
      data: {
        actorUserId: adminUser.id,
        actorType: ActorType.USER,
        action: 'RESET_PASSWORD',
        entityType: 'User',
        entityId: user.id,
        result: 'SUCCESS',
        metadataJson: { email: user.email },
      },
    }).catch(() => {
      // Ignore audit log errors
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Password reset successfully' },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.errors[0].message },
        },
        { status: 400 }
      );
    }
    console.error('Reset password error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An error occurred' },
      },
      { status: 500 }
    );
  }
}
