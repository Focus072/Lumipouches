/**
 * Admin Order detail
 * GET /api/admin/orders/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@lumi/db';
import { requireAdmin } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        shippingAddress: true,
        billingAddress: true,
        items: {
          include: {
            product: true,
          },
        },
        complianceSnapshot: true,
        ageVerification: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        stakeCalls: {
          orderBy: { calledAt: 'desc' },
          take: 1,
        },
      },
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

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Get admin order error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An error occurred' },
      },
      { status: 500 }
    );
  }
}
