# Correct Vercel Settings for Monorepo

## ✅ Correct Configuration

Since Next.js is in `apps/main/`, you need to set:

### Framework Settings in Vercel:

1. **Root Directory:** `apps/main`
   - This is where your Next.js `package.json` is located
   - Vercel needs this to detect Next.js

2. **Build Command:** `cd ../.. && pnpm build:main`
   - Goes up to repo root (where workspace is)
   - Runs the workspace build script

3. **Output Directory:** `.next`
   - Next.js output is in `apps/main/.next`

4. **Install Command:** `cd ../.. && pnpm install --frozen-lockfile`
   - Installs from repo root (workspace context)

## Why Root Directory Must Be `apps/main`

- Vercel detects Next.js by looking for it in the Root Directory
- Your `package.json` with Next.js is in `apps/main/`
- If Root Directory is empty, Vercel looks in root `package.json` (no Next.js there)

## If Build Still Fails

If `cd ../.. && pnpm build:main` still fails, check Vercel build logs for:

1. **Prisma errors** - DATABASE_URL might be needed for generate
2. **TypeScript errors** - Check for compilation issues
3. **Missing dependencies** - Workspace packages might not be building

The error message will tell you what's actually failing.

## Alternative: Use vercel.json

Your `apps/main/vercel.json` already has the correct settings. Make sure Vercel is reading it by:
- Keeping Root Directory as `apps/main`
- The vercel.json file should be in that directory (it is)
