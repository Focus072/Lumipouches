/**
 * Rate Limiting Utility
 * 
 * Provides rate limiting for API endpoints to prevent brute force attacks
 * and abuse. Uses in-memory storage for simplicity (can be upgraded to Redis
 * for distributed systems).
 */

interface RateLimitConfig {
  points: number; // Number of requests
  duration: number; // Time window in seconds
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

// In-memory store for rate limiting
// Key: identifier (IP, email, etc.)
// Value: { count: number, resetTime: number }
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Check if a request should be rate limited
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired entry
    const resetTime = now + config.duration * 1000;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return {
      allowed: true,
      remaining: config.points - 1,
      resetTime: Math.floor(resetTime / 1000),
    };
  }

  if (entry.count >= config.points) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: Math.floor(entry.resetTime / 1000),
    };
  }

  // Increment count
  entry.count++;
  return {
    allowed: true,
    remaining: config.points - entry.count,
    resetTime: Math.floor(entry.resetTime / 1000),
  };
}

/**
 * Get client identifier from request (IP address)
 */
export function getClientIdentifier(request: Request | { headers: Headers | { get: (name: string) => string | null } }): string {
  // Try to get real IP from headers (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  const ip = cfConnectingIp || realIp || (forwarded ? forwarded.split(',')[0].trim() : null) || 'unknown';
  return ip;
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Auth endpoints - strict limits to prevent brute force
  AUTH_LOGIN: { points: 5, duration: 900 }, // 5 attempts per 15 minutes
  AUTH_SIGNUP: { points: 3, duration: 3600 }, // 3 attempts per hour
  AUTH_PASSWORD_RESET: { points: 3, duration: 3600 }, // 3 attempts per hour
  
  // General API endpoints
  API_GENERAL: { points: 100, duration: 60 }, // 100 requests per minute
} as const;
