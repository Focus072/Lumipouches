# Production & Local Setup Checklist

## ✅ Completed
- [x] Converted Fastify API routes to Next.js API routes
- [x] Updated frontend API URLs to use relative paths
- [x] Added all required dependencies
- [x] Created authentication utilities
- [x] All admin routes converted

## 🔴 Critical: Missing Items

### 1. Inngest API Route & Functions (CRITICAL)
**Status:** ❌ Missing  
**Impact:** High - Background jobs won't work  
**Action Required:**
- [ ] Create `/api/inngest` route handler for Next.js
- [ ] Migrate Inngest functions from `apps/api/src/functions` to `apps/main/src/lib/inngest`
- [ ] Register functions with Inngest client
- [ ] Test Inngest endpoint locally and in production

### 2. Environment Variables Documentation
**Status:** ⚠️ Incomplete  
**Impact:** Medium - Deployment configuration unclear  
**Action Required:**
- [ ] Update `apps/main/.env.example` with all required variables
- [ ] Document production environment variables for Vercel
- [ ] Document which variables are optional vs required

### 3. Next.js Configuration
**Status:** ⚠️ Needs Review  
**Impact:** Low-Medium  
**Action Required:**
- [ ] Verify Next.js config handles all transpilePackages correctly
- [ ] Check if Inngest route needs special configuration
- [ ] Verify build output is correct

### 4. Database Migrations (Production)
**Status:** ⚠️ Needs Setup  
**Impact:** High - Database schema may be out of sync  
**Action Required:**
- [ ] Ensure migrations run in Vercel build process
- [ ] Document how to run migrations manually if needed
- [ ] Test migration process

### 5. Build Process Verification
**Status:** ⚠️ Needs Testing  
**Impact:** High - Production builds may fail  
**Action Required:**
- [ ] Test `pnpm build:main` locally
- [ ] Verify Vercel build command works
- [ ] Check for any TypeScript/build errors

### 6. Session Secret & Security
**Status:** ⚠️ Needs Verification  
**Impact:** High - Security issue  
**Action Required:**
- [ ] Ensure `SESSION_SECRET` is set in production
- [ ] Verify secrets are properly configured in Vercel
- [ ] Document how to generate secure session secret

## 📋 Recommended: Enhancement Items

### 7. Error Monitoring
**Status:** Optional  
**Impact:** Low  
**Action Required:**
- [ ] Consider adding Sentry or similar error tracking
- [ ] Configure error logging for production

### 8. Performance Optimization
**Status:** Optional  
**Impact:** Low  
**Action Required:**
- [ ] Review API route performance
- [ ] Consider caching strategies
- [ ] Optimize database queries

### 9. API Documentation
**Status:** Optional  
**Impact:** Low  
**Action Required:**
- [ ] Document API endpoints
- [ ] Create API reference docs

## 🚀 Production Deployment Steps

Once all critical items are complete:

1. **Set Environment Variables in Vercel:**
   - Database connection strings
   - API keys (Veriff, Authorize.Net, Shippo, etc.)
   - Inngest configuration
   - Session secrets
   - R2/S3 credentials (if using file uploads)

2. **Run Database Migrations:**
   ```bash
   pnpm db:migrate:deploy  # Or use Vercel's build command
   ```

3. **Deploy to Vercel:**
   - Connect GitHub repository
   - Set Root Directory: `apps/main`
   - Set Build Command: `cd ../.. && pnpm build:main`
   - Set Output Directory: `.next`
   - Set Install Command: `cd ../.. && pnpm install --frozen-lockfile`

4. **Configure Inngest:**
   - Point Inngest to your production endpoint: `https://your-domain.vercel.app/api/inngest`
   - Verify signing keys match

5. **Test Production:**
   - Test authentication flow
   - Test order creation
   - Test admin functions
   - Verify Inngest functions trigger correctly

## 🔍 Current Gaps Summary

### Must Fix Before Production:
1. ✅ API routes converted
2. ❌ Inngest endpoint missing
3. ❌ Inngest functions not migrated
4. ⚠️ Environment variables need documentation
5. ⚠️ Build process needs verification

### Should Fix:
6. ⚠️ Database migrations automation
7. ⚠️ Session secret generation guidance

### Nice to Have:
8. Error monitoring
9. Performance optimization
10. API documentation
