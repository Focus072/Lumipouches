import { FastifyPluginAsync } from 'fastify';

export const requestId: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request, reply) => {
    const reqId = request.id;
    reply.header('X-Request-ID', reqId);
  });
};

