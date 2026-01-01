/**
 * Admin Products routes
 * GET /api/admin/products - List products (admin, with filters)
 * POST /api/admin/products - Create product
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma, ActorType, FlavorType } from '@lumi/db';
import { requireAdmin } from '@/lib/api-auth';

const createProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  flavorType: z.nativeEnum(FlavorType),
  nicotineMg: z.number().positive(),
  netWeightGrams: z.number().positive(),
  price: z.number().positive(),
  caUtlApproved: z.boolean().default(false),
  sensoryCooling: z.boolean().default(false),
  active: z.boolean().default(true),
  imageUrl: z.string().url().optional(),
  imageFileId: z.string().uuid().optional(),
});

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
    const search = searchParams.get('search') || undefined;
    const activeParam = searchParams.get('active');
    const activeFilter = activeParam === undefined ? undefined : activeParam === 'true';

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (activeFilter !== undefined) {
      where.active = activeFilter;
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
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
    console.error('Get admin products error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An error occurred' },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const body = await request.json();
    const data = createProductSchema.parse(body);

    // Check if SKU already exists
    const existing = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'SKU_EXISTS', message: 'Product with this SKU already exists' },
        },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        flavorType: data.flavorType,
        nicotineMg: data.nicotineMg,
        netWeightGrams: data.netWeightGrams,
        price: data.price,
        caUtlApproved: data.caUtlApproved,
        sensoryCooling: data.sensoryCooling,
        active: data.active,
        imageUrl: data.imageUrl || null,
        imageFileId: data.imageFileId || null,
      },
    });

    // Audit log
    await prisma.auditEvent.create({
      data: {
        actorUserId: user.id,
        actorType: ActorType.USER,
        action: 'CREATE_PRODUCT',
        entityType: 'Product',
        entityId: product.id,
        result: 'SUCCESS',
        metadataJson: { sku: product.sku, name: product.name },
      },
    }).catch(() => {
      // Ignore audit log errors
    });

    return NextResponse.json({
      success: true,
      data: product,
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
    console.error('Create product error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An error occurred' },
      },
      { status: 500 }
    );
  }
}
