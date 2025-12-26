/**
 * Swagger/OpenAPI Documentation Plugin
 * 
 * Provides API documentation at /api-docs endpoint
 */

import { FastifyPluginAsync } from 'fastify';
// @ts-ignore - Type definitions may be missing but package is installed
import swagger from '@fastify/swagger';
// @ts-ignore - Type definitions may be missing but package is installed
import swaggerUi from '@fastify/swagger-ui';

export const swaggerPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Lumi Commerce API',
        description: 'Regulated nicotine commerce system API',
        version: '1.0.0',
      },
      servers: [
        {
          url: process.env.API_URL || 'http://localhost:3001',
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      tags: [
        { name: 'auth', description: 'Authentication endpoints' },
        { name: 'products', description: 'Product management' },
        { name: 'orders', description: 'Order management' },
        { name: 'admin', description: 'Admin operations' },
        { name: 'addresses', description: 'Address management' },
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/api-docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    staticCSP: true,
    transformStaticCSP: (header: string) => header,
  });
};

