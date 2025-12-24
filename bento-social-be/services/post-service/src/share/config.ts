import * as dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || '3003';

export const config = {
  envName: process.env.NODE_ENV,
  port,
  jwtSecret: process.env.JWT_SECRET_KEY || 'ptit@edu',
  rpc: {
    jwtSecret: process.env.JWT_SECRET_KEY || 'ptit@edu',
    introspectUrl:
      process.env.VERIFY_TOKEN_URL || 'http://localhost:3002/v1/rpc/introspect',
    userServiceURL: process.env.USER_SERVICE_URL || 'http://localhost:3002/v1',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    url: process.env.REDIS_URL || 'redis://:ptit_redis@localhost:6379/0',
  },
  db: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://ptit:ptit_secret@localhost:5432/bento-social?schema=post_service',
  },
};
