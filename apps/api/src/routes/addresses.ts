import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

const createAddressSchema = z.object({
  recipientName: z.string().min(1),
  phone: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().length(2),
  postalCode: z.string().min(1),
  country: z.string().default('US'),
  isPoBox: z.boolean().default(false),
});

export const addressesRoutes: FastifyPluginAsync = async (fastify) => {
  // Public endpoint - no auth required for storefront (guest checkout)
  fastify.post<{ Body: z.infer<typeof createAddressSchema> }>('/addresses', async (request, reply) => {
    const body = createAddressSchema.parse(request.body);

    // Check if address is PO box
    const isPoBox = body.isPoBox || 
                   body.line1.toLowerCase().includes('po box') ||
                   body.line1.toLowerCase().includes('p.o. box') ||
                   body.line1.toLowerCase().startsWith('po ');

    const userId = request.user?.id || null;

    const address = await prisma.address.create({
      data: {
        userId,
        recipientName: body.recipientName,
        phone: body.phone,
        line1: body.line1,
        line2: body.line2,
        city: body.city,
        state: body.state,
        postalCode: body.postalCode,
        country: body.country,
        isPoBox,
      },
    });

    return {
      success: true,
      data: {
        id: address.id,
      },
    };
  });

  // Get user's saved addresses (authenticated)
  fastify.get('/addresses', { preHandler: [async (request, reply) => { await fastify.authenticate(request, reply); }] }, async (request, reply) => {
    const userId = request.user?.id;
    if (!userId) {
      return reply.code(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return {
      success: true,
      data: addresses,
    };
  });

  // Create saved address (authenticated)
  const createSavedAddressSchema = createAddressSchema.extend({
    isDefault: z.boolean().optional(),
  });

  fastify.post<{ Body: z.infer<typeof createSavedAddressSchema> }>('/addresses/saved', {
    preHandler: [async (request, reply) => { await fastify.authenticate(request, reply); }],
  }, async (request, reply) => {
    const userId = request.user?.id;
    if (!userId) {
      return reply.code(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const body = createSavedAddressSchema.parse(request.body);

    // Check if address is PO box
    const isPoBox = body.isPoBox || 
                   body.line1.toLowerCase().includes('po box') ||
                   body.line1.toLowerCase().includes('p.o. box') ||
                   body.line1.toLowerCase().startsWith('po ');

    // If this is set as default, unset other defaults
    if (body.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        recipientName: body.recipientName,
        phone: body.phone,
        line1: body.line1,
        line2: body.line2,
        city: body.city,
        state: body.state,
        postalCode: body.postalCode,
        country: body.country,
        isPoBox,
        isDefault: body.isDefault || false,
      },
    });

    return {
      success: true,
      data: address,
    };
  });

  // Update saved address (authenticated)
  const updateAddressSchema = createSavedAddressSchema.partial();

  fastify.put<{ Params: { id: string }; Body: z.infer<typeof updateAddressSchema> }>('/addresses/:id', {
    preHandler: [async (request, reply) => { await fastify.authenticate(request, reply); }],
  }, async (request, reply) => {
    const userId = request.user?.id;
    if (!userId) {
      return reply.code(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const address = await prisma.address.findFirst({
      where: {
        id: request.params.id,
        userId,
      },
    });

    if (!address) {
      return reply.code(404).send({
        success: false,
        error: { code: 'ADDRESS_NOT_FOUND', message: 'Address not found' },
      });
    }

    const body = updateAddressSchema.parse(request.body);

    // If setting as default, unset other defaults
    if (body.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true, id: { not: request.params.id } },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id: request.params.id },
      data: {
        ...(body.recipientName !== undefined && { recipientName: body.recipientName }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.line1 !== undefined && { line1: body.line1 }),
        ...(body.line2 !== undefined && { line2: body.line2 }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.state !== undefined && { state: body.state }),
        ...(body.postalCode !== undefined && { postalCode: body.postalCode }),
        ...(body.country !== undefined && { country: body.country }),
        ...(body.isPoBox !== undefined && { isPoBox: body.isPoBox }),
        ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
      },
    });

    return {
      success: true,
      data: updated,
    };
  });

  // Delete saved address (authenticated)
  fastify.delete<{ Params: { id: string } }>('/addresses/:id', {
    preHandler: [async (request, reply) => { await fastify.authenticate(request, reply); }],
  }, async (request, reply) => {
    const userId = request.user?.id;
    if (!userId) {
      return reply.code(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const address = await prisma.address.findFirst({
      where: {
        id: request.params.id,
        userId,
      },
    });

    if (!address) {
      return reply.code(404).send({
        success: false,
        error: { code: 'ADDRESS_NOT_FOUND', message: 'Address not found' },
      });
    }

    await prisma.address.delete({
      where: { id: request.params.id },
    });

    return {
      success: true,
      data: { message: 'Address deleted successfully' },
    };
  });
};

