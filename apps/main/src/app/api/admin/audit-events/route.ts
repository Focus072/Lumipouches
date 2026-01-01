/**
 * Get audit events
 * GET /api/admin/audit-events
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@lumi/db';
import { requireAdmin } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Math.min(Number(searchParams.get('pageSize')) || 50, 100);
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      prisma.auditEvent.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          actorUser: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      }),
      prisma.auditEvent.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
      },
    });
  } catch (error) {
    console.error('Get audit events error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An error occurred' },
      },
      { status: 500 }
    );
  }
}
