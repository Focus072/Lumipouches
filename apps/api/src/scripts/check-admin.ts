import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

async function main() {
  try {
    console.log('Checking for admin accounts...\n');

    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        disabledAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (adminUsers.length === 0) {
      console.log('❌ No admin accounts found in the database.');
      console.log('\nTo create an admin account, you can run:');
      console.log('  pnpm create-admin');
    } else {
      console.log(`✓ Found ${adminUsers.length} admin account(s):\n`);
      for (const [index, user] of adminUsers.entries()) {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Created: ${user.createdAt.toISOString()}`);
        if (user.disabledAt) {
          console.log(`   Status: DISABLED (at ${user.disabledAt.toISOString()})`);
        } else {
          console.log('   Status: ACTIVE');
        }
        console.log('');
      }
    }
  } catch (error) {
    console.error('Error checking admin accounts:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

