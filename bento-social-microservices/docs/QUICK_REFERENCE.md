# 🚀 Quick Reference - Bento Social Microservices

## 📦 Services & Databases

| Service              | Port | Database        | Purpose            |
| -------------------- | ---- | --------------- | ------------------ |
| api-gateway          | 3000 | -               | Entry point        |
| auth-service         | 3001 | auth_db         | Auth & tokens      |
| user-service         | 3002 | user_db         | Profiles & follows |
| post-service         | 3003 | post_db         | Posts              |
| topic-service        | 3004 | topic_db        | Topics             |
| comment-service      | 3005 | comment_db      | Comments           |
| notification-service | 3006 | notification_db | Notifications      |
| upload-service       | 3007 | -               | File uploads       |
| interaction-service  | 3008 | interaction_db  | Likes & saves      |

## 🔧 Infrastructure

| Service     | Port  | URL                    | Credentials          |
| ----------- | ----- | ---------------------- | -------------------- |
| PostgreSQL  | 5432  | -                      | bento / bento_secret |
| Redis       | 6379  | -                      | bento_redis          |
| RabbitMQ    | 5672  | -                      | bento / bento_rabbit |
| RabbitMQ UI | 15672 | http://localhost:15672 | bento / bento_rabbit |
| Adminer     | 8080  | http://localhost:8080  | -                    |

## 🐳 Docker Commands

```bash
# Start all services
docker compose up -d

# Start only infrastructure
docker compose up -d postgres redis rabbitmq

# View logs
docker compose logs -f [service-name]

# Restart a service
docker compose restart [service-name]

# Stop all
docker compose down

# Stop and remove volumes (⚠️ DESTROYS DATA)
docker compose down -v

# Check service status
docker compose ps

# Execute command in container
docker compose exec [service-name] [command]
```

## 🗄️ Database Commands

```bash
# List all databases
docker compose exec postgres psql -U bento -c "\l"

# Connect to specific database
docker compose exec postgres psql -U bento -d auth_db

# List tables in database
docker compose exec postgres psql -U bento -d auth_db -c "\dt"

# Run SQL query
docker compose exec postgres psql -U bento -d auth_db -c "SELECT * FROM users LIMIT 5;"

# Backup database
docker compose exec postgres pg_dump -U bento auth_db > backup_auth_db.sql

# Restore database
cat backup_auth_db.sql | docker compose exec -T postgres psql -U bento auth_db
```

## 🔄 Prisma Commands

```bash
# Generate Prisma client
cd services/[service-name]
npx prisma generate

# Create migration
npx prisma migrate dev --name [migration-name]

# Apply migrations
npx prisma migrate deploy

# Reset database (⚠️ DESTROYS DATA)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Format schema
npx prisma format
```

## 📦 pnpm Commands

```bash
# Install dependencies
pnpm install

# Build shared package
pnpm build:shared

# Watch shared package
pnpm build:shared --watch

# Run specific service
pnpm dev:gateway
pnpm dev:auth
pnpm dev:user
pnpm dev:post
# ... etc

# Run tests
pnpm test

# Lint
pnpm lint

# Format
pnpm format
```

## 🔍 Debugging

### Check Service Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f post-service

# Last 100 lines
docker compose logs --tail=100 post-service
```

### Check Database Connection

```bash
# From inside container
docker compose exec post-service env | grep DATABASE_URL

# Should output: postgresql://bento:bento_secret@postgres:5432/post_db
```

### Check RabbitMQ Queues

```bash
# Via Management UI
open http://localhost:15672

# Via CLI
docker compose exec rabbitmq rabbitmqctl list_queues
```

### Test API Endpoints

```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/v1/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123","firstName":"Test","lastName":"User"}'

# Login
curl -X POST http://localhost:3000/v1/authenticate \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

# Get profile (with token)
curl http://localhost:3000/v1/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🐛 Common Issues

### "database does not exist"

```bash
# Check if databases were created
docker compose logs postgres | grep "Creating database"

# Manually create database
docker compose exec postgres psql -U bento -c "CREATE DATABASE auth_db;"
```

### "Connection refused" to RabbitMQ

```bash
# Wait for RabbitMQ to start
docker compose logs rabbitmq | grep "Server startup complete"

# Restart RabbitMQ
docker compose restart rabbitmq
```

### "Permission denied" on init script

```bash
chmod +x scripts/init-databases.sh
```

### Service won't start

```bash
# Check logs
docker compose logs [service-name]

# Rebuild service
docker compose build [service-name]
docker compose up -d [service-name]
```

## 🔐 Environment Variables

### Required for All Services

```bash
NODE_ENV=development
PORT=[service-port]
DATABASE_URL=postgresql://bento:bento_secret@postgres:5432/[db-name]
REDIS_URL=redis://:bento_redis@redis:6379/0
```

### Required for Event-Driven Services

```bash
RABBITMQ_URL=amqp://bento:bento_rabbit@rabbitmq:5672
```

### Required for Auth Service

```bash
JWT_SECRET=your-secret-key
```

### Required for API Gateway

```bash
FRONTEND_URL=http://localhost:3001
AUTH_SERVICE_URL=http://auth-service:3001
USER_SERVICE_URL=http://user-service:3002
# ... etc
```

## 📊 Monitoring

### RabbitMQ Management

- URL: http://localhost:15672
- Check queues, exchanges, connections
- Monitor message rates

### Adminer (Database UI)

- URL: http://localhost:8080
- Server: postgres
- Username: bento
- Password: bento_secret
- Database: [select from dropdown]

### Docker Stats

```bash
# Real-time resource usage
docker stats

# Specific service
docker stats bento-post
```

## 🎯 Development Workflow

### 1. Start Infrastructure

```bash
docker compose up -d postgres redis rabbitmq
```

### 2. Run Migrations

```bash
cd services/auth-service && npx prisma migrate dev
cd ../user-service && npx prisma migrate dev
# ... for all services
```

### 3. Build Shared Package

```bash
pnpm build:shared
```

### 4. Start Services

```bash
# Terminal 1: API Gateway
pnpm dev:gateway

# Terminal 2: Auth Service
pnpm dev:auth

# Terminal 3: User Service
pnpm dev:user

# ... etc
```

### 5. Test

```bash
curl http://localhost:3000/health
```

---

**💡 Tip**: Bookmark this file for quick reference during development!
