/**
 * Admin Orders routes
 * GET /api/admin/orders - List all orders (with filters)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@lumi/db';
import { requireAdmin } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const statusesParam = searchParams.get('statuses');
    const statuses = statusesParam ? (Array.isArray(statusesParam) ? statusesParam : [statusesParam]) : undefined;
    const search = searchParams.get('search') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Math.min(Number(searchParams.get('pageSize')) || 50, 100);
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (status) {
      where.status = status;
    } else if (statuses && statuses.length > 0) {
      where.status = { in: statuses };
    }
    if (search) {
      where.id = { contains: search };
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          shippingAddress: {
            select: {
              state: true,
            },
          },
          complianceSnapshot: {
            select: {
              stakeCallRequired: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: orders,
        total,
        page,
        pageSize,
      },
    });
  } catch (error) {
    console.error('Get admin orders error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An error occurred' },
      },
      { status: 500 }
    );
  }
}
