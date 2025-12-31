# 🚀 KẾ HOẠCH CHUYỂN ĐỔI MICROSERVICES - BENTO SOCIAL

## 📋 TỔNG QUAN DỰ ÁN

| Thông tin | Chi tiết |
|-----------|----------|
| **Dự án** | Bento Social Backend |
| **Mục tiêu** | Chuyển đổi từ Monolith sang Microservices |
| **Ràng buộc** | Frontend không thay đổi (API contracts giữ nguyên) |
| **API Gateway** | NestJS Gateway |
| **Thời gian dự kiến** | 12 tuần |

---

## 📊 KIẾN TRÚC MỤC TIÊU

```
                                    ┌─────────────────┐
                                    │    Frontend     │
                                    │  (Không đổi)    │
                                    └────────┬────────┘
                                             │ HTTP /v1/*
                                             ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                         NestJS API GATEWAY                                  │
│                         (Port: 3000)                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Routes Proxy:                                                         │  │
│  │   /v1/register, /v1/authenticate, /v1/profile → Auth Service :3001   │  │
│  │   /v1/users/* → User Service :3002                                   │  │
│  │   /v1/posts/* → Post Service :3003                                   │  │
│  │   /v1/topics/* → Topic Service :3004                                 │  │
│  │   /v1/comments/* → Comment Service :3005                             │  │
│  │   /v1/notifications/* → Notification Service :3006                   │  │
│  │   /v1/uploads/* → Upload Service :3007                               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
           │           │           │           │           │
           ▼           ▼           ▼           ▼           ▼
      ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
      │  Auth   │ │  User   │ │  Post   │ │ Topic   │ │ Comment │
      │ :3001   │ │ :3002   │ │ :3003   │ │ :3004   │ │ :3005   │
      └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
           │           │           │           │           │
           └───────────┴───────────┴─────┬─────┴───────────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    │                                         │
                    ▼                                         ▼
           ┌────────────────┐                      ┌────────────────┐
           │     Redis      │                      │   PostgreSQL   │
           │  (Event Bus)   │                      │  (Shared DB)   │
           │    :6379       │                      │    :5432       │
           └────────────────┘                      └────────────────┘
```

---

## 📁 CẤU TRÚC THƯ MỤC CUỐI CÙNG

```
bento-social-microservices/
├── packages/
│   └── shared/                    # Shared library
│       ├── src/
│       │   ├── events/            # Domain events
│       │   ├── interfaces/        # Shared interfaces
│       │   ├── dto/               # Shared DTOs
│       │   ├── guards/            # Auth guards
│       │   ├── rpc/               # RPC clients
│       │   └── utils/             # Utilities
│       ├── package.json
│       └── tsconfig.json
│
├── services/
│   ├── api-gateway/               # NestJS Gateway (Port 3000)
│   ├── auth-service/              # Port 3001
│   ├── user-service/              # Port 3002
│   ├── post-service/              # Port 3003
│   ├── topic-service/             # Port 3004
│   ├── comment-service/           # Port 3005
│   ├── notification-service/      # Port 3006
│   ├── interaction-service/       # Port 3008 (like, save, follow)
│   └── upload-service/            # Port 3007
│
├── docker-compose.yaml
├── docker-compose.dev.yaml
├── package.json                   # Workspace root
├── pnpm-workspace.yaml
└── plan.md                        # This file
```

---

## 🎯 SERVICE PORTS ALLOCATION

| Service | Port | Description |
|---------|------|-------------|
| API Gateway | 3000 | Main entry point (Frontend connects here) |
| Auth Service | 3001 | Authentication & Authorization |
| User Service | 3002 | User management |
| Post Service | 3003 | Post CRUD operations |
| Topic Service | 3004 | Topic management |
| Comment Service | 3005 | Comments & Replies |
| Notification Service | 3006 | Notifications |
| Upload Service | 3007 | File uploads |
| Interaction Service | 3008 | Likes, Saves, Follows |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Event Bus & Cache |

---

# ✅ TASK LIST CHI TIẾT

## PHASE 1: INFRASTRUCTURE SETUP (Tuần 1-2)

### 1.1 Setup Workspace & Shared Package

- [ ] **TASK-1.1.1**: Khởi tạo monorepo workspace
  ```bash
  mkdir bento-social-microservices
  cd bento-social-microservices
  pnpm init
  ```
  - Tạo `pnpm-workspace.yaml`
  - Cấu hình workspace packages

