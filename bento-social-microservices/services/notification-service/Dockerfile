# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy shared package
COPY packages/shared ./packages/shared

# Copy service package
COPY services/notification-service ./services/notification-service

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared package
WORKDIR /app/packages/shared
RUN pnpm build

# Build service
WORKDIR /app/services/notification-service
RUN pnpm prisma:generate
RUN pnpm build

# Production stage
FROM node:20-alpine AS runner

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy built files
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/

COPY --from=builder /app/services/notification-service/dist ./services/notification-service/dist
COPY --from=builder /app/services/notification-service/package.json ./services/notification-service/
COPY --from=builder /app/services/notification-service/node_modules ./services/notification-service/node_modules

# Copy prisma files
COPY --from=builder /app/services/notification-service/prisma ./services/notification-service/prisma
COPY --from=builder /app/services/notification-service/node_modules/.prisma ./services/notification-service/node_modules/.prisma

WORKDIR /app/services/notification-service

EXPOSE 3006

CMD ["node", "dist/src/main.js"]

