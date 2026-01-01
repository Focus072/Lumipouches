/**
 * Admin Product routes
 * GET /api/admin/products/[id] - Get product (admin)
 * PUT /api/admin/products/[id] - Update product
 * DELETE /api/admin/products/[id] - Delete product (soft delete)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma, ActorType, FlavorType } from '@lumi/db';
import { requireAdmin } from '@/lib/api-auth';

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  flavorType: z.nativeEnum(FlavorType).optional(),
  nicotineMg: z.number().positive().optional(),
  netWeightGrams: z.number().positive().optional(),
  price: z.number().positive().optional(),
  caUtlApproved: z.boolean().optional(),
  sensoryCooling: z.boolean().optional(),
  active: z.boolean().optional(),
  imageUrl: z.string().url().optional().nullable(),
  imageFileId: z.string().uuid().optional().nullable(),
}).partial();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Get admin product error:', error);
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

    const { user } = authResult;
    const body = await request.json();
    const data = updateProductSchema.parse(body);

    // Check if product exists
    const existing = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
        },
        { status: 404 }
      );
    }

    // If SKU is being updated, check for conflicts
    if (data.sku && data.sku !== existing.sku) {
      const skuExists = await prisma.product.findUnique({
        where: { sku: data.sku },
      });

      if (skuExists) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'SKU_EXISTS', message: 'Product with this SKU already exists' },
          },
          { status: 400 }
        );
      }
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.sku !== undefined && { sku: data.sku }),
        ...(data.flavorType !== undefined && { flavorType: data.flavorType }),
        ...(data.nicotineMg !== undefined && { nicotineMg: data.nicotineMg }),
        ...(data.netWeightGrams !== undefined && { netWeightGrams: data.netWeightGrams }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.caUtlApproved !== undefined && { caUtlApproved: data.caUtlApproved }),
        ...(data.sensoryCooling !== undefined && { sensoryCooling: data.sensoryCooling }),
        ...(data.active !== undefined && { active: data.active }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.imageFileId !== undefined && { imageFileId: data.imageFileId }),
      },
    });

    // Audit log
    await prisma.auditEvent.create({
      data: {
        actorUserId: user.id,
        actorType: ActorType.USER,
        action: 'UPDATE_PRODUCT',
        entityType: 'Product',
        entityId: product.id,
        result: 'SUCCESS',
        metadataJson: { sku: product.sku, changes: Object.keys(data) },
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
    console.error('Update product error:', error);
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

    const { user } = authResult;

    const product = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
        },
        { status: 404 }
      );
    }

    // Soft delete by setting active=false
    const updated = await prisma.product.update({
      where: { id: params.id },
      data: { active: false },
    });

    // Audit log
    await prisma.auditEvent.create({
      data: {
        actorUserId: user.id,
        actorType: ActorType.USER,
        action: 'DELETE_PRODUCT',
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
      data: updated,
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An error occurred' },
      },
      { status: 500 }
    );
  }
}
