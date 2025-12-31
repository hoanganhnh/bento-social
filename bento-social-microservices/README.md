# 🍱 Bento Social - Microservices Architecture

A social network backend built with NestJS microservices architecture, following best practices for scalability, reliability, and maintainability.

## 📁 Project Structure

```
bento-social-microservices/
├── packages/
│   └── shared/                 # Shared library (@bento/shared)
├── services/
│   ├── api-gateway/           # API Gateway (Port 3000)
│   ├── auth-service/          # Authentication (Port 3001, DB: auth_db)
│   ├── user-service/          # User management (Port 3002, DB: user_db)
│   ├── post-service/          # Posts (Port 3003, DB: post_db)
│   ├── topic-service/         # Topics (Port 3004, DB: topic_db)
│   ├── comment-service/       # Comments (Port 3005, DB: comment_db)
│   ├── notification-service/  # Notifications (Port 3006, DB: notification_db)
│   ├── upload-service/        # File uploads (Port 3007)
│   └── interaction-service/   # Likes, Saves, Follows (Port 3008, DB: interaction_db)
├── scripts/
│   └── init-databases.sh      # Multi-database initialization
├── docker-compose.yaml        # Full stack deployment
├── docker-compose.dev.yaml    # Development (infra only)
└── REFACTORING_ROADMAP.md     # Architecture refactoring plan
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

### Development Setup

1. **Clone and install dependencies**

   ```bash
   cd bento-social-microservices
   pnpm install
   ```

2. **Start infrastructure (PostgreSQL, Redis, RabbitMQ)**

   ```bash
   docker compose up -d postgres redis rabbitmq

   # Wait for databases to be created
   docker compose logs -f postgres
   ```

3. **Run Prisma migrations for each service**

   ```bash
   cd services/auth-service && npx prisma migrate dev --name init
   cd ../user-service && npx prisma migrate dev --name init
   # ... repeat for all services
   ```

4. **Build shared package**

   ```bash
   pnpm build:shared
   ```

5. **Start API Gateway**

   ```bash
   pnpm dev:gateway
   ```

6. **Start other services** (in separate terminals)
   ```bash
   pnpm dev:auth
   pnpm dev:user
   pnpm dev:post
   # ... etc
   ```

### Full Stack with Docker

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

## 🔌 Service Ports

| Service              | Port | Database        | Description           |
| -------------------- | ---- | --------------- | --------------------- |
| API Gateway          | 3000 | -               | Main entry point      |
| Auth Service         | 3001 | auth_db         | Authentication        |
| User Service         | 3002 | user_db         | User management       |
| Post Service         | 3003 | post_db         | Posts CRUD            |
| Topic Service        | 3004 | topic_db        | Topics management     |
| Comment Service      | 3005 | comment_db      | Comments              |
| Notification Service | 3006 | notification_db | Notifications         |
| Upload Service       | 3007 | -               | File uploads          |
| Interaction Service  | 3008 | interaction_db  | Likes, Saves, Follows |

### Infrastructure

| Service             | Port  | Credentials                         |
| ------------------- | ----- | ----------------------------------- |
| PostgreSQL          | 5432  | User: `bento`, Pass: `bento_secret` |
| Redis               | 6379  | Pass: `bento_redis`                 |
| RabbitMQ            | 5672  | User: `bento`, Pass: `bento_rabbit` |
| RabbitMQ Management | 15672 | User: `bento`, Pass: `bento_rabbit` |
| Adminer (DB UI)     | 8080  | -                                   |

## 🏗️ Architecture

### Current Architecture

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│    API Gateway      │
│    (NestJS)         │
└──────┬──────────────┘
       │
       ├──► Auth Service ──────► auth_db
       ├──► User Service ──────► user_db
       ├──► Post Service ──────► post_db
       ├──► Topic Service ─────► topic_db
       ├──► Comment Service ───► comment_db
       ├──► Notification ──────► notification_db
       ├──► Upload Service
       └──► Interaction ───────► interaction_db
              │
       ┌──────┴──────┐
       ▼             ▼
    Redis        RabbitMQ
   (Cache)      (Events)
```

### Key Improvements

✅ **Database-per-Service Pattern**

- Each microservice has its own isolated database
- No schema conflicts
- Independent scaling
- Fault isolation

✅ **RabbitMQ for Events**

- Durable message queues
- Guaranteed delivery
- Dead-letter queues
- No event loss

## 📦 Shared Package

The `@bento/shared` package contains:

- DTOs and data models
- Domain events
- Guards (Auth, Roles)
- RPC clients
- Utilities (AppError, Redis client)

## 🔄 Event-Driven Communication

Services communicate via RabbitMQ (replacing Redis Pub/Sub):

| Event              | Publisher           | Subscribers                        |
| ------------------ | ------------------- | ---------------------------------- |
| PostCreated        | Post Service        | Topic Service, User Service        |
| PostDeleted        | Post Service        | Topic Service, User Service        |
| PostLiked          | Interaction Service | Post Service, Notification Service |
| PostUnliked        | Interaction Service | Post Service                       |
| PostCommented      | Comment Service     | Post Service, Notification Service |
| PostCommentDeleted | Comment Service     | Post Service                       |
| Followed           | Interaction Service | User Service, Notification Service |

## 📝 Development

### Adding a new service

1. Create service directory in `services/`
2. Add database to `POSTGRES_MULTIPLE_DATABASES` in docker-compose.yaml
3. Create Prisma schema
4. Add service to `docker-compose.yaml`
5. Add routes to `api-gateway/src/config/services.config.ts`

### Running tests

```bash
pnpm test
```

### Database Management

```bash
# Access Adminer UI
open http://localhost:8080

# Connect to specific database
# Server: postgres
# Username: bento
# Password: bento_secret
# Database: auth_db (or user_db, post_db, etc.)
```

### RabbitMQ Management

```bash
# Access RabbitMQ Management UI
open http://localhost:15672

```

## 📄 License

MIT
