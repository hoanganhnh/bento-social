#!/bin/bash

# Bento Social Microservices - View Logs Script
# This script helps view logs from running services

# Colors for output
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

LOG_DIR="$PROJECT_ROOT/logs"

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Function to show log menu
show_menu() {
    echo "Select a service to view logs:"
    echo "  1) API Gateway"
    echo "  2) Auth Service"
    echo "  3) User Service"
    echo "  4) Post Service"
    echo "  5) Topic Service"
    echo "  6) Comment Service"
    echo "  7) Notification Service"
    echo "  8) Interaction Service"
    echo "  9) Upload Service"
    echo "  10) All Services (tail -f)"
    echo "  11) Infrastructure (Docker)"
    echo "  0) Exit"
    echo ""
    read -p "Enter choice [0-11]: " choice
}

# Function to view log
view_log() {
    local service=$1
    local log_file="$LOG_DIR/${service}.log"
    
    if [ ! -f "$log_file" ]; then
        echo "Log file not found: $log_file"
        echo "Service may not be running or logs haven't been created yet."
        return 1
    fi
    
    echo "Viewing logs for $service (Press Ctrl+C to exit)..."
    echo "=========================================="
    tail -f "$log_file"
}

# Main menu loop
while true; do
    show_menu
    
    case $choice in
        1)
            view_log "api-gateway"
            ;;
        2)
            view_log "auth-service"
            ;;
        3)
            view_log "user-service"
            ;;
        4)
            view_log "post-service"
            ;;
        5)
            view_log "topic-service"
            ;;
        6)
            view_log "comment-service"
            ;;
        7)
            view_log "notification-service"
            ;;
        8)
            view_log "interaction-service"
            ;;
        9)
            view_log "upload-service"
            ;;
        10)
            print_info "Tailing all service logs (Press Ctrl+C to exit)..."
            tail -f "$LOG_DIR"/*.log
            ;;
        11)
            print_info "Viewing Docker infrastructure logs..."
            cd "$PROJECT_ROOT"
            docker compose logs -f
            ;;
        0)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo "Invalid choice. Please try again."
            ;;
    esac
    
    echo ""
done

