import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { verifyPassword, generateSessionToken, hashPassword } from '../plugins/auth.js';
import crypto from 'crypto';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const logoutSchema = z.object({
  token: z.string().optional(),
});

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  });

  // Customer signup endpoint
  fastify.post('/signup', async (request, reply) => {
    const body = signupSchema.parse(request.body);

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existing) {
      return reply.code(400).send({
        success: false,
        error: { code: 'EMAIL_EXISTS', message: 'User with this email already exists' },
      });
    }

    const passwordHash = await hashPassword(body.password);

    // Create customer user
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        role: 'CUSTOMER',
      },
    });

    // Create session
    const token = generateSessionToken();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Audit log
    await prisma.auditEvent.create({
      data: {
        actorUserId: user.id,
        actorType: 'USER',
        action: 'SIGNUP',
        entityType: 'USER',
        entityId: user.id,
        result: 'SUCCESS',
      },
    });

    return {
      success: true,
      data: {
        token,
        expiresAt,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
    };
  });

  fastify.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      return reply.code(401).send({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
    }

    if (user.disabledAt) {
      return reply.code(401).send({
        success: false,
        error: { code: 'ACCOUNT_DISABLED', message: 'Account is disabled' },
      });
    }

    const isValid = await verifyPassword(body.password, user.passwordHash);
    if (!isValid) {
      return reply.code(401).send({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
    }

    // Create session
    const token = generateSessionToken();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Audit log
    await prisma.auditEvent.create({
      data: {
        actorUserId: user.id,
        actorType: 'USER',
        action: 'LOGIN',
        entityType: 'SESSION',
        result: 'SUCCESS',
      },
    });

    return {
      success: true,
      data: {
        token,
        expiresAt,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
    };
  });

  fastify.post('/logout', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      await prisma.session.updateMany({
        where: { tokenHash },
        data: { revokedAt: new Date() },
      });

      // Audit log
      if (request.user) {
        await prisma.auditEvent.create({
          data: {
            actorUserId: request.user.id,
            actorType: 'USER',
            action: 'LOGOUT',
            entityType: 'SESSION',
            result: 'SUCCESS',
          },
        });
      }
    }

    return { success: true };
  });
};

