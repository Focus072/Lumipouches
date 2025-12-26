# Inngest & Neon Setup Guide

This project is configured to work with:
- **Inngest Dev Server** (local development)
- **Neon PostgreSQL** (cloud database)
- **Fastify API** (port 3001)
- **Next.js Admin** (port 3002)
- **Next.js Storefront** (port 3000)

## Prerequisites

1. Node.js >= 18.0.0
2. pnpm >= 8.0.0
3. Neon PostgreSQL database (free tier available)
4. Inngest CLI (installed via npx, no local install needed)

## Environment Setup

### 1. API Environment Variables

Create `apps/api/.env.local` (this file is gitignored):

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-xxx-xxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require

# Inngest (Local Dev Server)
INNGEST_BASE_URL=http://127.0.0.1:8288
INNGEST_EVENT_KEY=dev
INNGEST_SIGNING_KEY=dev

# Server Configuration
API_PORT=3001
API_HOST=0.0.0.0
NODE_ENV=development
LOG_LEVEL=info

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:3002

# Session Security
SESSION_SECRET=your-secure-random-string-minimum-32-characters-long

# Cloudflare R2 Storage (if using file uploads)
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=lumi-files
R2_PUBLIC_URL=https://your-bucket.r2.dev

# Email Service (SendGrid or other)
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@lumi.com
EMAIL_FROM_NAME=Lumi Commerce

# Veriff Age Verification
VERIFF_BASE_URL=https://stationapi.veriff.com
VERIFF_API_KEY=your_veriff_api_key
VERIFF_SIGNATURE_KEY=your_veriff_signature_key

# Authorize.Net Payment Processing
AUTHORIZENET_API_LOGIN_ID=your_login_id
AUTHORIZENET_TRANSACTION_KEY=your_transaction_key
AUTHORIZENET_ENV=sandbox

# Shippo Shipping
SHIPPO_TOKEN=your_shippo_token

# Tax Configuration
SALES_TAX_RATE=0
EXCISE_TAX_PER_GRAM=0
```

### 2. Next.js App Environment Variables

For `apps/admin/.env.local` and `apps/storefront/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Installation

1. Install dependencies:
```bash
pnpm install
```

2. Generate Prisma client:
```bash
pnpm db:generate
```

3. Run database migrations (if needed):
```bash
pnpm db:migrate
```

## Running the Development Environment

You need to run **three separate terminals**:

### Terminal 1: Inngest Dev Server
```bash
pnpm dev:inngest
# Or: npx inngest-cli dev
```
This starts the Inngest dev server on port 8288. The Inngest dashboard will be available at `http://localhost:8288`.

### Terminal 2: API Server
```bash
pnpm dev:api
```
This starts the Fastify API server on port 3001. The Inngest endpoint will be available at `http://localhost:3001/api/inngest`.

### Terminal 3: Next.js Apps (Optional)
```bash
pnpm dev
```
This starts both the admin (port 3002) and storefront (port 3000) apps.

Or run them individually:
```bash
pnpm dev:admin      # Admin on port 3002
pnpm dev:storefront # Storefront on port 3000
```

## How It Works

### Inngest Integration

1. **Event Triggers**: When orders are created or shipped, events are sent to Inngest:
   - `order/created` - Triggered when an order is successfully created
   - `order/shipped` - Triggered when an order status changes to SHIPPED

2. **Background Functions**: Inngest functions handle:
   - Sending order confirmation emails
   - Sending shipping notification emails

3. **Local Development**: 
   - Inngest dev server runs locally on port 8288
   - Functions execute locally but are managed by Inngest
   - View function runs in the Inngest dashboard

### Database Connection

- Uses **Neon PostgreSQL** (cloud database)
- Connection string is set via `DATABASE_URL` environment variable
- Prisma ORM handles database operations
- Database migrations are managed via Prisma

## Testing the Setup

1. **Check API Health**:
   ```bash
   curl http://localhost:3001/health
   ```

2. **Check Inngest Status**:
   - Open `http://localhost:8288` in your browser
   - You should see the Inngest dashboard

3. **Create a Test Order**:
   - Use your API to create an order
   - Check the Inngest dashboard to see the `order/created` event
   - Verify the order confirmation email function runs

## Production Deployment

When deploying to production:

1. **Update Inngest Configuration**:
   ```env
   INNGEST_BASE_URL=https://api.inngest.com
   INNGEST_EVENT_KEY=your_production_event_key
   INNGEST_SIGNING_KEY=your_production_signing_key
   ```

2. **Update Database URL**:
   - Use your production Neon database connection string

3. **Secure Environment Variables**:
   - Use your platform's secret management (Vercel, Fly.io, etc.)

## Troubleshooting

### Inngest Dev Server Not Starting
- Make sure port 8288 is available
- Check if another process is using the port
- Try: `npx inngest-cli dev --port 8289` and update `INNGEST_BASE_URL`

### API Can't Connect to Inngest
- Ensure the Inngest dev server is running
- Check that `INNGEST_BASE_URL` matches the dev server URL
- Look for warnings in API logs about Inngest registration

### Database Connection Issues
- Verify your Neon `DATABASE_URL` is correct
- Check that your Neon database is active
- Ensure SSL mode is set correctly: `?sslmode=require`

### Functions Not Triggering
- Check the Inngest dashboard for events
- Verify events are being sent (check API logs)
- Ensure function definitions match event names

## Additional Resources

- [Inngest Documentation](https://www.inngest.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Fastify Documentation](https://www.fastify.io/)
- [Prisma Documentation](https://www.prisma.io/docs)

