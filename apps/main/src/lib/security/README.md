# Security Implementation

This directory contains security utilities for the Lumi Pouches application.

## Implemented Security Features

### 1. Rate Limiting ✅
**File:** `rate-limit.ts`

- Prevents brute force attacks on authentication endpoints
- Configurable limits per endpoint type
- In-memory storage (can be upgraded to Redis for distributed systems)

**Current Limits:**
- Login: 5 attempts per 15 minutes
- Signup: 3 attempts per hour
- Password Reset: 3 attempts per hour
- General API: 100 requests per minute

**Usage:**
```typescript
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/security/rate-limit';

const clientId = getClientIdentifier(request);
const result = checkRateLimit(`login:${clientId}`, RATE_LIMITS.AUTH_LOGIN);
if (!result.allowed) {
  return rateLimitError();
}
```

### 2. CSRF Protection ✅
**File:** `csrf.ts`

- Generates and validates CSRF tokens
- One-time use tokens
- Prevents cross-site request forgery attacks

**Usage:**
```typescript
import { generateCsrfToken, storeCsrfToken, validateCsrfToken } from '@/lib/security/csrf';

// Generate token
const token = generateCsrfToken();
storeCsrfToken(identifier, token);

// Validate token
if (!validateCsrfToken(identifier, token)) {
  return csrfError();
}
```

**Endpoint:** `GET /api/csrf-token` - Returns a CSRF token for the current session

### 3. Input Sanitization ✅
**File:** `sanitize.ts`

- Sanitizes user input to prevent XSS attacks
- Escapes HTML special characters
- Removes control characters
- Provides sanitized Zod schemas

**Usage:**
```typescript
import { sanitizeString, sanitizeEmail, sanitizeObject } from '@/lib/security/sanitize';

const clean = sanitizeString(userInput);
const email = sanitizeEmail(userEmail);
const obj = sanitizeObject(userObject);
```

### 4. HTTPS/SSL Verification ✅
**File:** `secure-fetch.ts`

- Ensures all external API calls use HTTPS
- Enforces SSL certificate verification (default in Node.js 18+)
- Validates URLs before making requests

**Note:** All external API services already use HTTPS:
- Authorize.Net: `https://api.authorize.net` / `https://apitest.authorize.net`
- Veriff: `https://stationapi.veriff.com`
- Shippo: `https://api.goshippo.com`
- SendGrid: `https://api.sendgrid.com`

Node.js 18+ fetch() API verifies SSL certificates by default, so no additional configuration is needed.

## Security Best Practices

1. **Always sanitize user input** before storing or displaying
2. **Use rate limiting** on all authentication endpoints
3. **Include CSRF tokens** in forms (optional for now, can be made required)
4. **Validate all inputs** using Zod schemas
5. **Use HTTPS only** for external API calls
6. **Never log sensitive data** (passwords, tokens, card numbers)

## Future Enhancements

- [ ] Upgrade rate limiting to Redis for distributed systems
- [ ] Add IP-based blocking for repeated violations
- [ ] Implement CAPTCHA for suspicious activity
- [ ] Add request signing for sensitive operations
- [ ] Implement Content Security Policy (CSP) headers
