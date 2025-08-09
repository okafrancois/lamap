# syntax=docker/dockerfile:1.7-labs

FROM node:20-alpine AS base
ENV NODE_ENV=production
WORKDIR /app

FROM base AS deps
# Required for prisma binary and tools
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json* bun.lock* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --include=dev

FROM deps AS builder
COPY . .
ENV SKIP_ENV_VALIDATION=1
RUN npx prisma generate
RUN npm run build

FROM base AS runner
RUN apk add --no-cache openssl
ENV NODE_ENV=production
WORKDIR /app

# Copy only the standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Prisma needs migrations at runtime for deploy (optional)
ENV PORT=3000
EXPOSE 3000

CMD node server.js


