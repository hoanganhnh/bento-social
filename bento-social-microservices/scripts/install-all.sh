#!/bin/bash

# Define colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Installing dependencies for all microservices...${NC}"

# Navigate to the project root (assuming this script is in ./scripts)
cd "$(dirname "$0")/.."

# Run pnpm install at the root level
# This will respect the pnpm-workspace.yaml and install dependencies for all packages/services
echo -e "${BLUE}Running pnpm install in workspace root...${NC}"

if command -v pnpm &> /dev/null; then
    pnpm install
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ All dependencies installed successfully!${NC}"
    else
        echo -e "${RED}❌ Failed to install dependencies.${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ pnpm is not installed. Please install pnpm first.${NC}"
    echo "npm install -g pnpm"
    exit 1
fi
