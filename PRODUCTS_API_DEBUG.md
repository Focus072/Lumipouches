# Products API 500 Error Debugging

## Since DATABASE_URL is Already Set

If Neon is connected to Vercel automatically, the issue is likely one of these:

### 1. Check Vercel Function Logs

To see the actual error:
1. Go to Vercel Dashboard → Your Project
2. Click on the latest deployment
3. Go to **Functions** tab
4. Find `/api/products` function
5. Click on it to see **Logs**
6. Look for the actual error message (not just "500")

### 2. Common Issues

#### Issue: Database Schema Not Migrated
**Error:** Table doesn't exist or column doesn't exist
**Solution:** Run migrations in production:
```bash
# In Vercel, you can add this to build command or run manually
pnpm --filter db migrate:deploy
```

#### Issue: Prisma Client Not Generated Properly
**Error:** Prisma client not found or outdated
**Solution:** The build should generate it, but check if it's included

#### Issue: Type Mismatch
**Error:** Prisma query type errors
**Solution:** Check if Product model fields match what we're querying

### 3. Test the Endpoint Directly

Try accessing the endpoint directly:
```
https://www.lumipouches.com/api/products
```

This will help see if it's a query parameter issue or a general database issue.

### 4. Check Database Tables

Verify the `Product` table exists in your Neon database:
- Go to Neon Dashboard
- Check if the `Product` table exists
- Verify it has the expected columns

### 5. Quick Test Route

We could add a simpler test route to verify database connection:
```typescript
// /api/test-db
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ success: true, message: 'Database connected' });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
```
