import Fastify from 'fastify';
import { authPlugin } from './plugins/auth.js';
import { errorHandler } from './plugins/error-handler.js';
import { requestId } from './plugins/request-id.js';
import { ordersRoutes } from './routes/orders.js';
import { adminRoutes } from './routes/admin.js';

export async function buildFastify(): Promise<ReturnType<typeof Fastify>> {
  const app = Fastify({
    logger: false, // Disable logging in tests
  });

  await app.register(requestId);
  await app.register(errorHandler);
  await app.register(authPlugin);
  await app.register(ordersRoutes);
  await app.register(adminRoutes, { prefix: '/admin' });

  return app;
}

