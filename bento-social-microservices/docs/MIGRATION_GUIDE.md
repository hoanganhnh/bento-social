# Database Migration Guide - Bento Social Microservices

## Overview

This guide explains the migration from a **Shared Database** architecture to **Database-per-Service** pattern, addressing the Shared Database antipattern.

## What Changed?

### Before (Shared Database Antipattern)

- All services connected to a single database: `bento_social`
- Schema conflicts and tight coupling between services
- Single point of failure
- Difficult to scale services independently

### After (Database-per-Service)

Each microservice now has its own isolated database:

| Service                | Database          | Tables                                  |
| ---------------------- | ----------------- | --------------------------------------- |
| `auth-service`         | `auth_db`         | `users` (auth info only)                |
| `user-service`         | `user_db`         | `users`, `followers`                    |
| `post-service`         | `post_db`         | `posts`                                 |
| `topic-service`        | `topic_db`        | `topics`                                |
| `comment-service`      | `comment_db`      | `comments`                              |
| `notification-service` | `notification_db` | `notifications`                         |
| `interaction-service`  | `interaction_db`  | `post_likes`, `post_saves`, `followers` |

## Infrastructure Changes

### 1. PostgreSQL Multi-Database Setup

- Added `scripts/init-databases.sh` to automatically create all databases on container startup
- Updated `docker-compose.yaml` to use `POSTGRES_MULTIPLE_DATABASES` environment variable

### 2. RabbitMQ for Event-Driven Communication

- **Replaced**: Redis Pub/Sub (fire-and-forget, unreliable)
- **With**: RabbitMQ (durable queues, guaranteed delivery)
- **Management UI**: http://localhost:15672 (user: `bento`, pass: `bento_rabbit`)

## Migration Steps

### Step 1: Backup Existing Data (If Production)

```bash
# Backup the old shared database
docker exec bento-postgres pg_dump -U bento bento_social > backup_bento_social.sql
```

### Step 2: Stop All Services

```bash
docker-compose down
```

### Step 3: Clean Volumes (Development Only - DESTROYS DATA)

```bash
docker-compose down -v
```

### Step 4: Start Infrastructure

```bash
# Start only database and message broker
docker-compose up -d postgres redis rabbitmq

# Wait for databases to be created (check logs)
docker-compose logs -f postgres
```

You should see:

```
Creating database 'auth_db'
Creating database 'user_db'
...
Multiple databases created successfully
```

### Step 5: Run Prisma Migrations for Each Service

```bash
# Auth Service
cd services/auth-service
npx prisma migrate dev --name init

# User Service
cd ../user-service
npx prisma migrate dev --name init

# Post Service
cd ../post-service
npx prisma migrate dev --name init

# Topic Service
cd ../topic-service
npx prisma migrate dev --name init

# Comment Service
cd ../comment-service
npx prisma migrate dev --name init

# Interaction Service
cd ../interaction-service
npx prisma migrate dev --name init

# Notification Service
cd ../notification-service
npx prisma migrate dev --name init
```

### Step 6: Start All Services

```bash
cd ../..
docker-compose up -d
```

### Step 7: Verify

```bash
# Check all services are healthy
docker-compose ps

# Check RabbitMQ Management UI
open http://localhost:15672

# Check databases via Adminer
open http://localhost:8080
```

## Data Migration (If Migrating from Existing Shared DB)

If you have existing data in the old `bento_social` database, you need to migrate it to the new databases:

### Option 1: Manual SQL Migration

```sql
-- Connect to postgres
psql -U bento -h localhost

-- Migrate users to auth_db
\c auth_db
INSERT INTO users SELECT * FROM bento_social.users;

-- Migrate users and followers to user_db
\c user_db
INSERT INTO users SELECT * FROM bento_social.users;
INSERT INTO followers SELECT * FROM bento_social.followers;

-- Migrate posts to post_db
\c post_db
INSERT INTO posts SELECT * FROM bento_social.posts;

-- ... and so on for other services
```

### Option 2: Custom Migration Script

Create a Node.js script that:

1. Connects to the old `bento_social` database
2. Reads all data
3. Distributes data to the appropriate new databases

## Troubleshooting

### Issue: "database does not exist"

**Solution**: Ensure the init script ran successfully. Check:

```bash
docker-compose logs postgres | grep "Creating database"
```

### Issue: Services can't connect to database

**Solution**: Verify DATABASE_URL in each service's environment:

```bash
docker-compose exec auth-service env | grep DATABASE_URL
# Should show: postgresql://bento:bento_secret@postgres:5432/auth_db
```

### Issue: RabbitMQ connection refused

**Solution**: Wait for RabbitMQ to fully start:

```bash
docker-compose logs rabbitmq
# Wait for "Server startup complete"
```

## Next Steps

After completing database isolation:

1. **Phase 2**: Replace custom HTTP RPC with gRPC or NestJS Microservices
2. **Phase 3**: Migrate from Redis Pub/Sub to RabbitMQ event patterns
3. **Phase 4**: Replace custom API Gateway with standard proxy middleware
4. **Phase 5**: Implement Circuit Breaker and Retry patterns

## Rollback Plan

If you need to rollback:

```bash
# Stop new setup
docker-compose down -v

# Restore from backup
docker-compose up -d postgres
docker exec -i bento-postgres psql -U bento -c "CREATE DATABASE bento_social;"
docker exec -i bento-postgres psql -U bento bento_social < backup_bento_social.sql

# Revert docker-compose.yaml to use shared database
git checkout docker-compose.yaml

# Restart services
docker-compose up -d
```

## References

- [Database per Service Pattern](https://microservices.io/patterns/data/database-per-service.html)
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [Prisma Multi-Schema](https://www.prisma.io/docs/guides/database/multi-schema)
