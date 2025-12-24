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
COPY services/upload-service ./services/upload-service

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared package
WORKDIR /app/packages/shared
RUN pnpm build

# Build service
WORKDIR /app/services/upload-service
RUN pnpm build

# Production stage
FROM node:20-alpine AS runner

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy built files
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/

COPY --from=builder /app/services/upload-service/dist ./services/upload-service/dist
COPY --from=builder /app/services/upload-service/package.json ./services/upload-service/
COPY --from=builder /app/services/upload-service/node_modules ./services/upload-service/node_modules

# Create uploads directory
RUN mkdir -p /app/services/upload-service/uploads

WORKDIR /app/services/upload-service

EXPOSE 3007

CMD ["node", "dist/src/main.js"]

