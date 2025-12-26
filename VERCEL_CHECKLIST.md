# Vercel Deployment Checklist

## ✅ Pre-Deployment Fixes Applied

### 1. Package Configuration
- ✅ Fixed `packages/shared/package.json` to use `dist/` output instead of `src/`
- ✅ Added proper `exports` field for ESM/CJS compatibility
- ✅ Configured TypeScript to output to `dist/`

### 2. Next.js Configuration
- ✅ Added `output: 'standalone'` for optimized Vercel deployment
- ✅ Added `transpilePackages: ['@lumi/shared', '@lumi/db']` to transpile workspace packages
- ✅ Configured image remote patterns for both apps

### 3. Vercel Configuration
- ✅ Updated `vercel.json` files with `nodeVersion: "24.x"`
- ✅ Configured proper build commands that run from repo root
- ✅ Set correct output directories (`.next`)

### 4. Build Optimization
- ✅ Created `.vercelignore` files to exclude unnecessary files
- ✅ Optimized build scripts in root `package.json`

## 📋 Vercel Project Setup

### For Admin App (`apps/admin`)

1. **Create New Project in Vercel:**
   - Import repository: `Focus072/Whiteboy`
   - Framework: Next.js (auto-detected)
   - **Root Directory**: `apps/admin` ⚠️ **CRITICAL**
   - Project Name: `lumi-admin` (or your choice)

2. **Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL=https://your-api-url.fly.dev
   ```
   (Replace with your actual API URL)

3. **Build Settings (should auto-detect from vercel.json):**
   - Install Command: `cd ../.. && pnpm install --frozen-lockfile`
   - Build Command: `cd ../.. && pnpm build:admin`
   - Output Directory: `.next`
   - Node Version: `24.x`

### For Storefront App (`apps/storefront`)

1. **Create New Project in Vercel:**
   - Import repository: `Focus072/Whiteboy`
   - Framework: Next.js (auto-detected)
   - **Root Directory**: `apps/storefront` ⚠️ **CRITICAL**
   - Project Name: `lumi-storefront` (or your choice)

2. **Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL=https://your-api-url.fly.dev
   ```
   (Replace with your actual API URL)

3. **Build Settings (should auto-detect from vercel.json):**
   - Install Command: `cd ../.. && pnpm install --frozen-lockfile`
   - Build Command: `cd ../.. && pnpm build:storefront`
   - Output Directory: `.next`
   - Node Version: `24.x`

## 🔧 How to Set Root Directory in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **General**
3. Scroll to **Root Directory** section
4. Click **Edit**
5. Enter: `apps/admin` (for admin) or `apps/storefront` (for storefront)
6. Click **Save**
7. **Redeploy** the project

## ✅ Verification Steps

After deployment, verify:

1. **Build Logs:**
   - ✅ Prisma generates successfully
   - ✅ Dependencies install from root
   - ✅ Shared package builds to `dist/`
   - ✅ Next.js builds successfully
   - ✅ No "Cannot find module" errors

2. **Runtime:**
   - ✅ App loads without errors
   - ✅ API calls work (check browser console)
   - ✅ No 404 errors for assets

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module '@lumi/shared'"
**Solution:** 
- Ensure `transpilePackages` is set in `next.config.js` ✅ (Already fixed)
- Ensure shared package is built before Next.js build ✅ (Build script handles this)

### Issue: "No Output Directory named 'public' found"
**Solution:**
- Set Root Directory in Vercel dashboard to `apps/admin` or `apps/storefront` ⚠️ **MUST DO THIS**

### Issue: "Prisma Client not generated"
**Solution:**
- Build script runs `pnpm --filter db generate` first ✅ (Already in build scripts)

### Issue: Build fails with module resolution errors
**Solution:**
- Ensure install command runs from repo root: `cd ../.. && pnpm install --frozen-lockfile` ✅ (Already configured)

## 📝 Notes

- The API (`apps/api`) should be deployed to Fly.io, not Vercel
- Each Next.js app should be a **separate Vercel project**
- Root Directory setting is **critical** - without it, Vercel will look for output at repo root and fail

