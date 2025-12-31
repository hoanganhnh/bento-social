# 🏗️ Bento Social Microservices - Architecture Review

## 📋 Tổng Quan

**Bento Social** là một hệ thống backend microservices được xây dựng với NestJS, tuân theo các best practices về scalability, reliability và maintainability. Dự án đang trong quá trình refactoring để cải thiện kiến trúc.

## 🏛️ Kiến Trúc Tổng Thể

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                             │
│                         (React)                             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTP/REST
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway                              │
│                  (Port 3000)                                │
│  • Rate Limiting                                            │
│  • Request Caching                                          │
│  • Security Headers (Helmet)                                │
│  • CORS Configuration                                       │
│  • Request Routing                                          │
└───────┬─────────────────────────────────────────────────────┘
        │
        ├─────────────────────────────────────────────────────┐
        │                                                     │
        ▼                                                     ▼
┌──────────────────┐                                  ┌──────────────────┐
│  Auth Service    │                                  │  User Service    │
│  Port: 3001      │                                  │  Port: 3002      │
│  DB: auth_db     │                                  │  DB: user_db     │
└──────────────────┘                                  └──────────────────┘
        │                                                     │
        ▼                                                     ▼
┌──────────────────┐                                  ┌──────────────────┐
│  Post Service    │                                  │ Topic Service    │
│  Port: 3003      │                                  │  Port: 3004      │
│  DB: post_db     │                                  │  DB: topic_db    │
└──────────────────┘                                  └──────────────────┘
        │                                                     │
        ▼                                                     ▼
┌──────────────────┐                                  ┌──────────────────┐
│ Comment Service  │                                  │Notification Svc  │
│  Port: 3005      │                                  │  Port: 3006      │
│  DB: comment_db  │                                  │  DB: notification│
└──────────────────┘                                  └──────────────────┘
        │                                                     │
        ▼                                                     ▼
┌──────────────────┐                                  ┌──────────────────┐
│ Upload Service   │                                  │Interaction Svc   │
│  Port: 3007      │                                  │  Port: 3008      │
│  (No DB)         │                                  │  DB: interaction │
└──────────────────┘                                  └──────────────────┘
        │                                                     │
        └──────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
┌──────────────────┐                  ┌──────────────────┐
│     Redis        │                  │    RabbitMQ      │
│   (Caching)      │                  │  (Event Bus)     │
│   Port: 6379     │                  │   Port: 5672     │
└──────────────────┘                  └──────────────────┘
        │                                     │
        └──────────────────┬──────────────────┘
                           │
                           ▼
                ┌──────────────────┐
                │   PostgreSQL     │
                │   Port: 5432     │
                │  (7 Databases)   │
                └──────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Observability Stack                            │
