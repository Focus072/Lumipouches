/**
 * CSRF Protection Utility
 * 
 * Provides CSRF token generation and validation to prevent cross-site
 * request forgery attacks.
 */

import crypto from 'crypto';

// In-memory store for CSRF tokens (can be upgraded to Redis for distributed systems)
// Key: sessionId or user identifier
// Value: Set of valid tokens
const csrfTokenStore = new Map<string, Set<string>>();

// Clean up expired tokens every 10 minutes
setInterval(() => {
  // For now, we keep tokens until they're used or session expires
  // In production, consider adding expiration times
}, 10 * 60 * 1000);

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Store a CSRF token for a session/user
 */
export function storeCsrfToken(identifier: string, token: string): void {
  if (!csrfTokenStore.has(identifier)) {
    csrfTokenStore.set(identifier, new Set());
  }
  csrfTokenStore.get(identifier)!.add(token);
  
  // Limit to 10 tokens per identifier to prevent memory issues
  const tokens = csrfTokenStore.get(identifier)!;
  if (tokens.size > 10) {
    const firstToken = tokens.values().next().value;
    if (firstToken) {
      tokens.delete(firstToken);
    }
  }
}

/**
 * Validate a CSRF token
 */
export function validateCsrfToken(identifier: string, token: string): boolean {
  const tokens = csrfTokenStore.get(identifier);
  if (!tokens) {
    return false;
  }
  
  const isValid = tokens.has(token);
  if (isValid) {
    // Remove token after use (one-time use)
    tokens.delete(token);
  }
  
  return isValid;
}

/**
 * Get CSRF token identifier from request
 * Uses cookie-based session ID, Authorization header, or IP address as fallback
 */
export function getCsrfIdentifier(request: any): string {
  // For NextRequest, try to get from cookies first (most reliable)
  if (request?.cookies) {
    let sessionId: string | undefined;
    if (typeof request.cookies.get === 'function') {
      sessionId = request.cookies.get('csrf-session-id')?.value;
    } else if (request.cookies['csrf-session-id']) {
      sessionId = request.cookies['csrf-session-id'];
    }
    
    if (sessionId) {
      return crypto.createHash('sha256').update(sessionId).digest('hex').substring(0, 16);
    }
  }

  // Try to get from Authorization header (session token)
  const headers = request?.headers || {};
  const getHeader = (name: string) => {
    if (typeof headers.get === 'function') {
      return headers.get(name);
    }
    const lowerName = name.toLowerCase();
    return headers[lowerName] || headers[name];
  };

  const authHeader = getHeader('authorization');
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return crypto.createHash('sha256').update(token).digest('hex').substring(0, 16);
  }
  
  // For development/localhost, use a consistent identifier based on user-agent
  if (process.env.NODE_ENV === 'development') {
    const userAgent = getHeader('user-agent') || 'unknown';
    return crypto.createHash('sha256').update(`dev-${userAgent}`).digest('hex').substring(0, 16);
  }
  
  // Production: Fallback to IP address
  const forwarded = getHeader('x-forwarded-for');
  const realIp = getHeader('x-real-ip');
  const cfConnectingIp = getHeader('cf-connecting-ip');
  const ip = cfConnectingIp || realIp || (forwarded ? (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : null) : null) || 'unknown';
  
  return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
}

/**
 * Clear CSRF tokens for an identifier (e.g., on logout)
 */
export function clearCsrfTokens(identifier: string): void {
  csrfTokenStore.delete(identifier);
}
