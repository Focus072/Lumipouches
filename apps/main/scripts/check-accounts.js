/**
 * Check existing test accounts
 * Usage: node apps/main/scripts/check-accounts.js
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@lumi/db');

// Load .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (key && value && !process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

async function main() {
  try {
    console.log('Checking test accounts...\n');

    // Check admin account
    const admin = await prisma.$queryRaw`
      SELECT id, email, role FROM users WHERE email = 'admin@gmail.com'
    `;

    if (admin && admin.length > 0) {
      console.log('✅ Admin Account Found:');
      console.log(`   Email: ${admin[0].email}`);
      console.log(`   Role: ${admin[0].role}`);
      console.log(`   ID: ${admin[0].id}`);
      console.log(`   Password: admin123\n`);
    } else {
      console.log('❌ Admin account NOT found (admin@gmail.com)\n');
    }

    // Check customer account
    const customer = await prisma.$queryRaw`
      SELECT id, email, role FROM users WHERE email = 'customer@test.com'
    `;

    if (customer && customer.length > 0) {
      console.log('✅ Customer Account Found:');
      console.log(`   Email: ${customer[0].email}`);
      console.log(`   Role: ${customer[0].role}`);
      console.log(`   ID: ${customer[0].id}`);
      console.log(`   Password: customer123\n`);
    } else {
      console.log('❌ Customer account NOT found (customer@test.com)\n');
    }

    console.log('---');
    console.log('Login URLs:');
    console.log('  Admin: http://localhost:3000 (redirects to /admin)');
    console.log('  Customer: http://localhost:3000 (redirects to /products)');
  } catch (error) {
    console.error('❌ Error checking accounts:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
