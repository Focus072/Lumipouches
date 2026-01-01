# Vercel Database Connection Setup

## Critical: DATABASE_URL Environment Variable

The 500 error on `/api/products` is likely because **DATABASE_URL is not set** in Vercel environment variables.

### Steps to Fix

1. **Go to Vercel Dashboard**
   - Select your project
   - Go to **Settings** → **Environment Variables**

2. **Add DATABASE_URL**
   - **Key:** `DATABASE_URL`
   - **Value:** Your Neon PostgreSQL connection string
     ```
     postgresql://neondb_owner:npg_Qoejarb4Av0H@ep-red-moon-adtbwsbs-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
     ```
   - **Environment:** Select all (Production, Preview, Development)

3. **Also Add (if using migrations):**
   - **Key:** `DATABASE_URL_UNPOOLED`
   - **Value:** Your unpooled connection string (for migrations)
   - **Environment:** All

4. **Redeploy**
   - After adding environment variables, Vercel will automatically redeploy
   - Or manually trigger a redeployment

### Verify Connection

After deployment, check:
1. The `/api/products` endpoint should work
2. No more 500 errors
3. Products should load on the homepage

### Other Required Environment Variables

Make sure these are also set in Vercel:
- `INNGEST_SIGNING_KEY`
- `INNGEST_EVENT_KEY`  
- `INNGEST_BASE_URL` (for production: `https://api.inngest.com`)
- `SESSION_SECRET`
- Any API keys (Veriff, Authorize.Net, Shippo, etc.)

### Check Error Logs

If still getting errors after setting DATABASE_URL:
1. Go to Vercel Dashboard → Your Project
2. Click on the deployment
3. Go to **Functions** tab
4. Click on `/api/products`
5. Check the **Logs** for the actual error message
