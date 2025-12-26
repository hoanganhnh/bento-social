# 🚀 Quick Start Guide

Hướng dẫn nhanh để khởi chạy và test Bento Social Microservices ở local.

## ⚡ Quick Start (5 phút)

### 1. Prerequisites

```bash
# Check versions
node --version  # Should be 20+
pnpm --version  # Should be 9+
docker --version
docker compose version
```

### 2. Setup

```bash
# Clone và install
git clone <repo-url>
cd bento-social-microservices
pnpm install

# Copy env file
cp env.example .env

# Build shared package
pnpm build:shared
```

### 3. Start Infrastructure

```bash
# Start PostgreSQL, Redis, RabbitMQ
docker compose up -d postgres redis rabbitmq

# Wait ~30 seconds for databases to initialize
docker compose logs -f postgres
# Look for: "database auth_db created" messages
```

### 4. Run Migrations (One-time)

```bash
# Run for each service (chọn 1 trong 2 cách)

# Cách 1: Manual (recommended cho lần đầu)
cd services/auth-service && npx prisma migrate dev --name init && cd ../..
cd services/user-service && npx prisma migrate dev --name init && cd ../..
cd services/post-service && npx prisma migrate dev --name init && cd ../..
cd services/topic-service && npx prisma migrate dev --name init && cd ../..
cd services/comment-service && npx prisma migrate dev --name init && cd ../..
cd services/notification-service && npx prisma migrate dev --name init && cd ../..
cd services/interaction-service && npx prisma migrate dev --name init && cd ../..

# Cách 2: Script (nếu có)
# ./scripts/migrate-all.sh
```

### 5. Start Services

**Option A: Development Mode (Recommended)**

Mở nhiều terminals:

```bash
# Terminal 1: API Gateway
pnpm dev:gateway

# Terminal 2: Auth Service
pnpm dev:auth

# Terminal 3: User Service
pnpm dev:user

# Terminal 4: Post Service
pnpm dev:post

# Terminal 5: Topic Service
pnpm dev:topic

# Terminal 6: Comment Service
pnpm dev:comment

# Terminal 7: Notification Service
pnpm dev:notification

# Terminal 8: Interaction Service
pnpm dev:interaction

# Terminal 9: Upload Service
pnpm dev:upload
```

**Option B: Docker Compose (All Services)**

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop all
docker compose down
```

### 6. Verify Services

```bash
# Health checks
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3002/health  # User Service
# ... etc
```

---

## 🧪 Quick Testing

### Test 1: Register & Login

```bash
# Register
curl -X POST http://localhost:3000/v1/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "username": "testuser"
  }'

# Login
curl -X POST http://localhost:3000/v1/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Save the token from response
TOKEN="<paste-token-here>"
```

### Test 2: Get User Profile

```bash
curl http://localhost:3000/v1/users/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Test 3: Create Post

```bash
curl -X POST http://localhost:3000/v1/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Post",
    "content": "Hello World!",
    "topicId": 1
  }'
```

### Test 4: Get Posts

```bash
curl http://localhost:3000/v1/posts \
  -H "Authorization: Bearer $TOKEN"
```

### Test 5: Rate Limiting

```bash
# Make 110 requests quickly
for i in {1..110}; do
  curl -s http://localhost:3000/v1/authenticate \
    -H "Content-Type: application/json" \
    -d '{"email":"test","password":"test"}' \
    -w "\nRequest $i: %{http_code}\n"
done

# Should see 429 (Too Many Requests) after 20 requests
```

---

## 🔍 Quick Debugging

### Check Service Status

```bash
# Docker services
docker compose ps

# Service logs
docker compose logs -f <service-name>

# All logs
docker compose logs -f
```

### Database Access

```bash
# Via Adminer UI
open http://localhost:8080

# Connection:
# Server: postgres
# Username: bento
# Password: bento_secret
# Database: auth_db (or user_db, post_db, etc.)
```

### RabbitMQ Management

```bash
# Access UI
open http://localhost:15672

# Login: bento / bento_rabbit
```

### Common Issues

**Port already in use:**

```bash
lsof -i :3000
kill -9 <PID>
```

**Database connection error:**

```bash
docker compose restart postgres
docker compose logs postgres
```

**Service not starting:**

```bash
docker compose logs <service-name>
# Check for errors in logs
```

---

## 📊 Observability (Optional)

### Start Observability Stack

```bash
docker compose up -d jaeger prometheus grafana
```

### Access UIs

- **Jaeger**: http://localhost:16686 (Tracing)
- **Prometheus**: http://localhost:9094 (Metrics)
- **Grafana**: http://localhost:3030 (Dashboards)
  - Login: `admin` / `admin`

### View Metrics

```bash
# Query Prometheus
curl "http://localhost:9094/api/v1/query?query=bento_http_requests_total"

# View traces in Jaeger UI after making API calls
```

---

## 📝 Useful Commands

```bash
# Build all
pnpm build

# Build shared package only
pnpm build:shared

# Start specific service
pnpm dev:gateway
pnpm dev:auth
# ... etc

# Docker commands
docker compose up -d              # Start all
docker compose down              # Stop all
docker compose restart <service> # Restart service
docker compose logs -f           # View logs
docker compose ps                # Check status

# Prisma commands (in service directory)
npx prisma migrate dev           # Run migrations
npx prisma studio                # Open Prisma Studio
npx prisma generate              # Generate Prisma Client
```

---

## 🎯 Next Steps

1. ✅ Services đang chạy → Test API endpoints
2. ✅ Đọc [ARCHITECTURE_REVIEW.md](./ARCHITECTURE_REVIEW.md) để hiểu kiến trúc
3. ✅ Xem [PROGRESS.md](../PROGRESS.md) để biết roadmap
4. ✅ Đọc [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) cho API reference

---

**Need Help?** Check [ARCHITECTURE_REVIEW.md](./ARCHITECTURE_REVIEW.md) for detailed troubleshooting.
