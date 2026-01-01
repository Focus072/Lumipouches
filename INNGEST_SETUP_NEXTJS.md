# Inngest Integration for Next.js

## ✅ Setup Complete

The Inngest integration has been set up in the Next.js app:

- **Route Handler**: `apps/main/src/app/api/inngest/route.ts`
- **Functions**: `apps/main/src/lib/inngest/functions.ts`
- **Client**: `apps/main/src/lib/services/inngest-client.ts`

## Endpoint URL

### Production
Your Inngest endpoint will be:
```
https://your-vercel-domain.vercel.app/api/inngest
```

Replace `your-vercel-domain` with your actual Vercel deployment domain.

### Local Development
When running locally:
```
http://localhost:3000/api/inngest
```

## Environment Variables

### Local Development (.env.local)
```env
INNGEST_BASE_URL=http://127.0.0.1:8288
INNGEST_EVENT_KEY=dev
INNGEST_SIGNING_KEY=dev
```

### Production (Vercel Environment Variables)
```env
INNGEST_BASE_URL=https://api.inngest.com
INNGEST_EVENT_KEY=your_production_event_key
INNGEST_SIGNING_KEY=signkey-prod-e85ec4f252b73073d57573d79f9f06dc6db2f8efb28c9cabf1f5d56920963bda
```

## Functions Registered

1. **send-order-confirmation** (`order/created` event)
   - Sends order confirmation email when an order is created
   - Triggered by: `POST /api/orders` route

2. **send-shipping-notification** (`order/shipped` event)
   - Sends shipping notification email when an order is shipped
   - Triggered by: `POST /api/admin/orders/[id]/ship` route

## Syncing with Inngest Cloud

### Step 1: Deploy to Production
Deploy your Next.js app to Vercel (or your hosting platform).

### Step 2: Get Your Production URL
After deployment, note your production URL:
```
https://your-vercel-domain.vercel.app
```

### Step 3: Sync in Inngest Dashboard
1. Go to [Inngest Dashboard](https://app.inngest.com)
2. Navigate to **Apps** or **Sync**
3. Click **Add App** or **Sync App**
4. Enter your Inngest endpoint URL:
   ```
   https://your-vercel-domain.vercel.app/api/inngest
   ```
5. Verify the signing key matches:
   ```
   signkey-prod-e85ec4f252b73073d57573d79f9f06dc6db2f8efb28c9cabf1f5d56920963bda
   ```
6. Click **Sync** or **Save**

### Step 4: Verify
After syncing:
- Your functions should appear in the Inngest dashboard
- Events sent from your API will trigger functions
- You can view function runs, retries, and logs

## Local Development

### Running Inngest Dev Server
```bash
# Option 1: Use the combined command
pnpm dev:main

# Option 2: Run Inngest separately
pnpm dev:inngest
```

The Inngest dev server will be available at `http://localhost:8288`

### Testing Functions Locally
1. Start your Next.js app: `pnpm dev:main`
2. The Inngest dev server will automatically connect to your app
3. Functions will appear in the Inngest dev dashboard
4. Test by creating an order - the confirmation email function should trigger

## Troubleshooting

### Functions Not Appearing
- Verify your endpoint URL is accessible: `curl https://your-domain.vercel.app/api/inngest`
- Check that `INNGEST_SIGNING_KEY` matches in both your environment and Inngest dashboard
- Ensure your Next.js app is deployed and running

### Events Not Triggering
- Check that `INNGEST_BASE_URL` is set to `https://api.inngest.com` in production
- Verify events are being sent from your API routes
- Check Inngest dashboard for event history

### 404 on Endpoint
- Ensure the route handler exists at `apps/main/src/app/api/inngest/route.ts`
- Verify the Next.js app is built and deployed correctly
- Check Vercel deployment logs for errors

## Production Deployment Checklist

- [ ] Set `INNGEST_BASE_URL=https://api.inngest.com` in Vercel
- [ ] Set `INNGEST_SIGNING_KEY` (production key) in Vercel
- [ ] Set `INNGEST_EVENT_KEY` (production key) in Vercel
- [ ] Deploy to Vercel
- [ ] Get production URL
- [ ] Sync app in Inngest dashboard with: `https://your-domain.vercel.app/api/inngest`
- [ ] Verify functions appear in Inngest dashboard
- [ ] Test by creating an order