- [ ] **TASK-1.1.2**: Tạo shared package structure
  ```
  packages/shared/
  ├── src/
  │   ├── index.ts
  │   ├── events/
  │   │   ├── index.ts
  │   │   ├── app-event.ts
  │   │   ├── post.event.ts
  │   │   └── follow.event.ts
  │   ├── interfaces/
  │   │   ├── index.ts
  │   │   ├── requester.interface.ts
  │   │   ├── rpc.interface.ts
  │   │   └── event-publisher.interface.ts
  │   ├── dto/
  │   │   ├── index.ts
  │   │   ├── paging.dto.ts
  │   │   └── response.dto.ts
  │   ├── guards/
  │   │   ├── index.ts
  │   │   ├── auth.guard.ts
  │   │   └── roles.guard.ts
  │   ├── rpc/
  │   │   ├── index.ts
  │   │   ├── base-rpc.client.ts
  │   │   ├── user-rpc.client.ts
  │   │   ├── post-rpc.client.ts
  │   │   └── topic-rpc.client.ts
  │   └── utils/
  │       ├── index.ts
  │       └── app-error.ts
  ├── package.json
  └── tsconfig.json
  ```

- [ ] **TASK-1.1.3**: Copy shared code từ monolith
  - Copy `src/share/event/*` → `packages/shared/src/events/`
  - Copy `src/share/interface.ts` → `packages/shared/src/interfaces/`
  - Copy `src/share/data-model.ts` → `packages/shared/src/dto/`
  - Copy `src/share/guard/*` → `packages/shared/src/guards/`
  - Copy `src/share/rpc/*` → `packages/shared/src/rpc/`
  - Copy `src/share/app-error.ts` → `packages/shared/src/utils/`

- [ ] **TASK-1.1.4**: Setup shared package build
  - Cấu hình `tsconfig.json` cho shared package
  - Thêm build script vào `package.json`
  - Test build shared package

### 1.2 Setup NestJS API Gateway

- [ ] **TASK-1.2.1**: Khởi tạo API Gateway service
  ```bash
  cd services
  nest new api-gateway --package-manager pnpm
  ```

- [ ] **TASK-1.2.2**: Install dependencies cho Gateway
  ```bash
  pnpm add @nestjs/axios axios http-proxy-middleware
  pnpm add @bento/shared   # Link to shared package
  ```

- [ ] **TASK-1.2.3**: Tạo Gateway Proxy Module
  ```typescript
  // services/api-gateway/src/proxy/proxy.module.ts
  @Module({
    imports: [HttpModule],
    providers: [ProxyService],
    controllers: [ProxyController],
  })
  export class ProxyModule {}
  ```

- [ ] **TASK-1.2.4**: Implement Proxy Controller
  ```typescript
  // services/api-gateway/src/proxy/proxy.controller.ts
  @Controller('v1')
  export class ProxyController {
    // Route definitions for each service
  }
  ```

- [ ] **TASK-1.2.5**: Tạo Service Registry Configuration
  ```typescript
  // services/api-gateway/src/config/services.config.ts
  export const SERVICES = {
    AUTH: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    USER: process.env.USER_SERVICE_URL || 'http://localhost:3002',
    POST: process.env.POST_SERVICE_URL || 'http://localhost:3003',
    TOPIC: process.env.TOPIC_SERVICE_URL || 'http://localhost:3004',
    COMMENT: process.env.COMMENT_SERVICE_URL || 'http://localhost:3005',
    NOTIFICATION: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006',
    UPLOAD: process.env.UPLOAD_SERVICE_URL || 'http://localhost:3007',
    INTERACTION: process.env.INTERACTION_SERVICE_URL || 'http://localhost:3008',
  };
  ```

- [ ] **TASK-1.2.6**: Implement Route Mappings
  ```typescript
  // Route mapping configuration
  const ROUTE_MAPPINGS = [
    // Auth Service
    { path: '/v1/register', service: 'AUTH', method: 'POST' },
    { path: '/v1/authenticate', service: 'AUTH', method: 'POST' },
    { path: '/v1/profile', service: 'AUTH', method: 'ALL' },
    { path: '/v1/rpc/introspect', service: 'AUTH', method: 'POST' },
    
    // User Service
    { path: '/v1/users/:id', service: 'USER', method: 'ALL' },
    { path: '/v1/users-suggested', service: 'USER', method: 'GET' },
    { path: '/v1/rpc/users/*', service: 'USER', method: 'ALL' },
    
    // Post Service
    { path: '/v1/posts', service: 'POST', method: 'ALL' },
    { path: '/v1/posts/:id', service: 'POST', method: 'ALL' },
    { path: '/v1/posts/rpc/*', service: 'POST', method: 'ALL' },
    
    // Topic Service
    { path: '/v1/topics', service: 'TOPIC', method: 'ALL' },
    { path: '/v1/topics/:id', service: 'TOPIC', method: 'ALL' },
    { path: '/v1/rpc/topics/*', service: 'TOPIC', method: 'ALL' },
    
    // Comment Service
    { path: '/v1/posts/:id/comments', service: 'COMMENT', method: 'ALL' },
    { path: '/v1/comments/*', service: 'COMMENT', method: 'ALL' },
    
    // Interaction Service (Like, Save, Follow)
    { path: '/v1/posts/:id/like', service: 'INTERACTION', method: 'ALL' },
    { path: '/v1/posts/:id/unlike', service: 'INTERACTION', method: 'ALL' },
    { path: '/v1/posts/:id/save', service: 'INTERACTION', method: 'ALL' },
    { path: '/v1/posts/:id/unsave', service: 'INTERACTION', method: 'ALL' },
    { path: '/v1/posts/:id/liked-users', service: 'INTERACTION', method: 'GET' },
    { path: '/v1/users/:id/follow', service: 'INTERACTION', method: 'ALL' },
    { path: '/v1/users/:id/unfollow', service: 'INTERACTION', method: 'ALL' },
    { path: '/v1/users/:id/followers', service: 'INTERACTION', method: 'GET' },
    { path: '/v1/users/:id/followings', service: 'INTERACTION', method: 'GET' },
    { path: '/v1/users/:id/has-followed', service: 'INTERACTION', method: 'GET' },
    { path: '/v1/rpc/has-liked', service: 'INTERACTION', method: 'POST' },
    { path: '/v1/rpc/list-post-ids-liked', service: 'INTERACTION', method: 'POST' },
    
    // Notification Service
    { path: '/v1/notifications', service: 'NOTIFICATION', method: 'ALL' },
    { path: '/v1/notifications/*', service: 'NOTIFICATION', method: 'ALL' },
    
    // Upload Service
    { path: '/v1/uploads', service: 'UPLOAD', method: 'ALL' },
  ];
  ```

