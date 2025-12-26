# Inngest Production Setup

## Your Inngest Endpoint URL

Once your API is deployed to production, your Inngest endpoint will be:

```
https://your-domain.com/api/inngest
```

**Example:**
- If your API is hosted at: `https://api.lumi.com`
- Your Inngest endpoint is: `https://api.lumi.com/api/inngest`

Or if you're using a subdomain:
- If your API is hosted at: `https://lumi-api.vercel.app`
- Your Inngest endpoint is: `https://lumi-api.vercel.app/api/inngest`

## Production Configuration

### 1. Environment Variables

Set these in your production environment (Vercel, Fly.io, Railway, etc.):

```env
INNGEST_BASE_URL=https://api.inngest.com
INNGEST_EVENT_KEY=your_production_event_key
INNGEST_SIGNING_KEY=signkey-prod-e85ec4f252b73073d57573d79f9f06dc6db2f8efb28c9cabf1f5d56920963bda
```

### 2. Connect to Inngest Cloud

1. Go to your [Inngest Dashboard](https://app.inngest.com)
2. Navigate to **Sync** or **Apps**
3. Click **Add App** or **Sync App**
4. Enter your Inngest endpoint URL:
   ```
   https://your-domain.com/api/inngest
   ```
5. Verify the signing key matches:
   ```
   signkey-prod-e85ec4f252b73073d57573d79f9f06dc6db2f8efb28c9cabf1f5d56920963bda
   ```
6. Click **Sync** or **Save**

### 3. Verify Connection

After syncing:
- Your functions should appear in the Inngest dashboard
- Events sent from your API will trigger functions
- You can view function runs, retries, and logs in the dashboard

## Local Development vs Production

### Local Development
- **INNGEST_BASE_URL**: `http://127.0.0.1:8288`
- **INNGEST_SIGNING_KEY**: `dev`
- Uses Inngest Dev Server (runs via `pnpm dev:inngest`)

### Production
- **INNGEST_BASE_URL**: `https://api.inngest.com`
- **INNGEST_SIGNING_KEY**: `signkey-prod-e85ec4f252b73073d57573d79f9f06dc6db2f8efb28c9cabf1f5d56920963bda`
- Uses Inngest Cloud (managed service)

## Troubleshooting

### Functions Not Appearing
- Verify your endpoint URL is accessible: `curl https://your-domain.com/api/inngest`
- Check that `INNGEST_SIGNING_KEY` matches in both your environment and Inngest dashboard
- Ensure your API server is running and accessible

### Events Not Triggering
- Check that `INNGEST_BASE_URL` is set to `https://api.inngest.com` in production
- Verify events are being sent: check API logs for Inngest event sends
- Check Inngest dashboard for event history

### 404 on Endpoint
- Ensure the Inngest plugin is registered (check API startup logs)
- Verify the endpoint path: `/api/inngest` (default for Fastify plugin)
- Check that `ENABLE_INNGEST` is set or `NODE_ENV` is not blocking registration