│  • Jaeger (Port 16686) - Distributed Tracing                │
│  • Prometheus (Port 9090) - Metrics Collection              │
│  • Grafana (Port 3030) - Dashboards                         │
└─────────────────────────────────────────────────────────────┘
```

### Microservices Overview

| Service                  | Port | Database        | Description                         | Dependencies                          |
| ------------------------ | ---- | --------------- | ----------------------------------- | ------------------------------------- |
| **API Gateway**          | 3000 | -               | Entry point, routing, rate limiting | All services                          |
| **Auth Service**         | 3001 | auth_db         | Authentication, JWT tokens          | Redis                                 |
| **User Service**         | 3002 | user_db         | User profiles, suggestions          | Redis, Auth                           |
| **Post Service**         | 3003 | post_db         | Posts CRUD                          | Redis, Auth, User, Topic, Interaction |
| **Topic Service**        | 3004 | topic_db        | Topics/categories                   | Redis, Auth                           |
| **Comment Service**      | 3005 | comment_db      | Comments on posts                   | Redis, RabbitMQ, Auth, User, Post     |
| **Notification Service** | 3006 | notification_db | User notifications                  | Redis, RabbitMQ, Auth, User, Post     |
| **Upload Service**       | 3007 | -               | File uploads (images)               | Auth                                  |
| **Interaction Service**  | 3008 | interaction_db  | Likes, Saves, Follows               | Redis, RabbitMQ, Auth, User, Post     |

### Infrastructure Services

| Service         | Port  | Purpose                | Credentials           |
| --------------- | ----- | ---------------------- | --------------------- |
| **PostgreSQL**  | 5432  | Database (7 databases) | bento / bento_secret  |
| **Redis**       | 6379  | Caching, Session Store | Password: bento_redis |
| **RabbitMQ**    | 5672  | Event Bus (AMQP)       | bento / bento_rabbit  |
| **RabbitMQ UI** | 15672 | Management Interface   | bento / bento_rabbit  |
| **Adminer**     | 8080  | Database Admin UI      | -                     |
| **Jaeger**      | 16686 | Tracing UI             | -                     |
| **Prometheus**  | 9090  | Metrics                | -                     |
| **Grafana**     | 3030  | Dashboards             | admin / admin         |

---

## 📦 Cấu Trúc Dự Án

```
bento-social-microservices/
├── packages/
│   └── shared/                    # Shared Library (@bento/shared)
│       ├── src/
│       │   ├── dto/              # Data Transfer Objects
│       │   ├── events/           # Domain Events
│       │   ├── guards/           # Auth & Role Guards
│       │   ├── rpc/              # RPC Clients (HTTP-based)
│       │   ├── grpc/             # gRPC Client Factory
│       │   ├── resilience/       # Circuit Breaker, Retry, Timeout, Bulkhead
│       │   ├── observability/    # Tracing, Metrics, Logging, Health
│       │   └── utils/            # Redis, RabbitMQ, AppError
│       └── dist/                 # Compiled output
│
├── services/
│   ├── api-gateway/              # API Gateway Service
│   │   ├── src/
│   │   │   ├── config/          # Proxy configuration
│   │   │   ├── middleware/       # Rate limit, Cache, Proxy
│   │   │   ├── proxy/           # Proxy controller
│   │   │   └── health/          # Health checks
│   │   └── Dockerfile
│   │
│   ├── auth-service/             # Authentication Service
│   ├── user-service/             # User Management Service
│   ├── post-service/            # Posts Service
│   ├── topic-service/           # Topics Service
│   ├── comment-service/         # Comments Service
│   ├── notification-service/    # Notifications Service
│   ├── upload-service/          # File Upload Service
│   └── interaction-service/     # Likes, Saves, Follows Service
│
├── observability/
│   ├── prometheus/
│   │   └── prometheus.yml       # Prometheus config
│   └── grafana/
│       └── provisioning/        # Grafana datasources & dashboards
│
├── scripts/
│   └── init-databases.sh        # Multi-database initialization
│
├── docs/                         # Documentation
├── docker-compose.yaml          # Full stack deployment
├── docker-compose.dev.yaml      # Development (infra only)
├── env.example                  # Environment variables template
└── package.json                 # Root package.json with scripts
```

---

## 🔑 Kiến Trúc Patterns Đã Triển Khai

### 1. Database-per-Service Pattern ✅

Mỗi microservice có database riêng:

- **auth_db**: Authentication data
- **user_db**: User profiles
- **post_db**: Posts
- **topic_db**: Topics/categories
- **comment_db**: Comments
- **notification_db**: Notifications
- **interaction_db**: Likes, saves, follows

**Lợi ích:**

- ✅ Schema isolation
- ✅ Independent scaling
- ✅ Fault isolation
- ✅ Technology diversity (có thể dùng DB khác nhau)

### 2. API Gateway Pattern ✅

**Features:**

- ✅ Request routing với `http-proxy-middleware`
- ✅ Rate limiting (express-rate-limit)
  - General: 100 req/min
  - Auth: 20 req/15min
  - Upload: 10 req/min
  - RPC: 500 req/min
- ✅ Response caching (in-memory với TTL)
- ✅ Security headers (Helmet)
- ✅ CORS configuration
- ✅ Request ID tracking

### 3. Resilience Patterns ✅

**Circuit Breaker** (Opossum):

- Tự động mở khi error rate > 50%
- Half-open state để test recovery
- Fallback functions

**Retry với Exponential Backoff**:

- Default: 3 retries
- Exponential backoff: 1s → 2s → 4s
- Không retry client errors (4xx)

**Timeout Handling**:

- Fast operations: 1s
- Standard API: 5s
- Database: 10s
- External API: 30s
- Uploads: 60s

**Bulkhead Pattern**:

- Giới hạn concurrent requests
- Queue management
- Reject khi queue đầy

### 4. Observability Stack ✅

**Distributed Tracing** (OpenTelemetry + Jaeger):

- Auto-instrumentation
- Trace context propagation
- Service map visualization

**Metrics** (Prometheus):

- HTTP request duration
- Request count by status
- Error rates
- Circuit breaker states
- Bulkhead metrics

**Logging**:

- Structured JSON logs
- Trace ID correlation
- Log levels (DEBUG, INFO, WARN, ERROR)

**Health Checks**:

- Liveness probes
- Readiness probes
- Service dependency checks

---

## 🚀 Cách Khởi Chạy

### Prerequisites

```bash
# Required
- Node.js 20+
- pnpm 9+
- Docker & Docker Compose
```

### Option 1: Development Mode (Recommended)

#### Bước 1: Setup Infrastructure

```bash
# Clone repository
git clone <repo-url>
cd bento-social-microservices