- [ ] **TASK-1.2.7**: Implement Error Handling & Logging
  - Global exception filter
  - Request logging middleware
  - Response transformation

- [ ] **TASK-1.2.8**: Setup Health Check Endpoints
  ```typescript
  @Controller('health')
  export class HealthController {
    @Get()
    check() { return { status: 'ok' }; }
    
    @Get('services')
    async checkServices() {
      // Check all downstream services
    }
  }
  ```

### 1.3 Setup Docker Infrastructure

- [ ] **TASK-1.3.1**: Tạo base Dockerfile template
  ```dockerfile
  # Dockerfile.template
  FROM node:20-alpine
  WORKDIR /app
  COPY package*.json ./
  RUN pnpm install
  COPY . .
  RUN pnpm build
  CMD ["node", "dist/main.js"]
  ```

- [ ] **TASK-1.3.2**: Tạo docker-compose.yaml cho development
  ```yaml
  version: "3.8"
  services:
    postgres:
      image: postgres:15-alpine
      ports: ["5432:5432"]
      environment:
        POSTGRES_USER: bento
        POSTGRES_PASSWORD: bento_secret
        POSTGRES_DB: bento_social
      volumes:
        - postgres_data:/var/lib/postgresql/data
    
    redis:
      image: redis:7-alpine
      ports: ["6379:6379"]
      command: redis-server --requirepass bento_redis
      volumes:
        - redis_data:/data
    
    # Services will be added in later phases
    
  volumes:
    postgres_data:
    redis_data:
  ```

- [ ] **TASK-1.3.3**: Setup development environment variables
  ```env
  # .env.development
  NODE_ENV=development
  
  # Database
  DATABASE_URL=postgresql://bento:bento_secret@localhost:5432/bento_social
  
  # Redis
  REDIS_URL=redis://:bento_redis@localhost:6379/0
  
  # JWT
  JWT_SECRET=your-super-secret-key
  
  # Service URLs (for Gateway)
  AUTH_SERVICE_URL=http://localhost:3001
  USER_SERVICE_URL=http://localhost:3002
  POST_SERVICE_URL=http://localhost:3003
  TOPIC_SERVICE_URL=http://localhost:3004
  COMMENT_SERVICE_URL=http://localhost:3005
  NOTIFICATION_SERVICE_URL=http://localhost:3006
  UPLOAD_SERVICE_URL=http://localhost:3007
  INTERACTION_SERVICE_URL=http://localhost:3008
  ```

### 1.4 Testing Phase 1

- [ ] **TASK-1.4.1**: Test shared package build & import
- [ ] **TASK-1.4.2**: Test API Gateway khởi động
- [ ] **TASK-1.4.3**: Test proxy functionality (với monolith backend)
- [ ] **TASK-1.4.4**: Verify frontend vẫn hoạt động qua Gateway

---

## PHASE 2: AUTH SERVICE (Tuần 3)

### 2.1 Setup Auth Service

- [ ] **TASK-2.1.1**: Khởi tạo Auth Service
  ```bash
  cd services
  nest new auth-service --package-manager pnpm
  ```

- [ ] **TASK-2.1.2**: Install dependencies
  ```bash
  pnpm add @prisma/client bcrypt jsonwebtoken zod
  pnpm add -D prisma @types/bcrypt @types/jsonwebtoken
  pnpm add @bento/shared
  ```

