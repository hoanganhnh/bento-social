# 🚀 Bento Social - Service Management Scripts

Scripts để quản lý và khởi chạy tất cả microservices.

## 📋 Available Scripts

### 1. `start-all.sh` - Start All Services (Background)

Khởi chạy tất cả services trong background và lưu logs vào `logs/` directory.

```bash
./scripts/start-all.sh
# hoặc
pnpm start:all
```

**Features:**
- ✅ Tự động build shared package
- ✅ Start infrastructure (PostgreSQL, Redis, RabbitMQ)
- ✅ Start tất cả microservices trong background
- ✅ Health checks
- ✅ Lưu logs và PID files

**Logs:** `logs/<service-name>.log`  
**PID files:** `logs/<service-name>.pid`

---

### 2. `start-all-tmux.sh` - Start All Services in TMUX

Khởi chạy tất cả services trong tmux session với multiple panes/windows.

```bash
./scripts/start-all-tmux.sh
# hoặc
pnpm start:all:tmux
```

**Features:**
- ✅ Tạo tmux session `bento-services`
- ✅ Mỗi service chạy trong pane riêng
- ✅ Dễ dàng monitor và debug
- ✅ Window riêng cho Docker logs

**TMUX Commands:**
```bash
# Attach to session
tmux attach -t bento-services

# Detach (while in session)
Ctrl+B then D

# Switch windows
Ctrl+B then 0-3

# Switch panes
Ctrl+B then arrow keys

# Kill session
tmux kill-session -t bento-services
```

---

### 3. `start-all-detached.sh` - Start All Services (Detached)

Tương tự `start-all.sh` nhưng có option sử dụng tmux nếu available.

```bash
./scripts/start-all-detached.sh
# hoặc
pnpm start:all:bg
```

---

### 4. `stop-all.sh` - Stop All Services

Dừng tất cả running services.

```bash
./scripts/stop-all.sh
# hoặc
pnpm stop:all
```

**Features:**
- ✅ Stop services bằng PID files
- ✅ Fallback: stop bằng port
- ✅ Option để stop infrastructure

---

### 5. `view-logs.sh` - View Service Logs

Interactive menu để xem logs của các services.

```bash
./scripts/view-logs.sh
# hoặc
pnpm logs
```

**Options:**
- View logs của từng service
- View tất cả logs cùng lúc
- View Docker infrastructure logs

---

### 6. `generate-prisma.sh` - Generate Prisma Clients

Generate Prisma client cho tất cả services có Prisma schema hoặc một service cụ thể.

```bash
# Generate cho tất cả services
./scripts/generate-prisma.sh

# Generate cho một service cụ thể
./scripts/generate-prisma.sh post-service
```

**Features:**
- ✅ Tự động detect services có Prisma schema
- ✅ Generate Prisma client cho từng service
- ✅ Hiển thị progress và summary
- ✅ Hỗ trợ cả `pnpm` và `npx`

**Available Services:**
- auth-service
- user-service
- post-service
- topic-service
- comment-service
- interaction-service
- notification-service

**When to use:**
- Sau khi clone repository lần đầu
- Sau khi update Prisma schema
- Khi gặp lỗi TypeScript về Prisma types
- Trước khi build services

---

## 🎯 Quick Start

### Option 1: Background Mode (Recommended for Development)

```bash
# Start all services
pnpm start:all

# View logs
pnpm logs

# Stop all services
pnpm stop:all
```

### Option 2: TMUX Mode (Recommended for Monitoring)

```bash
# Start all services in tmux
pnpm start:all:tmux

# Services sẽ chạy trong tmux session
# Có thể switch giữa các panes để monitor
```

### Option 3: Manual (Individual Terminals)

```bash
# Terminal 1
pnpm dev:gateway

# Terminal 2
pnpm dev:auth

# Terminal 3
pnpm dev:user

# ... etc
```

---

## 📊 Service Ports

| Service | Port | Health Check |
|---------|------|--------------|
| API Gateway | 3000 | http://localhost:3000/health |
| Auth Service | 3001 | http://localhost:3001/health |
| User Service | 3002 | http://localhost:3002/health |
| Post Service | 3003 | http://localhost:3003/health |
| Topic Service | 3004 | http://localhost:3004/health |
| Comment Service | 3005 | http://localhost:3005/health |
| Notification Service | 3006 | http://localhost:3006/health |
| Upload Service | 3007 | http://localhost:3007/health |
| Interaction Service | 3008 | http://localhost:3008/health |

---

## 🔍 Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use stop script
pnpm stop:all
```

### Service Not Starting

```bash
# Check logs
tail -f logs/<service-name>.log

# Or use log viewer
pnpm logs
```

### Prisma Client Not Generated

```bash
# Generate Prisma clients for all services
./scripts/generate-prisma.sh

# Or for a specific service
./scripts/generate-prisma.sh post-service
```

**Note:** Cần generate Prisma client sau khi:
- Clone repository lần đầu
- Update Prisma schema
- Gặp TypeScript errors về Prisma types

### TMUX Session Issues

```bash
# List sessions
tmux ls

# Kill specific session
tmux kill-session -t bento-services

# Attach to existing session
tmux attach -t bento-services
```

### Infrastructure Not Ready

```bash
# Check Docker services
docker compose ps

# View Docker logs
docker compose logs -f postgres
docker compose logs -f redis
docker compose logs -f rabbitmq

# Restart infrastructure
docker compose restart postgres redis rabbitmq
```

---

## 📝 Notes

- Scripts tự động source nvm nếu available
- Scripts tự động build shared package trước khi start services
- Logs được lưu trong `logs/` directory
- PID files được lưu để dễ dàng stop services sau này
- Infrastructure services (PostgreSQL, Redis, RabbitMQ) được start bằng Docker Compose

---

**Happy Coding! 🚀**

