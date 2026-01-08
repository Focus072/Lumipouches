/**
 * CSRF Token endpoint
 * GET /api/csrf-token - Get a CSRF token for the current session
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateCsrfToken, storeCsrfToken, getCsrfIdentifier } from '@/lib/security/csrf';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    // Generate or get a session ID from cookie
    let sessionId = request.cookies.get('csrf-session-id')?.value;
    if (!sessionId) {
      sessionId = crypto.randomBytes(16).toString('hex');
    }

    const identifier = getCsrfIdentifier(request);
    const token = generateCsrfToken();
    
    // Store token for this identifier
    storeCsrfToken(identifier, token);
    
    const response = NextResponse.json({
      success: true,
      data: {
        token,
      },
    });

    // Set session ID cookie for consistent identification
    response.cookies.set('csrf-session-id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
    
    return response;
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