- [ ] **TASK-2.1.3**: Setup Prisma schema (chỉ User model)
  ```prisma
  // services/auth-service/prisma/schema.prisma
  model User {
    id        String   @id @db.VarChar(36)
    username  String   @unique @db.VarChar(100)
    password  String   @db.VarChar(100)
    salt      String   @db.VarChar(50)
    role      UserRole @default(user)
    // ... other fields
  }
  ```

### 2.2 Implement Auth Controllers

- [ ] **TASK-2.2.1**: Implement Register endpoint
  ```typescript
  // POST /register
  @Post('register')
  async register(@Body() dto: UserRegistrationDTO) {
    const data = await this.authService.register(dto);
    return { data };
  }
  ```

- [ ] **TASK-2.2.2**: Implement Authenticate endpoint
  ```typescript
  // POST /authenticate
  @Post('authenticate')
  async authenticate(@Body() dto: UserLoginDTO) {
    const data = await this.authService.login(dto);
    return { data };
  }
  ```

- [ ] **TASK-2.2.3**: Implement Profile endpoint
  ```typescript
  // GET /profile
  @Get('profile')
  async profile(@Headers('authorization') auth: string) {
    const token = this.extractToken(auth);
    const user = await this.authService.getProfile(token);
    return { data: user };
  }
  
  // PATCH /profile
  @Patch('profile')
  @UseGuards(AuthGuard)
  async updateProfile(@Request() req, @Body() dto: UpdateProfileDTO) {
    await this.authService.updateProfile(req.user.sub, dto);
    return { data: true };
  }
  ```

- [ ] **TASK-2.2.4**: Implement Token Introspect RPC
  ```typescript
  // POST /rpc/introspect
  @Controller('rpc')
  export class AuthRpcController {
    @Post('introspect')
    async introspect(@Body() dto: { token: string }) {
      const result = await this.authService.introspectToken(dto.token);
      return { data: result };
    }
  }
  ```

### 2.3 Implement Auth Service Logic

- [ ] **TASK-2.3.1**: Copy & refactor user.service.ts từ monolith
  - `register()` method
  - `login()` method
  - `introspectToken()` method
  - `profile()` method

- [ ] **TASK-2.3.2**: Implement JWT token generation/verification

- [ ] **TASK-2.3.3**: Implement password hashing với bcrypt

### 2.4 Integration & Testing

- [ ] **TASK-2.4.1**: Tạo Dockerfile cho Auth Service
- [ ] **TASK-2.4.2**: Update docker-compose.yaml
- [ ] **TASK-2.4.3**: Update API Gateway routes cho Auth Service
- [ ] **TASK-2.4.4**: Test với Postman/curl
  - [ ] Test POST /v1/register
  - [ ] Test POST /v1/authenticate
  - [ ] Test GET /v1/profile
  - [ ] Test PATCH /v1/profile
  - [ ] Test POST /v1/rpc/introspect
- [ ] **TASK-2.4.5**: Test frontend login/register flow

---

## PHASE 3: USER SERVICE (Tuần 4)

### 3.1 Setup User Service

- [ ] **TASK-3.1.1**: Khởi tạo User Service
  ```bash
  nest new user-service --package-manager pnpm
  ```

- [ ] **TASK-3.1.2**: Install dependencies & link shared package

- [ ] **TASK-3.1.3**: Setup Prisma schema (User model)

### 3.2 Implement User Controllers

- [ ] **TASK-3.2.1**: Implement GET /users/:id
  ```typescript
  @Get(':id')
  async getUser(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    return { data: this.toPublicUser(user) };
  }
  ```

- [ ] **TASK-3.2.2**: Implement GET /users-suggested
  ```typescript
  @Get('users-suggested')
  @UseGuards(AuthGuard)
  async getSuggestedUsers(@Request() req) {
    const users = await this.userService.getSuggested(req.user.sub);
    return { data: users };
  }
  ```

- [ ] **TASK-3.2.3**: Implement PATCH /users/:id (Admin only)
  ```typescript
  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async updateUser(@Param('id') id: string, @Body() dto: UserUpdateDTO) {
    await this.userService.update(id, dto);
    return { data: true };
  }
  ```

- [ ] **TASK-3.2.4**: Implement DELETE /users/:id (Admin only)

- [ ] **TASK-3.2.5**: Implement RPC endpoints
  ```typescript
  @Controller('rpc/users')
  export class UserRpcController {
    @Get(':id')
    async getById(@Param('id') id: string) { }
    
    @Post('list-by-ids')
    async listByIds(@Body('ids') ids: string[]) { }
  }
  ```

### 3.3 Integration & Testing

- [ ] **TASK-3.3.1**: Tạo Dockerfile cho User Service
- [ ] **TASK-3.3.2**: Update docker-compose.yaml
- [ ] **TASK-3.3.3**: Update API Gateway routes
- [ ] **TASK-3.3.4**: Test tất cả User endpoints
- [ ] **TASK-3.3.5**: Test RPC calls từ các service khác

