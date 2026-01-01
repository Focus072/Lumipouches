# Vercel Build Debugging

## Current Error
`Command "cd ../.. && pnpm build:main" exited with 2`

## What Exit Code 2 Means
Exit code 2 typically means a command failed. We need to see the actual error message from Vercel build logs.

## How to Debug

### 1. Check Vercel Build Logs
In Vercel Dashboard:
1. Go to your project
2. Click on the failed deployment
3. Open the "Build Logs" tab
4. Scroll to find the actual error message (not just "exited with 2")

### 2. Common Issues to Look For

#### Issue: Prisma Generate Fails
**Error:** "Environment variable not found: DATABASE_URL"
**Solution:** Set DATABASE_URL in Vercel (can be a dummy value for build)

#### Issue: TypeScript Compilation Errors
**Error:** TypeScript errors in build logs
**Solution:** Fix TypeScript errors in code

#### Issue: Workspace Package Not Found
**Error:** "Package @lumi/db not found" or similar
**Solution:** Ensure pnpm-workspace.yaml is in repo root

#### Issue: Missing Dependencies
**Error:** "Cannot find module" errors
**Solution:** Check if all dependencies are in package.json

### 3. Alternative Build Command

I've updated `vercel.json` to use explicit commands instead of the script:

```json
{
  "buildCommand": "cd ../.. && pnpm --filter db generate && pnpm --filter @lumi/shared build && pnpm --filter main build"
}
```

This runs each step explicitly, which makes it easier to see which step fails.

### 4. Test Locally

To reproduce the issue locally, run from `apps/main`:
```bash
cd apps/main
cd ../..
pnpm --filter db generate && pnpm --filter @lumi/shared build && pnpm --filter main build
```

If this works locally but fails in Vercel, it's likely an environment issue.

### 5. Next Steps

1. **Check the actual error** in Vercel build logs
2. **Share the error message** so we can fix the specific issue
3. The build command has been updated to be more explicit
