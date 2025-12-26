import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export const productsRoutes: FastifyPluginAsync = async (fastify) => {
  // Public endpoint - no auth required
  fastify.get<{ Querystring: { search?: string; flavorType?: string; minNicotine?: string; maxNicotine?: string; sort?: string } }>('/products', async (request) => {
    const search = request.query.search;
    const flavorType = request.query.flavorType;
    const minNicotine = request.query.minNicotine ? parseFloat(request.query.minNicotine) : undefined;
    const maxNicotine = request.query.maxNicotine ? parseFloat(request.query.maxNicotine) : undefined;
    const sort = request.query.sort || 'name';

    const where: any = {
      active: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (flavorType) {
      where.flavorType = flavorType;
    }

    if (minNicotine !== undefined || maxNicotine !== undefined) {
      where.nicotineMg = {};
      if (minNicotine !== undefined) where.nicotineMg.gte = minNicotine;
      if (maxNicotine !== undefined) where.nicotineMg.lte = maxNicotine;
    }

    const orderBy: any = {};
    switch (sort) {
      case 'name':
        orderBy.name = 'asc';
        break;
      case 'price-asc':
        orderBy.price = 'asc';
        break;
      case 'price-desc':
        orderBy.price = 'desc';
        break;
      case 'nicotine-asc':
        orderBy.nicotineMg = 'asc';
        break;
      case 'nicotine-desc':
        orderBy.nicotineMg = 'desc';
        break;
      default:
        orderBy.name = 'asc';
    }

    const products = await prisma.product.findMany({
      where,
      orderBy,
    });

    return {
      success: true,
      data: products,
    };
  });
};