# Install dependencies
pnpm install

# Copy environment file
cp env.example .env

# Start infrastructure services
docker compose up -d postgres redis rabbitmq

# Wait for databases to be ready
docker compose logs -f postgres
# Look for: "database auth_db created"
```

#### Bước 2: Run Database Migrations

```bash
# For each service, run migrations
cd services/auth-service
npx prisma migrate dev --name init

cd ../user-service
npx prisma migrate dev --name init

cd ../post-service
npx prisma migrate dev --name init

cd ../topic-service
npx prisma migrate dev --name init

cd ../comment-service
npx prisma migrate dev --name init

cd ../notification-service
npx prisma migrate dev --name init

cd ../interaction-service
npx prisma migrate dev --name init
```

#### Bước 3: Build Shared Package

```bash
# From root directory
pnpm build:shared
```

#### Bước 4: Start Services

**Terminal 1 - API Gateway:**

```bash
pnpm dev:gateway
# Runs on http://localhost:3000
```

**Terminal 2 - Auth Service:**

```bash
pnpm dev:auth
# Runs on http://localhost:3001
```

**Terminal 3 - User Service:**

```bash
pnpm dev:user
# Runs on http://localhost:3002
```

**Terminal 4+ - Other Services:**

```bash
pnpm dev:post
pnpm dev:topic
pnpm dev:comment
pnpm dev:notification
pnpm dev:interaction
pnpm dev:upload
```

### Option 2: Docker Compose (Full Stack)

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f api-gateway

# Stop all services
docker compose down

# Stop and remove volumes (⚠️ deletes data)
docker compose down -v
```

### Option 3: Observability Stack (Optional)

```bash
# Start observability services
docker compose up -d jaeger prometheus grafana

# Access UIs:
# - Jaeger: http://localhost:16686
# - Prometheus: http://localhost:9090
# - Grafana: http://localhost:3030 (admin/admin)
```

---

## 🧪 Testing

### 1. Health Checks

```bash
# API Gateway health
curl http://localhost:3000/health

# Service health (direct)
curl http://localhost:3001/health
curl http://localhost:3002/health
# ... etc
```

### 2. API Testing qua Gateway

```bash
# Register user
curl -X POST http://localhost:3000/v1/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "username": "testuser"
  }'

# Authenticate
curl -X POST http://localhost:3000/v1/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Get user profile (with token)
curl http://localhost:3000/v1/users/1 \
  -H "Authorization: Bearer <token>"

# Get posts
curl http://localhost:3000/v1/posts

# Get topics
curl http://localhost:3000/v1/topics
```

### 3. Rate Limiting Test

```bash
# Make multiple requests quickly
for i in {1..110}; do
  curl -s http://localhost:3000/v1/authenticate \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}' \
    -w "\nStatus: %{http_code}\n"
done

# Should see 429 (Too Many Requests) after limit
```

### 4. File Upload Test

