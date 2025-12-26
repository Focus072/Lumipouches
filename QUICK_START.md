# Quick Start Checklist

## ✅ What's Been Set Up

- ✅ Inngest package added to `apps/api/package.json`
- ✅ Inngest plugin created (`apps/api/src/plugins/inngest.ts`)
- ✅ Inngest functions created for order processing (`apps/api/src/functions/order-processing.ts`)
- ✅ Inngest integrated into Fastify server
- ✅ Event triggers added to order creation and shipping
- ✅ Environment variable templates updated
- ✅ Root package.json updated with `dev:inngest` script
- ✅ Setup documentation created

## 🔧 What You Need To Do

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Create Environment Files

**Create `apps/api/.env.local`** with your actual values:

```env
# Your Neon Database Connection String
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-xxx-xxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require

# Inngest (use these defaults for local dev)
INNGEST_BASE_URL=http://127.0.0.1:8288
INNGEST_EVENT_KEY=dev
INNGEST_SIGNING_KEY=dev

# Server
API_PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3002

# Generate a secure random string for SESSION_SECRET
SESSION_SECRET=your-secure-random-string-min-32-chars

# Add other service keys as needed (R2, SendGrid, Veriff, etc.)
```

**For Next.js apps**, create:
- `apps/admin/.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:3001`
- `apps/storefront/.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:3001`

### 3. Start Development Servers

**Terminal 1 - Inngest:**
```bash
pnpm dev:inngest
```

**Terminal 2 - API:**
```bash
pnpm dev:api
```

**Terminal 3 - Frontend (optional):**
```bash
pnpm dev
```

### 4. Verify Setup

1. Check Inngest dashboard: http://localhost:8288
2. Check API health: http://localhost:3001/health
3. Inngest endpoint should be at: http://localhost:3001/api/inngest

## 📋 What I Need From You

1. **Your Neon Database Connection String**
   - Format: `postgresql://user:password@host/database?sslmode=require`
   - You can get this from your Neon dashboard

2. **Optional Service Keys** (if you're using these features):
   - SendGrid API key (for email sending)
   - Cloudflare R2 credentials (for file storage)
   - Veriff keys (for age verification)
   - Authorize.Net keys (for payments)
   - Shippo token (for shipping)

3. **Any Custom Requirements**
   - Do you need Inngest in the Next.js apps too?
   - Any specific event handlers you want?
   - Custom email templates?

## 🚀 Next Steps After Setup

1. Test creating an order - should trigger `order/created` event
2. Test shipping an order - should trigger `order/shipped` event
3. Check Inngest dashboard to see function executions
4. Verify emails are being sent (if SendGrid is configured)

## 📚 Documentation

See `SETUP.md` for detailed setup instructions and troubleshooting.

