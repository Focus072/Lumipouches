import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' },
      });
    }

    const token = authHeader.substring(7);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      return reply.code(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid or expired session' },
      });
    }

    if (session.user.disabledAt) {
      return reply.code(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User account is disabled' },
      });
    }

    request.user = {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
    };
  });

  fastify.decorate('requireAdmin', async (request: FastifyRequest, reply: FastifyReply) => {
    await fastify.authenticate(request, reply);
    if (request.user?.role !== 'ADMIN') {
      return reply.code(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Admin access required' },
      });
    }
  });
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateSessionToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

