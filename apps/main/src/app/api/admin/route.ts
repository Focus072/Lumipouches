/**
 * Admin API base route - placeholder
 * Most admin routes are in subdirectories
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Admin API - use specific endpoints' });
}
