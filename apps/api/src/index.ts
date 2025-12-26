import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
import { authRoutes } from './routes/auth.js';
import { adminRoutes } from './routes/admin.js';
import { ordersRoutes } from './routes/orders.js';
import { productsRoutes } from './routes/products.js';
import { addressesRoutes } from './routes/addresses.js';
import { errorHandler } from './plugins/error-handler.js';
import { requestId } from './plugins/request-id.js';
import { authPlugin } from './plugins/auth.js';
import { swaggerPlugin } from './plugins/swagger.js';
import { registerInngest } from './plugins/inngest.js';

const server = Fastify({
  logger: {
    transport: process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' } }
      : undefined,
    level: process.env.LOG_LEVEL || 'info',
  },
  requestIdLogLabel: 'reqId',
  genReqId: () => crypto.randomUUID(),
});

// Register plugins
await server.register(requestId);
await server.register(errorHandler);
await server.register(cors, {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3002'],
  credentials: true,
});

// Register Swagger/OpenAPI documentation (only in development)
if (process.env.NODE_ENV === 'development' || process.env.ENABLE_SWAGGER === 'true') {
  await server.register(swaggerPlugin);
}

// Register Inngest (background jobs/events)
// Always register - Inngest plugin handles environment checks internally
try {
  await registerInngest(server);
} catch (error) {
  server.log.warn(error, 'Failed to register Inngest plugin');
}

// Health check
server.get('/health', async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', database: 'connected' };
  } catch (error) {
    server.log.error(error, 'Health check failed');
    return { status: 'error', database: 'disconnected' };
  }
});

// Enhanced health check with monitoring
server.get('/health/detailed', async () => {
  try {
    const { performHealthChecks } = await import('./services/monitoring.js');
    return await performHealthChecks();
  } catch (error) {
    server.log.error(error, 'Detailed health check failed');
    return {
      status: 'unhealthy',
      checks: { database: 'error' },
      timestamp: new Date().toISOString(),
    };
  }
});

// Auth routes with rate limiting
await server.register(async (fastify) => {
  await fastify.register(rateLimit, {
    max: 5,
    timeWindow: '1 minute',
    skipOnError: false,
  });
  await fastify.register(authRoutes, { prefix: '/auth' });
});

// Admin routes (protected)
await server.register(authPlugin);
await server.register(adminRoutes, { prefix: '/admin' });

// Products routes (public)
await server.register(productsRoutes);

// Addresses routes (public)
await server.register(addressesRoutes);

// Orders routes (protected)
await server.register(ordersRoutes);

// Me endpoint
server.get('/me', { preHandler: [async (request, reply) => { await server.authenticate(request, reply); }] }, async (request, reply) => {
  if (!request.user) {
    return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
  }
  
  const user = await prisma.user.findUnique({
    where: { id: request.user.id },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    return reply.code(404).send({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
  }

  return { success: true, data: user };
});

const port = Number(process.env.API_PORT) || 3001;
const host = process.env.API_HOST || '0.0.0.0';

try {
  await server.listen({ port, host });
  server.log.info(`Server listening on ${host}:${port}`);
} catch (err) {
  server.log.error(err);
  process.exit(1);
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  server.log.info('SIGTERM received, shutting down gracefully');
  await server.close();
  await prisma.$disconnect();
  process.exit(0);
});

