/**
 * Admin User routes
 * GET /api/admin/users/[id] - Get user (admin)
 * PUT /api/admin/users/[id] - Update user
 * DELETE /api/admin/users/[id] - Delete user
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma, ActorType, UserRole } from '@lumi/db';
import { requireAdmin } from '@/lib/api-auth';

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  role: z.nativeEnum(UserRole).optional(),
  disabled: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        disabledAt: true,
      },
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

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get admin user error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An error occurred' },
      },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const data = updateUserSchema.parse(body);

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User not found' },
        },
        { status: 404 }
      );
    }

    // If email is being updated, check for conflicts
    if (data.email && data.email !== existing.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'EMAIL_EXISTS', message: 'User with this email already exists' },
          },
          { status: 400 }
        );
      }
    }

    // Prevent disabling yourself
    if (data.disabled === true && adminUser.id === params.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'CANNOT_DISABLE_SELF', message: 'You cannot disable your own account' },
        },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.disabled !== undefined) {
      updateData.disabledAt = data.disabled ? new Date() : null;
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        disabledAt: true,
      },
    });

    // Audit log
    await prisma.auditEvent.create({
      data: {
        actorUserId: adminUser.id,
        actorType: ActorType.USER,
        action: 'UPDATE_USER',
        entityType: 'User',
        entityId: user.id,
        result: 'SUCCESS',
        metadataJson: { email: user.email, changes: Object.keys(data) },
      },
    }).catch(() => {
      // Ignore audit log errors
    });

    return NextResponse.json({
      success: true,
      data: user,
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
    console.error('Update user error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An error occurred' },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user: adminUser } = authResult;

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

    // Prevent deleting yourself
    if (adminUser.id === params.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'CANNOT_DELETE_SELF', message: 'You cannot delete your own account' },
        },
        { status: 400 }
      );
    }

    // Soft delete by setting disabledAt
    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { disabledAt: new Date() },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        disabledAt: true,
      },
    });

    // Audit log
    await prisma.auditEvent.create({
      data: {
        actorUserId: adminUser.id,
        actorType: ActorType.USER,
        action: 'DELETE_USER',
        entityType: 'User',
        entityId: user.id,
        result: 'SUCCESS',
        metadataJson: { email: user.email, role: user.role },
      },
    }).catch(() => {
      // Ignore audit log errors
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An error occurred' },
      },
      { status: 500 }
    );
  }
}
