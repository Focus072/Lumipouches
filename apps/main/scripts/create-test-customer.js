/**
 * Create a test customer user for local development
 * Usage: node apps/main/scripts/create-test-customer.js
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@lumi/db');
const bcrypt = require('bcryptjs');

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

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function main() {
  const email = 'customer@test.com';
  const password = 'customer123';

  try {
    console.log('Creating test customer user...');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}\n`);

    // Check if user already exists
    const existing = await prisma.$queryRaw`
      SELECT id, email, role FROM users WHERE email = ${email}
    `;

    const passwordHash = await hashPassword(password);

    if (existing && existing.length > 0) {
      console.log(`⚠️  User with email ${email} already exists.`);
      console.log('Updating password and role...');
      
      // Use raw SQL to update, avoiding schema fields that might not exist
      await prisma.$executeRaw`
        UPDATE users 
        SET password_hash = ${passwordHash}, role = 'CUSTOMER'
        WHERE email = ${email}
      `;
      
      const updated = await prisma.$queryRaw`
        SELECT id, email, role FROM users WHERE email = ${email}
      `;
      
      console.log('✓ Customer user updated successfully!');
      console.log(`  ID: ${updated[0].id}`);
      console.log(`  Email: ${updated[0].email}`);
      console.log(`  Role: ${updated[0].role}`);
    } else {
      // Use raw SQL to insert, avoiding schema fields that might not exist
      await prisma.$executeRaw`
        INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
        VALUES (gen_random_uuid(), ${email}, ${passwordHash}, 'CUSTOMER', NOW(), NOW())
      `;
      
      // Fetch the created user
      const user = await prisma.$queryRaw`
        SELECT id, email, role FROM users WHERE email = ${email}
      `;

      console.log('✓ Customer user created successfully!');
      console.log(`  ID: ${user[0].id}`);
      console.log(`  Email: ${user[0].email}`);
      console.log(`  Role: ${user[0].role}`);
    }

    console.log('\n✅ You can now login at http://localhost:3000');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   This will redirect to /products (storefront)`);
  } catch (error) {
    console.error('❌ Error creating customer user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
