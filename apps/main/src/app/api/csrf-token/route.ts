/**
 * CSRF Token endpoint
 * GET /api/csrf-token - Get a CSRF token for the current session
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateCsrfToken, storeCsrfToken, getCsrfIdentifier } from '@/lib/security/csrf';

export async function GET(request: NextRequest) {
  try {
    const identifier = getCsrfIdentifier(request);
    const token = generateCsrfToken();
    
    // Store token for this identifier
    storeCsrfToken(identifier, token);
    
    return NextResponse.json({
      success: true,
      data: {
        token,
      },
    });
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to generate CSRF token' },
      },
      { status: 500 }
    );
  }
}
