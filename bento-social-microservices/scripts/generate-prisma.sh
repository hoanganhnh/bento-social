#!/bin/bash

# Script to generate Prisma client for all services or a specific service
# Usage:
#   ./scripts/generate-prisma.sh          # Generate for all services
#   ./scripts/generate-prisma.sh post-service  # Generate for specific service

# Don't exit on error, we want to continue with other services
set +e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source nvm if available
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
    nvm use default 2>/dev/null || true
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Services with Prisma schemas
SERVICES=(
    "auth-service"
    "user-service"
    "post-service"
    "topic-service"
    "comment-service"
    "interaction-service"
    "notification-service"
)

# Function to generate Prisma client for a service
generate_for_service() {
    local service=$1
    local service_path="$PROJECT_ROOT/services/$service"
    
    if [ ! -d "$service_path" ]; then
        echo -e "${RED}✗${NC} Service directory not found: $service_path"
        return 1
    fi
    
    if [ ! -f "$service_path/prisma/schema.prisma" ]; then
        echo -e "${YELLOW}⚠${NC} No Prisma schema found for $service, skipping..."
        return 0
    fi
    
    echo -e "${BLUE}→${NC} Generating Prisma client for ${GREEN}$service${NC}..."
    
    cd "$service_path" || {
        echo -e "${RED}✗${NC} Failed to change directory to $service_path"
        return 1
    }
    
    # Check if pnpm is available
    if command -v pnpm &> /dev/null; then
        if pnpm prisma:generate 2>&1; then
            echo -e "${GREEN}✓${NC} Successfully generated Prisma client for $service"
            cd "$PROJECT_ROOT" || true
            return 0
        else
            echo -e "${RED}✗${NC} Failed to generate Prisma client for $service"
            cd "$PROJECT_ROOT" || true
            return 1
        fi
    else
        # Fallback to npx
        if npx prisma generate 2>&1; then
            echo -e "${GREEN}✓${NC} Successfully generated Prisma client for $service"
            cd "$PROJECT_ROOT" || true
            return 0
        else
            echo -e "${RED}✗${NC} Failed to generate Prisma client for $service"
            cd "$PROJECT_ROOT" || true
            return 1
        fi
    fi
}

# Main execution
main() {
    cd "$PROJECT_ROOT"
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  Prisma Client Generation${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # If a specific service is provided as argument
    if [ $# -gt 0 ]; then
        local service=$1
        if [[ " ${SERVICES[@]} " =~ " ${service} " ]]; then
            generate_for_service "$service"
            exit $?
        else
            echo -e "${RED}Error:${NC} Unknown service: $service"
            echo -e "Available services: ${SERVICES[*]}"
            exit 1
        fi
    fi
    
    # Generate for all services
    local failed_services=()
    local success_count=0
    
    for service in "${SERVICES[@]}"; do
        if generate_for_service "$service"; then
            ((success_count++))
        else
            failed_services+=("$service")
        fi
        echo ""
    done
    
    # Summary
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  Summary${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "Successfully generated: ${GREEN}$success_count${NC}/${#SERVICES[@]} services"
    
    if [ ${#failed_services[@]} -gt 0 ]; then
        echo -e "Failed services: ${RED}${failed_services[*]}${NC}"
        exit 1
    else
        echo -e "${GREEN}All Prisma clients generated successfully!${NC}"
        exit 0
    fi
}

main "$@"