---

## PHASE 4: TOPIC SERVICE (Tuần 5)

### 4.1 Setup Topic Service

- [ ] **TASK-4.1.1**: Khởi tạo Topic Service
- [ ] **TASK-4.1.2**: Install dependencies & setup Prisma

### 4.2 Implement Topic Controllers

- [ ] **TASK-4.2.1**: Implement GET /topics (list)
- [ ] **TASK-4.2.2**: Implement POST /topics (Admin)
- [ ] **TASK-4.2.3**: Implement PATCH /topics/:id (Admin)
- [ ] **TASK-4.2.4**: Implement DELETE /topics/:id (Admin)
- [ ] **TASK-4.2.5**: Implement RPC endpoints
  ```typescript
  @Controller('rpc/topics')
  export class TopicRpcController {
    @Get(':id')
    async getById(@Param('id') id: string) { }
    
    @Post('list-by-ids')
    async listByIds(@Body('ids') ids: string[]) { }
  }
  ```

### 4.3 Event Handlers

- [ ] **TASK-4.3.1**: Subscribe to PostCreated event
  ```typescript
  // Tăng postCount khi có post mới
  async handlePostCreated(event: PostCreatedEvent) {
    await this.topicRepo.incrementPostCount(event.payload.topicId);
  }
  ```

- [ ] **TASK-4.3.2**: Subscribe to PostDeleted event
  ```typescript
  // Giảm postCount khi post bị xóa
  async handlePostDeleted(event: PostDeletedEvent) {
    await this.topicRepo.decrementPostCount(event.payload.topicId);
  }
  ```

### 4.4 Integration & Testing

- [ ] **TASK-4.4.1**: Tạo Dockerfile
- [ ] **TASK-4.4.2**: Update docker-compose.yaml
- [ ] **TASK-4.4.3**: Update API Gateway routes
- [ ] **TASK-4.4.4**: Test all Topic endpoints
- [ ] **TASK-4.4.5**: Test RPC calls
- [ ] **TASK-4.4.6**: Test event handlers

---

## PHASE 5: POST SERVICE (Tuần 6-7)

### 5.1 Setup Post Service

- [ ] **TASK-5.1.1**: Khởi tạo Post Service
- [ ] **TASK-5.1.2**: Install dependencies & setup Prisma
- [ ] **TASK-5.1.3**: Setup RPC clients cho Topic & User services

### 5.2 Implement Post Controllers

- [ ] **TASK-5.2.1**: Implement GET /posts (list with pagination)
  ```typescript
  @Get()
  @UseGuards(OptionalAuthGuard)
  async listPosts(@Query() query: PostQueryDTO, @Request() req) {
    const posts = await this.postService.list(query);
    
    // Aggregation: fetch topics, authors, like/save status
    const enrichedPosts = await this.enrichPosts(posts, req.user?.sub);
    
    return paginatedResponse(enrichedPosts, query);
  }
  ```

- [ ] **TASK-5.2.2**: Implement GET /posts/:id
  ```typescript
  @Get(':id')
  @UseGuards(OptionalAuthGuard)
  async getPost(@Param('id') id: string, @Request() req) {
    const post = await this.postService.findById(id);
    const enrichedPost = await this.enrichPost(post, req.user?.sub);
    return { data: enrichedPost };
  }
  ```

- [ ] **TASK-5.2.3**: Implement POST /posts
  ```typescript
  @Post()
  @UseGuards(AuthGuard)
  async createPost(@Body() dto: CreatePostDTO, @Request() req) {
    const postId = await this.postService.create({
      ...dto,
      authorId: req.user.sub,
    });
    return { data: postId };
  }
  ```

- [ ] **TASK-5.2.4**: Implement PATCH /posts/:id
- [ ] **TASK-5.2.5**: Implement DELETE /posts/:id

- [ ] **TASK-5.2.6**: Implement RPC endpoints
  ```typescript
  @Controller('posts/rpc/posts')
  export class PostRpcController {
    @Get(':id')
    async getById(@Param('id') id: string) { }
    
    @Post('list-by-ids')
    async listByIds(@Body() dto: { ids: string[] }) { }
  }
  ```

### 5.3 Post Service Logic

- [ ] **TASK-5.3.1**: Implement create post với validation
  - Verify topic exists (via Topic RPC)
  - Verify author exists (via User RPC)

- [ ] **TASK-5.3.2**: Implement data enrichment
  ```typescript
  async enrichPosts(posts: Post[], userId?: string) {
    const topicIds = [...new Set(posts.map(p => p.topicId))];
    const authorIds = [...new Set(posts.map(p => p.authorId))];
    const postIds = posts.map(p => p.id);
    
    const [topics, authors, likedIds, savedIds] = await Promise.all([
      this.topicRpc.findByIds(topicIds),
      this.userRpc.findByIds(authorIds),
      userId ? this.interactionRpc.getPostIdsLiked(userId, postIds) : [],
      userId ? this.interactionRpc.getPostIdsSaved(userId, postIds) : [],
    ]);
    
    // Map and return enriched posts
  }
  ```

