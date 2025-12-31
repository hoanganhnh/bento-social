#!/bin/bash

# Bento Social Microservices - Start All Services Script
# This script starts all infrastructure and microservices

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

# Function to print colored messages
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    lsof -i :"$1" >/dev/null 2>&1
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1

    print_info "Waiting for $service_name to be ready..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done
    echo ""
    print_warning "$service_name did not become ready in time"
    return 1
}

# Check prerequisites
print_info "Checking prerequisites..."

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js 20+"
    exit 1
fi

if ! command_exists pnpm; then
    print_error "pnpm is not installed. Please install pnpm 9+"
    exit 1
fi

if ! command_exists docker; then
    print_error "Docker is not installed. Please install Docker"
    exit 1
fi

if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
    print_error "Docker Compose is not installed"
    exit 1
fi

print_success "All prerequisites are installed"

# Check if .env exists
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    print_warning ".env file not found. Copying from env.example..."
    cp "$PROJECT_ROOT/env.example" "$PROJECT_ROOT/.env"
    print_info "Please update .env file with your configuration"
fi

# Source nvm if available
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
    nvm use default >/dev/null 2>&1 || true
fi

# Build shared package first
print_info "Building shared package..."
cd "$PROJECT_ROOT"
pnpm build:shared || {
    print_error "Failed to build shared package"
    exit 1
}
print_success "Shared package built successfully"

# Start infrastructure services
print_info "Starting infrastructure services (PostgreSQL, Redis, RabbitMQ)..."
docker compose up -d postgres redis rabbitmq || {
    print_error "Failed to start infrastructure services"
    exit 1
}

# Wait for infrastructure to be ready
print_info "Waiting for infrastructure services to be ready..."
sleep 5

# Check PostgreSQL
if docker compose exec -T postgres pg_isready -U bento >/dev/null 2>&1; then
    print_success "PostgreSQL is ready"
else
    print_warning "PostgreSQL may not be ready yet"
fi

# Check Redis
if docker compose exec -T redis redis-cli -a bento_redis ping >/dev/null 2>&1; then
    print_success "Redis is ready"
else
    print_warning "Redis may not be ready yet"
fi

# Check RabbitMQ
if docker compose exec -T rabbitmq rabbitmq-diagnostics -q ping >/dev/null 2>&1; then
    print_success "RabbitMQ is ready"
else
    print_warning "RabbitMQ may not be ready yet"
fi

# Function to start a service
start_service() {
    local service_name=$1
    local port=$2
    local dev_command=$3

    if port_in_use "$port"; then
        print_warning "$service_name (port $port) is already running"
        return 0
    fi

    print_info "Starting $service_name on port $port..."
    
    # Create log directory if it doesn't exist
    mkdir -p "$PROJECT_ROOT/logs"
    
    # Start service in background and save PID
    cd "$PROJECT_ROOT"
    pnpm "$dev_command" > "$PROJECT_ROOT/logs/${service_name}.log" 2>&1 &
    local pid=$!
    echo $pid > "$PROJECT_ROOT/logs/${service_name}.pid"
    
    print_success "$service_name started (PID: $pid)"
    sleep 2
}

# Start all microservices
print_info "Starting microservices..."

start_service "api-gateway" "3000" "dev:gateway"
start_service "auth-service" "3001" "dev:auth"
start_service "user-service" "3002" "dev:user"
start_service "post-service" "3003" "dev:post"
start_service "topic-service" "3004" "dev:topic"
start_service "comment-service" "3005" "dev:comment"
start_service "notification-service" "3006" "dev:notification"
start_service "interaction-service" "3008" "dev:interaction"
start_service "upload-service" "3007" "dev:upload"

# Wait a bit for services to start
print_info "Waiting for services to initialize..."
sleep 5

# Check service health
print_info "Checking service health..."

check_service_health() {
    local service_name=$1
    local url=$2
    
    if curl -s "$url" >/dev/null 2>&1; then
        print_success "$service_name is healthy"
        return 0
    else
        print_warning "$service_name health check failed (may still be starting)"
        return 1
    fi
}

check_service_health "API Gateway" "http://localhost:3000/health"
check_service_health "Auth Service" "http://localhost:3001/health"
check_service_health "User Service" "http://localhost:3002/health"

# Print summary
echo ""
print_success "=========================================="
print_success "  All Services Started!"
print_success "=========================================="
echo ""
print_info "Service URLs:"
echo "  • API Gateway:      http://localhost:3000"
echo "  • Auth Service:     http://localhost:3001"
echo "  • User Service:     http://localhost:3002"
echo "  • Post Service:     http://localhost:3003"
echo "  • Topic Service:    http://localhost:3004"
echo "  • Comment Service: http://localhost:3005"
echo "  • Notification:     http://localhost:3006"
echo "  • Upload Service:   http://localhost:3007"
echo "  • Interaction:      http://localhost:3008"
echo ""
print_info "Infrastructure:"
echo "  • PostgreSQL:       localhost:5432"
echo "  • Redis:            localhost:6379"
echo "  • RabbitMQ:         localhost:5672"
echo "  • RabbitMQ UI:      http://localhost:15672"
echo "  • Adminer:          http://localhost:8080"
echo ""
print_info "Logs are saved in: $PROJECT_ROOT/logs/"
print_info "To stop all services, run: ./scripts/stop-all.sh"
echo ""
print_warning "Note: Services are running in background. Check logs for any errors."
echo ""

