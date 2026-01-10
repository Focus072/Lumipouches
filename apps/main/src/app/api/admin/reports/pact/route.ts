/**
 * Generate PACT report
 * POST /api/admin/reports/pact
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma, ActorType, OrderStatus } from '@lumi/db';
import { requireAdmin } from '@/lib/api-auth';
import { generatePactCsv, type PactReportRow } from '@/lib/utils/csv-generator';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const pactReportSchema = z.object({
  state: z.string().length(2).transform((s) => s.toUpperCase()),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const body = await request.json();
    const data = pactReportSchema.parse(body);

    const periodStart = new Date(data.periodStart);
    const periodEnd = new Date(data.periodEnd);
    periodEnd.setHours(23, 59, 59, 999); // End of day

    // Validate date range
    if (periodStart > periodEnd) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_DATE_RANGE', message: 'periodStart must be before periodEnd' },
        },
        { status: 400 }
      );
    }

    // Check if report already exists (idempotency)
    const existingReport = await prisma.pactReport.findFirst({
      where: {
        state: data.state,
        periodStart: {
          gte: periodStart,
          lte: periodEnd,
        },
        periodEnd: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      orderBy: {
        generatedAt: 'desc',
      },
    });

    if (existingReport) {
      // Return existing report
      const file = await prisma.file.findUnique({
        where: { id: existingReport.fileId },
      });

      return NextResponse.json({
        success: true,
        data: {
          reportId: existingReport.id,
          state: existingReport.state,
          periodStart: existingReport.periodStart,
          periodEnd: existingReport.periodEnd,
          generatedAt: existingReport.generatedAt,
          fileId: existingReport.fileId,
          fileKey: file?.key,
        },
      });
    }

    // Query shipped orders in date range for the state
    const orders = await prisma.order.findMany({
      where: {
        status: OrderStatus.SHIPPED,
        shippedAt: {
          gte: periodStart,
          lte: periodEnd,
        },
        shippingAddress: {
          state: data.state,
        },
      },
      include: {
        shippingAddress: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        shippedAt: 'asc',
      },
    });

    if (orders.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_ORDERS_FOUND',
            message: `No shipped orders found for ${data.state} in the specified period`,
          },
        },
        { status: 404 }
      );
    }

    // Generate report rows
    const reportRows: PactReportRow[] = [];

    for (const order of orders) {
      if (!order.shippedAt || !order.trackingNumber || !order.carrier) {
        // Skip orders without complete shipping data
        continue;
      }

      for (const item of order.items) {
        const shipmentDate = order.shippedAt.toISOString().split('T')[0]; // YYYY-MM-DD

        reportRows.push({
          recipientName: order.shippingAddress.recipientName,
          recipientAddress: `${order.shippingAddress.line1}${order.shippingAddress.line2 ? ` ${order.shippingAddress.line2}` : ''}`,
          recipientCity: order.shippingAddress.city,
          recipientState: order.shippingAddress.state,
          recipientZip: order.shippingAddress.postalCode,
          productBrand: item.product.name, // Using name as brand placeholder
          productSku: item.product.sku,
          quantity: item.quantity,
          netWeightGrams: item.product.netWeightGrams * item.quantity,
          shipmentDate,
          carrier: order.carrier,
          trackingNumber: order.trackingNumber,
        });
      }
    }

    if (reportRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_DATA_FOUND',
            message: 'No valid order data found for report generation',
          },
        },
        { status: 404 }
      );
    }

    // Generate CSV
    const csvContent = generatePactCsv(reportRows);
    const csvBuffer = Buffer.from(csvContent, 'utf-8');
    const csvHash = crypto.createHash('sha256').update(csvBuffer).digest('hex');

    // Generate file key (idempotent: state-period)
    const fileKey = `pact-reports/${data.state}-${data.periodStart}-${data.periodEnd}.csv`;

    // Upload to R2
    const bucket = process.env.R2_BUCKET_NAME || 'lumi-files';
    await s3Client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      Body: csvBuffer,
      ContentType: 'text/csv',
    }));

    // Create file record
    const file = await prisma.file.create({
      data: {
        bucket,
        key: fileKey,
        contentType: 'text/csv',
        sizeBytes: csvBuffer.length,
        sha256: csvHash,
        createdByUserId: user.id,
      },
    });

    // Create PACT report record
    const pactReport = await prisma.pactReport.create({
      data: {
        periodStart,
        periodEnd,
        state: data.state,
        fileId: file.id,
        generatedAt: new Date(),
      },
    });

    // Audit log
    await prisma.auditEvent.create({
      data: {
        actorUserId: user.id,
        actorType: ActorType.USER,
        action: 'GENERATE_PACT_REPORT',
        entityType: 'PACT_REPORT',
        entityId: pactReport.id,
        result: 'SUCCESS',
        metadataJson: {
          state: data.state,
          periodStart: data.periodStart,
          periodEnd: data.periodEnd,
          orderCount: orders.length,
          rowCount: reportRows.length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        reportId: pactReport.id,
        state: pactReport.state,
        periodStart: pactReport.periodStart,
        periodEnd: pactReport.periodEnd,
        generatedAt: pactReport.generatedAt,
        fileId: pactReport.fileId,
        fileKey: file.key,
        orderCount: orders.length,
        rowCount: reportRows.length,
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
    console.error('Error generating PACT report:', error);

    // Audit log for errors
    const authResult = await requireAdmin(request);
    if (!(authResult instanceof NextResponse) && authResult.user) {
      await prisma.auditEvent.create({
        data: {
          actorUserId: authResult.user.id,
          actorType: ActorType.USER,
          action: 'GENERATE_PACT_REPORT',
          entityType: 'PACT_REPORT',
          result: 'ERROR',
          reasonCode: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        },
      }).catch(() => {
        // Ignore audit log errors
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An error occurred' },
      },
      { status: 500 }
    );
  }
}
