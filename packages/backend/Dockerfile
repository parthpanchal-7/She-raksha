# ==============================================================================
# She-Raksha (शी-रक्षा) — Fastify Backend Production Dockerfile
# Multi-Stage Build with Non-Root Security Context & Healthcheck
# ==============================================================================

FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ------------------------------------------------------------------------------
# Build Stage: Install dependencies and compile TypeScript
# ------------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

# Copy root workspace configurations
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./

# Copy packages required by @she-raksha/backend
COPY packages/schemas/ ./packages/schemas/
COPY packages/crypto-core/ ./packages/crypto-core/
COPY packages/contracts/ ./packages/contracts/
COPY packages/circuits/ ./packages/circuits/
COPY packages/sdk/ ./packages/sdk/
COPY packages/design-tokens/ ./packages/design-tokens/
COPY packages/backend/ ./packages/backend/

# Install dependencies and build dependency tree
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @she-raksha/contracts compile
RUN pnpm turbo run build --filter=@she-raksha/backend...

# ------------------------------------------------------------------------------
# Runner Stage: Minimal production runtime with non-root user
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Create dedicated non-root security group and user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 sheraksha

# Copy built workspace and node_modules from builder
COPY --from=builder --chown=sheraksha:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=sheraksha:nodejs /app/packages ./packages
COPY --from=builder --chown=sheraksha:nodejs /app/package.json ./package.json

USER sheraksha

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

WORKDIR /app/packages/backend
CMD ["node", "dist/index.js"]
