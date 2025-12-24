# 🍱 Bento Social - Microservices Architecture

A social network backend built with NestJS microservices architecture.

## 📁 Project Structure

```
bento-social-microservices/
├── packages/
│   └── shared/                 # Shared library (@bento/shared)
├── services/
│   ├── api-gateway/           # API Gateway (Port 3000)
│   ├── auth-service/          # Authentication (Port 3001)
│   ├── user-service/          # User management (Port 3002)
│   ├── post-service/          # Posts (Port 3003)
│   ├── topic-service/         # Topics (Port 3004)
│   ├── comment-service/       # Comments (Port 3005)
│   ├── notification-service/  # Notifications (Port 3006)
│   ├── upload-service/        # File uploads (Port 3007)
│   └── interaction-service/   # Likes, Saves, Follows (Port 3008)
├── docker-compose.yaml        # Full stack deployment
├── docker-compose.dev.yaml    # Development (infra only)
└── plan.md                    # Migration plan
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

2. **Start infrastructure (PostgreSQL, Redis)**
   ```bash
   docker-compose -f docker-compose.dev.yaml up -d
   ```

3. **Build shared package**
   ```bash
   pnpm build:shared
   ```

4. **Start API Gateway**
   ```bash
   pnpm dev:gateway
   ```

5. **Start other services** (in separate terminals)
   ```bash
   pnpm dev:auth
   pnpm dev:user
   pnpm dev:post
   # ... etc
   ```

### Full Stack with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## 🔌 Service Ports

| Service | Port | Description |
|---------|------|-------------|
| API Gateway | 3000 | Main entry point |
| Auth Service | 3001 | Authentication |
| User Service | 3002 | User management |
| Post Service | 3003 | Posts CRUD |
| Topic Service | 3004 | Topics management |
| Comment Service | 3005 | Comments |
| Notification Service | 3006 | Notifications |
| Upload Service | 3007 | File uploads |
| Interaction Service | 3008 | Likes, Saves, Follows |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Event Bus & Cache |
| Adminer | 8080 | Database UI |

## 📡 API Routes

All routes are proxied through the API Gateway at `http://localhost:3000/v1/*`

### Authentication
- `POST /v1/register` - Register new user
- `POST /v1/authenticate` - Login
- `GET /v1/profile` - Get current user profile

### Users
- `GET /v1/users/:id` - Get user by ID
- `GET /v1/users-suggested` - Get suggested users

### Posts
- `GET /v1/posts` - List posts
- `GET /v1/posts/:id` - Get post by ID
- `POST /v1/posts` - Create post
- `PATCH /v1/posts/:id` - Update post
- `DELETE /v1/posts/:id` - Delete post

### Topics
- `GET /v1/topics` - List topics
- `POST /v1/topics` - Create topic (Admin)

### Comments
- `GET /v1/posts/:id/comments` - List comments
- `POST /v1/posts/:id/comments` - Create comment

### Interactions
- `POST /v1/posts/:id/like` - Like post
- `DELETE /v1/posts/:id/unlike` - Unlike post
- `POST /v1/users/:id/follow` - Follow user
- `DELETE /v1/users/:id/unfollow` - Unfollow user

### Notifications
- `GET /v1/notifications` - List notifications
- `POST /v1/notifications/:id/read` - Mark as read

## 🏗️ Architecture

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
       ├──► Auth Service
       ├──► User Service
       ├──► Post Service
       ├──► Topic Service
       ├──► Comment Service
       ├──► Notification Service
       ├──► Upload Service
       └──► Interaction Service
              │
       ┌──────┴──────┐
       ▼             ▼
   PostgreSQL     Redis
                (Events)
```

## 📦 Shared Package

The `@bento/shared` package contains:
- DTOs and data models
- Domain events
- Guards (Auth, Roles)
- RPC clients
- Utilities (AppError, Redis client)

## 🔄 Event-Driven Communication

Services communicate via Redis Pub/Sub:

| Event | Publisher | Subscribers |
|-------|-----------|-------------|
| PostCreated | Post Service | Topic Service, User Service |
| PostLiked | Interaction Service | Post Service, Notification Service |
| Followed | Interaction Service | User Service, Notification Service |
| PostCommented | Comment Service | Post Service, Notification Service |

## 📝 Development

### Adding a new service

1. Create service directory in `services/`
2. Copy `Dockerfile.template` and modify
3. Add service to `docker-compose.yaml`
4. Add routes to `api-gateway/src/config/services.config.ts`

### Running tests

```bash
pnpm test
```

## 📄 License

MIT

