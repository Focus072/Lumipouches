import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  try {
    const email = process.argv[2] || 'admin@lumi.com';
    const password = process.argv[3] || 'admin123456';

    if (!email || !email.includes('@')) {
      console.error('Invalid email address');
      process.exit(1);
    }

    if (!password || password.length < 8) {
      console.error('Password must be at least 8 characters');
      process.exit(1);
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      console.error(`User with email ${email} already exists`);
      process.exit(1);
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'ADMIN',
      },
    });

    console.log(`\n✓ Admin user created successfully!`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Password: ${password}`);

    // Audit log
    await prisma.auditEvent.create({
      data: {
        actorType: 'SYSTEM',
        action: 'CREATE_ADMIN_USER',
        entityType: 'USER',
        entityId: user.id,
        result: 'SUCCESS',
      },
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

