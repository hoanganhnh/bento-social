#!/bin/bash
set -e

echo "🔄 Running Prisma migrations for all services..."
echo ""

SERVICES=(
  "auth-service"
  "user-service"
  "post-service"
  "topic-service"
  "comment-service"
  "notification-service"
  "interaction-service"
)

for service in "${SERVICES[@]}"; do
  echo "📦 Migrating $service..."
  cd "services/$service"
  
  # Generate Prisma client
  npx prisma generate
  
  # Run migrations
  npx prisma migrate dev --name init
  
  cd ../..
  echo "✅ $service migration complete"
  echo ""
done

echo "🎉 All migrations completed successfully!"