### 5.4 Event Publishing

- [ ] **TASK-5.4.1**: Publish PostCreated event
  ```typescript
  async create(dto: CreatePostDTO) {
    const post = await this.postRepo.insert(dto);
    
    await this.eventPublisher.publish(
      PostCreatedEvent.create({ postId: post.id, topicId: post.topicId }, dto.authorId)
    );
    
    return post.id;
  }
  ```

- [ ] **TASK-5.4.2**: Publish PostDeleted event

### 5.5 Event Handlers

- [ ] **TASK-5.5.1**: Subscribe to PostLiked/PostUnliked events
  ```typescript
  async handlePostLiked(event: PostLikedEvent) {
    await this.postRepo.incrementLikeCount(event.payload.postId);
  }
  ```

- [ ] **TASK-5.5.2**: Subscribe to PostCommented/PostCommentDeleted events
  ```typescript
  async handlePostCommented(event: PostCommentedEvent) {
    await this.postRepo.incrementCommentCount(event.payload.postId);
  }
  ```

### 5.6 Integration & Testing

- [ ] **TASK-5.6.1**: Tạo Dockerfile
- [ ] **TASK-5.6.2**: Update docker-compose.yaml
- [ ] **TASK-5.6.3**: Update API Gateway routes
- [ ] **TASK-5.6.4**: Test CRUD operations
- [ ] **TASK-5.6.5**: Test data enrichment
- [ ] **TASK-5.6.6**: Test event publishing
- [ ] **TASK-5.6.7**: Test event handlers
- [ ] **TASK-5.6.8**: Test với frontend (post list, create, edit, delete)

---

## PHASE 6: INTERACTION SERVICE (Tuần 8-9)

### 6.1 Setup Interaction Service

- [ ] **TASK-6.1.1**: Khởi tạo Interaction Service
- [ ] **TASK-6.1.2**: Install dependencies
- [ ] **TASK-6.1.3**: Setup Prisma schema
  ```prisma
  model PostLike {
    postId    String   @db.VarChar(36)
    userId    String   @db.VarChar(36)
    createdAt DateTime
    @@id([postId, userId])
  }
  
  model PostSave {
    postId    String   @db.VarChar(36)
    userId    String   @db.VarChar(36)
    createdAt DateTime
    @@id([postId, userId])
  }
  
  model Follower {
    followerId  String   @db.VarChar(36)
    followingId String   @db.VarChar(36)
    createdAt   DateTime
    @@id([followingId, followerId])
  }
  ```

### 6.2 Implement Post Like Controllers

- [ ] **TASK-6.2.1**: Implement POST /posts/:id/like
- [ ] **TASK-6.2.2**: Implement DELETE /posts/:id/unlike
- [ ] **TASK-6.2.3**: Implement GET /posts/:id/liked-users

### 6.3 Implement Post Save Controllers

- [ ] **TASK-6.3.1**: Implement POST /posts/:id/save
- [ ] **TASK-6.3.2**: Implement DELETE /posts/:id/unsave
- [ ] **TASK-6.3.3**: Implement GET /posts/:id/saved (if needed)

### 6.4 Implement Following Controllers

- [ ] **TASK-6.4.1**: Implement POST /users/:id/follow
- [ ] **TASK-6.4.2**: Implement DELETE /users/:id/unfollow
- [ ] **TASK-6.4.3**: Implement GET /users/:id/has-followed
- [ ] **TASK-6.4.4**: Implement GET /users/:id/followers
- [ ] **TASK-6.4.5**: Implement GET /users/:id/followings

### 6.5 Implement RPC Endpoints

- [ ] **TASK-6.5.1**: POST /rpc/has-liked
- [ ] **TASK-6.5.2**: POST /rpc/list-post-ids-liked
- [ ] **TASK-6.5.3**: POST /rpc/has-saved
- [ ] **TASK-6.5.4**: POST /rpc/list-post-ids-saved

### 6.6 Event Publishing

- [ ] **TASK-6.6.1**: Publish PostLiked event
- [ ] **TASK-6.6.2**: Publish PostUnliked event
- [ ] **TASK-6.6.3**: Publish Followed event
- [ ] **TASK-6.6.4**: Publish Unfollowed event

### 6.7 Event Handlers

- [ ] **TASK-6.7.1**: Subscribe Followed event (update User followerCount)

### 6.8 Integration & Testing

- [ ] **TASK-6.8.1**: Tạo Dockerfile
- [ ] **TASK-6.8.2**: Update docker-compose.yaml
- [ ] **TASK-6.8.3**: Update API Gateway routes
- [ ] **TASK-6.8.4**: Test all Like endpoints
- [ ] **TASK-6.8.5**: Test all Save endpoints
- [ ] **TASK-6.8.6**: Test all Follow endpoints
- [ ] **TASK-6.8.7**: Test RPC endpoints
- [ ] **TASK-6.8.8**: Test event publishing
- [ ] **TASK-6.8.9**: Test với frontend

