FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml ./
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/compliance-core/package.json ./packages/compliance-core/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy source code
COPY packages ./packages
COPY apps/api ./apps/api
COPY package.json pnpm-workspace.yaml ./

# Generate Prisma client (once, in builder stage)
WORKDIR /app/packages/db
RUN pnpm generate

# Build packages in dependency order
# Build db package (no build script, so use tsc directly)
WORKDIR /app/packages/db
RUN pnpm exec tsc

WORKDIR /app/packages/shared
RUN pnpm build

WORKDIR /app/packages/compliance-core
RUN pnpm build

# Build API (depends on all packages)
WORKDIR /app/apps/api
RUN pnpm build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy workspace configuration
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./

# Copy built application
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./apps/api/

# Copy root node_modules (shared dependencies)
COPY --from=builder /app/node_modules ./node_modules

# Copy db package (built + Prisma client + node_modules)
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder /app/packages/db/package.json ./packages/db/package.json

# Copy shared package (built + node_modules + package.json)
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json

# Copy compliance-core package (built + node_modules + package.json)
COPY --from=builder /app/packages/compliance-core/dist ./packages/compliance-core/dist
COPY --from=builder /app/packages/compliance-core/node_modules ./packages/compliance-core/node_modules
COPY --from=builder /app/packages/compliance-core/package.json ./packages/compliance-core/package.json

# Update package.json main fields to point to dist for built packages
# This ensures Node.js can resolve the built JavaScript files at runtime
RUN sed -i 's|"main": "./src/index.ts"|"main": "./dist/index.js"|g' ./packages/db/package.json && \
    sed -i 's|"types": "./src/index.ts"|"types": "./dist/index.d.ts"|g' ./packages/db/package.json && \
    sed -i 's|"main": "./src/index.ts"|"main": "./dist/index.js"|g' ./packages/shared/package.json && \
    sed -i 's|"types": "./src/index.ts"|"types": "./dist/index.d.ts"|g' ./packages/shared/package.json && \
    sed -i 's|"main": "./src/index.ts"|"main": "./dist/index.js"|g' ./packages/compliance-core/package.json && \
    sed -i 's|"types": "./src/index.ts"|"types": "./dist/index.d.ts"|g' ./packages/compliance-core/package.json

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

USER nodejs

WORKDIR /app

EXPOSE 3001

CMD ["node", "dist/index.js"]
