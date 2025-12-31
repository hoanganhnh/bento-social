# Build stage
FROM node:20-alpine AS builder

RUN npm i -g pnpm@9

WORKDIR /app

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared ./packages/shared
COPY services/post-service ./services/post-service

RUN pnpm install --frozen-lockfile

# Generate Prisma client
WORKDIR /app/services/post-service
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
COPY --from=builder /app/services/post-service/dist ./services/post-service/dist
COPY --from=builder /app/services/post-service/package.json ./services/post-service/
COPY --from=builder /app/services/post-service/node_modules ./services/post-service/node_modules
COPY --from=builder /app/node_modules ./node_modules

WORKDIR /app/services/post-service

ENV NODE_ENV=production
ENV PORT=3003

EXPOSE 3003

CMD ["node", "dist/main"]