---

## PHASE 7: COMMENT SERVICE (Tuần 10)

### 7.1 Setup Comment Service

- [ ] **TASK-7.1.1**: Khởi tạo Comment Service
- [ ] **TASK-7.1.2**: Install dependencies
- [ ] **TASK-7.1.3**: Setup Prisma schema (Comment, CommentLike)

### 7.2 Implement Comment Controllers

- [ ] **TASK-7.2.1**: Implement GET /posts/:postId/comments
- [ ] **TASK-7.2.2**: Implement POST /posts/:postId/comments
- [ ] **TASK-7.2.3**: Implement GET /comments/:id/replies
- [ ] **TASK-7.2.4**: Implement PATCH /comments/:id
- [ ] **TASK-7.2.5**: Implement DELETE /comments/:id

### 7.3 Comment Service Logic

- [ ] **TASK-7.3.1**: Implement comment creation với user enrichment
- [ ] **TASK-7.3.2**: Implement reply logic (parentId handling)

### 7.4 Event Publishing

- [ ] **TASK-7.4.1**: Publish PostCommented event
- [ ] **TASK-7.4.2**: Publish PostCommentDeleted event

### 7.5 Integration & Testing

- [ ] **TASK-7.5.1**: Tạo Dockerfile
- [ ] **TASK-7.5.2**: Update docker-compose.yaml
- [ ] **TASK-7.5.3**: Update API Gateway routes
- [ ] **TASK-7.5.4**: Test all Comment endpoints
- [ ] **TASK-7.5.5**: Test event publishing
- [ ] **TASK-7.5.6**: Test với frontend

---

## PHASE 8: NOTIFICATION SERVICE (Tuần 11)

### 8.1 Setup Notification Service

- [ ] **TASK-8.1.1**: Khởi tạo Notification Service
- [ ] **TASK-8.1.2**: Install dependencies
- [ ] **TASK-8.1.3**: Setup Prisma schema (Notification)
- [ ] **TASK-8.1.4**: Setup RPC clients (User, Post)

### 8.2 Implement Notification Controllers

- [ ] **TASK-8.2.1**: Implement GET /notifications
- [ ] **TASK-8.2.2**: Implement POST /notifications/:id/read
- [ ] **TASK-8.2.3**: Implement POST /notifications/read-all

### 8.3 Event Handlers (Core Logic)

- [ ] **TASK-8.3.1**: Subscribe to PostLiked event
  ```typescript
  async handlePostLiked(event: PostLikedEvent) {
    const post = await this.postRpc.findById(event.payload.postId);
    const actor = await this.userRpc.findById(event.senderId);
    
    if (event.senderId === post.authorId) return; // Don't notify self
    
    await this.notificationService.create({
      receiverId: post.authorId,
      actorId: event.senderId,
      content: `${actor.firstName} ${actor.lastName} liked your post`,
      action: 'liked',
    });
  }
  ```

- [ ] **TASK-8.3.2**: Subscribe to Followed event
  ```typescript
  async handleFollowed(event: FollowedEvent) {
    const actor = await this.userRpc.findById(event.senderId);
    
    await this.notificationService.create({
      receiverId: event.payload.followingId,
      actorId: event.senderId,
      content: `${actor.firstName} ${actor.lastName} followed you`,
      action: 'followed',
    });
  }
  ```

- [ ] **TASK-8.3.3**: Subscribe to PostCommented event
  ```typescript
  async handlePostCommented(event: PostCommentedEvent) {
    // Notify author of parent comment (for replies)
    if (!event.payload.authorIdOfParentComment) return;
    
    const actor = await this.userRpc.findById(event.senderId);
    
    await this.notificationService.create({
      receiverId: event.payload.authorIdOfParentComment,
      actorId: event.senderId,
      content: `${actor.firstName} ${actor.lastName} replied to your comment`,
      action: 'replied',
    });
  }
  ```

### 8.4 Integration & Testing

- [ ] **TASK-8.4.1**: Tạo Dockerfile
- [ ] **TASK-8.4.2**: Update docker-compose.yaml
- [ ] **TASK-8.4.3**: Update API Gateway routes
- [ ] **TASK-8.4.4**: Test notification list endpoint
- [ ] **TASK-8.4.5**: Test mark as read endpoints
- [ ] **TASK-8.4.6**: Test event handlers (trigger events and verify notifications)
- [ ] **TASK-8.4.7**: Test với frontend

---

## PHASE 9: UPLOAD SERVICE & FINAL TESTING (Tuần 12)

### 9.1 Setup Upload Service

