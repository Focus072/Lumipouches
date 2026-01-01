/**
 * Log STAKE Act call
 * POST /api/admin/orders/[id]/stake-call
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma, ActorType } from '@lumi/db';
import { requireAdmin } from '@/lib/api-auth';

const stakeCallSchema = z.object({
  notes: z.string().min(1),
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

    const { user } = authResult;
    const body = await request.json();
    const data = stakeCallSchema.parse(body);

    // Load order
    const order = await prisma.order.findUnique({
      where: { id: params.id },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
        },
        { status: 404 }
      );
    }

    // Create STAKE call record
    const stakeCall = await prisma.stakeCall.create({
      data: {
        orderId: order.id,
        calledAt: new Date(),
        adminUserId: user.id,
        notes: data.notes,
      },
    });

    // Audit log
    await prisma.auditEvent.create({
      data: {
        actorUserId: user.id,
        actorType: ActorType.USER,
        action: 'STAKE_CALL',
        entityType: 'ORDER',
        entityId: order.id,
        result: 'SUCCESS',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        stakeCallId: stakeCall.id,
        orderId: order.id,
        calledAt: stakeCall.calledAt,
      },
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
    console.error('Stake call error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An error occurred' },
      },
      { status: 500 }
    );
  }
}
