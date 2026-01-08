/**
 * Create a test admin user for local development
 * Usage: npx tsx "C:\dev\Lumi website\apps\main\scripts\create-test-admin.ts"
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { prisma } from '@lumi/db';
import { hashPassword } from '../src/lib/api-auth';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

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
    });

    if (existing) {
      console.log(`⚠️  User with email ${email} already exists.`);
      console.log('Updating password and role...');
      
      const passwordHash = await hashPassword(password);
      
      await prisma.user.update({
        where: { email },
        data: {
          passwordHash,
          role: 'ADMIN',
          emailVerified: true, // Set to true so they can login immediately
        },
      });
      
      console.log('✓ Admin user updated successfully!');
      console.log(`  Email: ${email}`);
      console.log(`  Role: ADMIN`);
      console.log(`  Email Verified: true`);
    } else {
      const passwordHash = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: 'ADMIN',
          emailVerified: true, // Set to true so they can login immediately
        },
      });

      console.log('✓ Admin user created successfully!');
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Email Verified: true`);
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
