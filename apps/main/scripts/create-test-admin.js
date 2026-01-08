/**
 * Create a test admin user for local development
 * Usage: node apps/main/scripts/create-test-admin.js
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
  const email = 'admin@gmail.com';
  const password = 'admin123';

  try {
    console.log('Creating test admin user...');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}\n`);

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    const passwordHash = await hashPassword(password);

    if (existing) {
      console.log(`⚠️  User with email ${email} already exists.`);
      console.log('Updating password and role...');
      
      // Use raw SQL to update, avoiding schema fields that might not exist
      await prisma.$executeRaw`
        UPDATE users 
        SET password_hash = ${passwordHash}, role = 'ADMIN'
        WHERE email = ${email}
      `;
      
      console.log('✓ Admin user updated successfully!');
      console.log(`  Email: ${email}`);
      console.log(`  Role: ADMIN`);
    } else {
      // Use raw SQL to insert, avoiding schema fields that might not exist
      const result = await prisma.$executeRaw`
        INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
        VALUES (gen_random_uuid(), ${email}, ${passwordHash}, 'ADMIN', NOW(), NOW())
        RETURNING id, email, role
      `;
      
      // Fetch the created user
      const user = await prisma.$queryRaw`
        SELECT id, email, role FROM users WHERE email = ${email}
      `;

      console.log('✓ Admin user created successfully!');
      console.log(`  ID: ${user[0].id}`);
      console.log(`  Email: ${user[0].email}`);
      console.log(`  Role: ${user[0].role}`);
    }

    console.log('\n✅ You can now login at http://localhost:3000/auth/login');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
