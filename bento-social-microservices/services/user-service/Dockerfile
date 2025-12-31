# Build stage
FROM node:20-alpine AS builder

RUN npm i -g pnpm@9

WORKDIR /app

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared ./packages/shared
COPY services/user-service ./services/user-service

RUN pnpm install --frozen-lockfile

# Generate Prisma client
WORKDIR /app/services/user-service
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
COPY --from=builder /app/services/user-service/dist ./services/user-service/dist
COPY --from=builder /app/services/user-service/package.json ./services/user-service/
COPY --from=builder /app/services/user-service/node_modules ./services/user-service/node_modules
COPY --from=builder /app/node_modules ./node_modules

WORKDIR /app/services/user-service

ENV NODE_ENV=production
ENV PORT=3002

EXPOSE 3002

CMD ["node", "dist/main"]

