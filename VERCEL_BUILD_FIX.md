# Vercel Build Error Fix

## Problem
Build command `cd ../.. && pnpm build:main` is failing in Vercel with exit code 2.

## Solution

The issue is likely related to how Vercel handles the workspace root. Here are the correct settings:

### Option 1: Set Root Directory to Repo Root (Recommended)

**In Vercel Dashboard:**
- **Root Directory:** Leave empty or set to `/` (repo root)
- **Build Command:** `pnpm build:main`
- **Output Directory:** `apps/main/.next`
- **Install Command:** `pnpm install --frozen-lockfile`

### Option 2: Keep Root Directory as apps/main

If Root Directory is set to `apps/main`:

**In Vercel Dashboard:**
- **Root Directory:** `apps/main`
- **Build Command:** `cd ../.. && pnpm build:main` (current)
- **Output Directory:** `.next`
- **Install Command:** `cd ../.. && pnpm install --frozen-lockfile` (current)

**But you may need to add to vercel.json:**
```json
{
  "buildCommand": "cd ../.. && pnpm build:main",
  "outputDirectory": ".next",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "framework": "nextjs"
}
```

## Check Vercel Build Logs

To see the actual error:
1. Go to Vercel Dashboard
2. Click on the failed deployment
3. Check the "Build Logs" tab
4. Look for the specific error message

## Common Issues

1. **pnpm workspace not found**
   - Ensure `pnpm-workspace.yaml` exists in repo root
   - Ensure `package.json` has workspace configuration

2. **Missing dependencies**
   - Check if all workspace packages build successfully
   - Ensure Prisma client generates before build

3. **TypeScript errors**
   - Check build logs for TypeScript compilation errors
   - Run `pnpm build:main` locally to catch errors early
