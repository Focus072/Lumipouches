/**
 * Presign file upload
 * POST /api/admin/files/presign
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { requireAdmin } from '@/lib/api-auth';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const presignSchema = z.object({
  key: z.string().min(1),
  contentType: z.string(),
  sizeBytes: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const data = presignSchema.parse(body);

    const bucket = process.env.R2_BUCKET_NAME || 'lumi-files';
    const expiresIn = 3600; // 1 hour

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: data.key,
      ContentType: data.contentType,
      ContentLength: data.sizeBytes,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });

    return NextResponse.json({
      success: true,
      data: {
        url,
        key: data.key,
        expiresIn,
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
    console.error('Presign file upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An error occurred' },
      },
      { status: 500 }
    );
  }
}
