#!/bin/bash
set -e

echo "🔧 Updating DATABASE_URL for all services..."
echo ""

# Base database connection
DB_USER="bento"
DB_PASS="bento_secret"
DB_HOST="localhost"
DB_PORT="5432"

# Update auth-service
echo "📝 Updating auth-service..."
cat > services/auth-service/.env << EOF
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/auth_db
REDIS_URL=redis://:bento_redis@localhost:6379/0
RABBITMQ_URL=amqp://bento:bento_rabbit@localhost:5672
JWT_SECRET=bento_jwt_secret_key_change_in_production
EOF

# Update user-service
echo "📝 Updating user-service..."
cat > services/user-service/.env << EOF
NODE_ENV=development
PORT=3002
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/user_db
REDIS_URL=redis://:bento_redis@localhost:6379/0
RABBITMQ_URL=amqp://bento:bento_rabbit@localhost:5672
AUTH_SERVICE_URL=http://localhost:3001
EOF

# Update post-service
echo "📝 Updating post-service..."
cat > services/post-service/.env << EOF
NODE_ENV=development
PORT=3003
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/post_db
REDIS_URL=redis://:bento_redis@localhost:6379/0
RABBITMQ_URL=amqp://bento:bento_rabbit@localhost:5672
AUTH_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
TOPIC_SERVICE_URL=http://localhost:3004
INTERACTION_SERVICE_URL=http://localhost:3008
EOF

# Update topic-service
echo "📝 Updating topic-service..."
cat > services/topic-service/.env << EOF
NODE_ENV=development
PORT=3004
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/topic_db
REDIS_URL=redis://:bento_redis@localhost:6379/0
RABBITMQ_URL=amqp://bento:bento_rabbit@localhost:5672
AUTH_SERVICE_URL=http://localhost:3001
EOF

# Update comment-service
echo "📝 Updating comment-service..."
cat > services/comment-service/.env << EOF
NODE_ENV=development
PORT=3005
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/comment_db
REDIS_URL=redis://:bento_redis@localhost:6379/0
RABBITMQ_URL=amqp://bento:bento_rabbit@localhost:5672
AUTH_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
POST_SERVICE_URL=http://localhost:3003
EOF

# Update notification-service
echo "📝 Updating notification-service..."
cat > services/notification-service/.env << EOF
NODE_ENV=development
PORT=3006
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/notification_db
REDIS_URL=redis://:bento_redis@localhost:6379/0
RABBITMQ_URL=amqp://bento:bento_rabbit@localhost:5672
AUTH_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
POST_SERVICE_URL=http://localhost:3003
EOF

# Update interaction-service
echo "📝 Updating interaction-service..."
cat > services/interaction-service/.env << EOF
NODE_ENV=development
PORT=3008
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/interaction_db
REDIS_URL=redis://:bento_redis@localhost:6379/0
RABBITMQ_URL=amqp://bento:bento_rabbit@localhost:5672
AUTH_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
POST_SERVICE_URL=http://localhost:3003
EOF

# Update api-gateway
echo "📝 Updating api-gateway..."
cat > services/api-gateway/.env << EOF
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3001
AUTH_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
POST_SERVICE_URL=http://localhost:3003
TOPIC_SERVICE_URL=http://localhost:3004
COMMENT_SERVICE_URL=http://localhost:3005
NOTIFICATION_SERVICE_URL=http://localhost:3006
UPLOAD_SERVICE_URL=http://localhost:3007
INTERACTION_SERVICE_URL=http://localhost:3008
EOF

echo ""
echo "✅ All .env files updated successfully!"
echo ""
echo "📋 Database URLs:"
echo "  - auth-service     → auth_db"
echo "  - user-service     → user_db"
echo "  - post-service     → post_db"
echo "  - topic-service    → topic_db"
echo "  - comment-service  → comment_db"
echo "  - notification-service → notification_db"
echo "  - interaction-service  → interaction_db"
