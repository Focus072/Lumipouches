# Vercel Deployment Configuration

## ⚠️ IMPORTANT: Root Directory Must Be Set

**You MUST configure the Root Directory in Vercel dashboard settings for each project.**

If you see the error: `No Output Directory named "public" found`, it means Vercel is trying to build from the repository root instead of the app directory.

## Monorepo Setup

This is a monorepo with multiple applications:
- `apps/admin` - Next.js admin dashboard
- `apps/storefront` - Next.js customer storefront
- `apps/api` - Fastify API (deploy to Fly.io, not Vercel)

## Vercel Configuration

Each Next.js app should be deployed as a **separate Vercel project** with the following settings:

### For `apps/admin`:

1. **Root Directory**: `apps/admin`
2. **Framework Preset**: Next.js
3. **Build Command**: (auto-detected by Vercel)
4. **Output Directory**: `.next` (auto-detected)
5. **Install Command**: `pnpm install --frozen-lockfile` (from repo root)

**Important**: The `vercel.json` in `apps/admin` is already configured correctly with build commands that reference the root directory.

### For `apps/storefront`:

1. **Root Directory**: `apps/storefront`
2. **Framework Preset**: Next.js
3. **Build Command**: (auto-detected by Vercel)
4. **Output Directory**: `.next` (auto-detected)
5. **Install Command**: `pnpm install --frozen-lockfile` (from repo root)

## Setting Root Directory in Vercel (REQUIRED)

**This step is MANDATORY. Without it, deployments will fail.**

1. Go to your Vercel project dashboard
2. Select your project (admin or storefront)
3. Navigate to **Settings** → **General**
4. Scroll to **Root Directory** section
5. Click **Edit** and set:
   - For admin project: `apps/admin`
   - For storefront project: `apps/storefront`
6. Click **Save**
7. Redeploy your project

**If Root Directory is not set, Vercel will try to build from the repository root and fail with "No Output Directory named 'public' found" error.**

## Why No Root vercel.json?

The root directory does NOT have a `vercel.json` because:
- Each app is deployed as a separate Vercel project
- Each app has its own `vercel.json` configured correctly
- Vercel uses the `vercel.json` from the Root Directory you configure
- Having a root `vercel.json` would override the app-specific configurations

**The Root Directory setting in Vercel dashboard tells Vercel which directory to use as the project root, and which `vercel.json` to read.**

## Build Commands

The `vercel.json` files in each app directory use commands like:
```json
{
  "buildCommand": "cd ../.. && pnpm build --filter admin",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile"
}
```

These commands:
1. Navigate to the repo root (`cd ../..`)
2. Run pnpm commands from the root (required for monorepo workspaces)

## Environment Variables

Set environment variables in each Vercel project:

**For admin:**
- `NEXT_PUBLIC_API_URL` - Your API URL (e.g., `https://lumi-api.fly.dev`)

**For storefront:**
- `NEXT_PUBLIC_API_URL` - Your API URL (e.g., `https://lumi-api.fly.dev`)

## Deployment Flow

1. Push code to GitHub
2. Vercel automatically detects changes
3. For each project (admin/storefront):
   - Installs dependencies from repo root
   - Builds the specific app
   - Deploys to Vercel

## Troubleshooting

### Error: "No Output Directory named 'public' found"

**This is the most common error and means Root Directory is not configured.**

This error occurs when:
- Root Directory is not set in Vercel project settings
- Vercel defaults to building from repository root
- Repository root has no `vercel.json` or build output

**Solution (REQUIRED)**:
1. Go to Vercel project Settings → General
2. Find **Root Directory** section
3. Click **Edit** and enter: `apps/admin` (for admin) or `apps/storefront` (for storefront)
4. Click **Save**
5. Trigger a new deployment

**This is a Vercel dashboard setting, not a code change. It must be configured for each project.**

### Build Fails with "Cannot find module"

This usually means:
- Dependencies aren't installing from root
- The install command needs to run from repo root

**Solution**: Ensure `installCommand` in `vercel.json` runs from root: `cd ../.. && pnpm install --frozen-lockfile`