- [ ] **TASK-9.1.1**: Khởi tạo Upload Service
- [ ] **TASK-9.1.2**: Implement POST /uploads (multipart file upload)
- [ ] **TASK-9.1.3**: Configure static file serving

### 9.2 Final Integration

- [ ] **TASK-9.2.1**: Update docker-compose.yaml với tất cả services
- [ ] **TASK-9.2.2**: Final API Gateway configuration
- [ ] **TASK-9.2.3**: Setup production environment variables

### 9.3 End-to-End Testing

- [ ] **TASK-9.3.1**: Test complete user flow
  - [ ] Register → Login → Get Profile
  - [ ] Create Post → List Posts → Update Post → Delete Post
  - [ ] Like/Unlike Post
  - [ ] Save/Unsave Post
  - [ ] Follow/Unfollow User
  - [ ] Create Comment → Reply → Delete Comment
  - [ ] View Notifications → Mark as Read

- [ ] **TASK-9.3.2**: Test với Frontend
  - [ ] Tất cả pages hoạt động bình thường
  - [ ] Không có breaking changes
  - [ ] Performance acceptable

### 9.4 Documentation

- [ ] **TASK-9.4.1**: Update README cho mỗi service
- [ ] **TASK-9.4.2**: Document API Gateway routes
- [ ] **TASK-9.4.3**: Document event flows
- [ ] **TASK-9.4.4**: Document deployment process

### 9.5 Cleanup

- [ ] **TASK-9.5.1**: Remove monolith code (sau khi microservices stable)
- [ ] **TASK-9.5.2**: Cleanup unused dependencies
- [ ] **TASK-9.5.3**: Final code review

---

## 📊 SERVICE COMMUNICATION MATRIX

### Synchronous (HTTP/RPC)

| Caller Service | Target Service | RPC Endpoints Used |
|----------------|----------------|-------------------|
| Post Service | Topic Service | `GET /rpc/topics/:id`, `POST /rpc/topics/list-by-ids` |
| Post Service | User Service | `GET /rpc/users/:id`, `POST /rpc/users/list-by-ids` |
| Post Service | Interaction Service | `POST /rpc/list-post-ids-liked`, `POST /rpc/list-post-ids-saved` |
| Comment Service | User Service | `GET /rpc/users/:id`, `POST /rpc/users/list-by-ids` |
| Comment Service | Post Service | `GET /posts/rpc/posts/:id` |
| Interaction Service | User Service | `POST /rpc/users/list-by-ids` |
| Notification Service | User Service | `GET /rpc/users/:id` |
| Notification Service | Post Service | `GET /posts/rpc/posts/:id` |
| API Gateway | Auth Service | `POST /rpc/introspect` |

### Asynchronous (Redis Events)

| Publisher | Event | Subscribers |
|-----------|-------|-------------|
| Post Service | PostCreated | Topic Service, User Service |
| Post Service | PostDeleted | Topic Service, User Service |
| Interaction Service | PostLiked | Post Service, Notification Service |
| Interaction Service | PostUnliked | Post Service |
| Interaction Service | Followed | User Service, Notification Service |
| Interaction Service | Unfollowed | User Service |
| Comment Service | PostCommented | Post Service, Notification Service |
| Comment Service | PostCommentDeleted | Post Service |

---

## ⏰ TIMELINE SUMMARY

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1: Infrastructure | Week 1-2 | API Gateway, Shared Package, Docker setup |
| Phase 2: Auth Service | Week 3 | Authentication endpoints |
| Phase 3: User Service | Week 4 | User management endpoints |
| Phase 4: Topic Service | Week 5 | Topic CRUD, event handlers |
| Phase 5: Post Service | Week 6-7 | Post CRUD, data aggregation |
| Phase 6: Interaction Service | Week 8-9 | Like, Save, Follow features |
| Phase 7: Comment Service | Week 10 | Comments & Replies |
| Phase 8: Notification Service | Week 11 | Notifications, event consumers |
| Phase 9: Final Integration | Week 12 | Upload, E2E testing, Documentation |

---

## 🔴 RISK MITIGATION

| Risk | Mitigation Strategy |
|------|---------------------|
| Data inconsistency | Use transactions where possible, eventual consistency for events |
| Service unavailability | Implement circuit breaker pattern, retry logic |
| Network latency | Cache frequently accessed data, batch RPC calls |
| Event processing failures | Implement dead letter queue, event replay mechanism |
| Database migration issues | Use shared database initially, migrate gradually |

---

## ✅ DEFINITION OF DONE

Mỗi Phase được coi là hoàn thành khi:

1. ✅ Tất cả tasks trong phase đã hoàn thành
2. ✅ Service chạy được trong Docker
3. ✅ API Gateway routes đã được cập nhật
4. ✅ Tất cả endpoints đã được test
5. ✅ Event handlers hoạt động đúng
6. ✅ Frontend hoạt động bình thường (không breaking changes)
7. ✅ Code đã được review
8. ✅ Documentation đã được cập nhật
