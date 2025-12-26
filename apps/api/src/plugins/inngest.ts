import { Inngest } from 'inngest';
import { fastifyPlugin } from 'inngest/fastify';
import type { FastifyInstance } from 'fastify';

// Initialize Inngest client
export const inngest = new Inngest({
  id: 'lumi-api',
  name: 'Lumi API',
  eventKey: process.env.INNGEST_EVENT_KEY || 'dev',
});

// Import your functions
import { orderProcessingFunctions } from '../functions/order-processing.js';

/**
 * Register Inngest plugin with Fastify
 */
export async function registerInngest(fastify: FastifyInstance) {
  const baseURL = process.env.INNGEST_BASE_URL || 'http://127.0.0.1:8288';
  const signingKey = process.env.INNGEST_SIGNING_KEY || 'dev';

  await fastify.register(fastifyPlugin, {
    client: inngest,
    functions: orderProcessingFunctions,
    signingKey,
    env: process.env.NODE_ENV || 'development',
  });

  fastify.log.info(`Inngest plugin registered (baseURL: ${baseURL})`);
}

