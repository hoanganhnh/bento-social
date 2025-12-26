#!/bin/bash

# Bento Social Microservices - Stop All Services Script
# This script stops all running microservices

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

# Function to stop service by PID file
stop_service_by_pid() {
    local service_name=$1
    local pid_file="$PROJECT_ROOT/logs/${service_name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            print_info "Stopping $service_name (PID: $pid)..."
            kill "$pid" 2>/dev/null || true
            sleep 1
            # Force kill if still running
            if ps -p "$pid" > /dev/null 2>&1; then
                kill -9 "$pid" 2>/dev/null || true
            fi
            rm -f "$pid_file"
            print_success "$service_name stopped"
        else
            print_warning "$service_name (PID: $pid) is not running"
            rm -f "$pid_file"
        fi
    else
        print_warning "$service_name PID file not found"
    fi
}

# Function to stop service by port
stop_service_by_port() {
    local service_name=$1
    local port=$2
    
    local pid=$(lsof -ti :"$port" 2>/dev/null || true)
    if [ -n "$pid" ]; then
        print_info "Stopping $service_name on port $port (PID: $pid)..."
        kill "$pid" 2>/dev/null || true
        sleep 1
        # Force kill if still running
        if lsof -ti :"$port" >/dev/null 2>&1; then
            kill -9 "$pid" 2>/dev/null || true
        fi
        print_success "$service_name stopped"
    else
        print_warning "$service_name on port $port is not running"
    fi
}

print_info "Stopping all microservices..."

# Stop services by PID files (preferred method)
stop_service_by_pid "api-gateway"
stop_service_by_pid "auth-service"
stop_service_by_pid "user-service"
stop_service_by_pid "post-service"
stop_service_by_pid "topic-service"
stop_service_by_pid "comment-service"
stop_service_by_pid "notification-service"
stop_service_by_pid "interaction-service"
stop_service_by_pid "upload-service"

# Also stop by port as fallback
stop_service_by_port "api-gateway" "3000"
stop_service_by_port "auth-service" "3001"
stop_service_by_port "user-service" "3002"
stop_service_by_port "post-service" "3003"
stop_service_by_port "topic-service" "3004"
stop_service_by_port "comment-service" "3005"
stop_service_by_port "notification-service" "3006"
stop_service_by_port "upload-service" "3007"
stop_service_by_port "interaction-service" "3008"

# Stop infrastructure (optional - comment out if you want to keep them running)
read -p "Do you want to stop infrastructure services (PostgreSQL, Redis, RabbitMQ)? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Stopping infrastructure services..."
    docker compose stop postgres redis rabbitmq || true
    print_success "Infrastructure services stopped"
else
    print_info "Keeping infrastructure services running"
fi

print_success "=========================================="
print_success "  All Services Stopped!"
print_success "=========================================="

