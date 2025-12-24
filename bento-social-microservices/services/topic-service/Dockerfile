# Build stage
FROM node:20-alpine AS builder

RUN npm i -g pnpm@9

WORKDIR /app

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared ./packages/shared
COPY services/topic-service ./services/topic-service

RUN pnpm install --frozen-lockfile

# Generate Prisma client
WORKDIR /app/services/topic-service
RUN pnpm prisma:generate
# Build
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

RUN npm i -g pnpm@9

WORKDIR /app

# Copy built files
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/services/topic-service/dist ./services/topic-service/dist
COPY --from=builder /app/services/topic-service/package.json ./services/topic-service/
COPY --from=builder /app/services/topic-service/node_modules ./services/topic-service/node_modules
COPY --from=builder /app/node_modules ./node_modules

WORKDIR /app/services/topic-service

ENV NODE_ENV=production
ENV PORT=3004

EXPOSE 3004

CMD ["node", "dist/main"]