```bash
# Create test image
printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\xcf\xc0\xc0\xc0\xc0\x00\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82' > test.png

# Upload via gateway
curl -X POST http://localhost:3000/v1/upload-file \
  -F "file=@test.png" \
  -H "Authorization: Bearer <token>"
```

### 5. Load Testing

```bash
# Simple load test
for i in {1..100}; do
  curl -s -o /dev/null http://localhost:3000/health &
done
wait

# With timing
time (for i in {1..100}; do curl -s -o /dev/null http://localhost:3000/health & done; wait)
```

### 6. Circuit Breaker Test

```bash
# Stop a service to trigger circuit breaker
docker compose stop auth-service

# Make requests - should see circuit breaker open
curl http://localhost:3000/v1/authenticate

# Check logs for circuit breaker events
docker compose logs api-gateway | grep CircuitBreaker
```

### 7. Observability Testing

**Jaeger Tracing:**

```bash
# Make some API calls
curl http://localhost:3000/v1/posts

# Open Jaeger UI: http://localhost:16686
# Search for traces by service name
```

**Prometheus Metrics:**

```bash
# Query metrics
curl http://localhost:9090/api/v1/query?query=bento_http_requests_total

# Access Prometheus UI: http://localhost:9090
```

**Grafana Dashboards:**

```bash
# Access Grafana: http://localhost:3030
# Login: admin / admin
# View "Bento Social - Overview" dashboard
```

---

## 🔍 Monitoring & Debugging

### Database Access

```bash
# Via Adminer UI
open http://localhost:8080

# Connection details:
# Server: postgres
# Username: bento
# Password: bento_secret
# Database: auth_db (or user_db, post_db, etc.)
```

### RabbitMQ Management

```bash
# Access RabbitMQ UI
open http://localhost:15672

# Login: bento / bento_rabbit

# Check queues, exchanges, connections
```

### Redis Access

```bash
# Connect to Redis
docker exec -it bento-redis redis-cli -a bento_redis

# Test connection
PING
# Should return: PONG
```

### Service Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api-gateway
docker compose logs -f auth-service

# Last 100 lines
docker compose logs --tail=100 api-gateway

# Follow logs with timestamps
docker compose logs -f --timestamps api-gateway
```

---

## 🐛 Troubleshooting

### Common Issues

**1. Database Connection Errors**

```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Check database exists
docker exec -it bento-postgres psql -U bento -l

# Verify DATABASE_URL in .env
```

**2. Port Already in Use**

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yaml
```

**3. Prisma Migration Errors**

```bash
# Reset database (⚠️ deletes data)
npx prisma migrate reset

# Or manually fix migration
npx prisma migrate dev --name fix
```

**4. Service Not Starting**

```bash
# Check logs
docker compose logs <service-name>

# Check environment variables
docker compose config

# Verify dependencies are running
docker compose ps
```

**5. Rate Limiting Too Aggressive**

```bash
# Adjust in api-gateway/src/middleware/rate-limit.middleware.ts
# Or disable temporarily for testing
```

---

## 📊 Performance Metrics

### Current Performance

- **API Gateway Latency**: ~3-4ms average
- **100 Concurrent Requests**: ~0.9s
- **Throughput**: ~100-150 req/s (depends on endpoint)
- **Cache Hit Rate**: Varies by endpoint (topics: ~80%, posts: ~30%)

### Optimization Tips

1. **Enable Response Caching** for frequently accessed data
2. **Use Circuit Breakers** to prevent cascading failures
3. **Monitor Metrics** in Grafana
4. **Scale Services** horizontally based on load
5. **Use Redis** for session storage and caching

---

## 🔐 Security Features

### Implemented

- ✅ **Helmet** - Security headers (CSP, HSTS, X-Frame-Options)
- ✅ **Rate Limiting** - Prevent DDoS and abuse
- ✅ **CORS** - Configured allowed origins
- ✅ **JWT Authentication** - Token-based auth
- ✅ **Input Validation** - Zod schemas
- ✅ **SQL Injection Prevention** - Prisma ORM

### Best Practices

- Use environment variables for secrets
- Rotate JWT secrets regularly
- Enable HTTPS in production
- Implement API key authentication for internal services
- Regular security audits
