import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { createProxyMiddleware } from 'http-proxy-middleware';

@Module({})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // User Service routes (port 3002)
    consumer
      .apply(
        createProxyMiddleware({
          target: process.env.USER_SERVICE_URL || 'http://localhost:3002',
          changeOrigin: true,
        }),
      )
      .exclude('v1/users/(.*)/saved-posts')
      .forRoutes(
        '/v1/users/*',
        '/v1/auth',
        '/v1/authenticate',
        '/v1/register',
        '/v1/profile',
        '/v1/rpc/users/*',
        '/v1/rpc/introspect',
        '/v1/users-suggested',
      );

    // Post Service routes (port 3003)
    consumer
      .apply(
        createProxyMiddleware({
          target: process.env.POST_SERVICE_URL || 'http://localhost:3003',
          changeOrigin: true,
        }),
      )
      .forRoutes(
        '/v1/posts/*',
        '/v1/posts',
        '/v1/topics/*',
        '/v1/topics',
        '/v1/rpc/posts/*',
        '/v1/rpc/topics/*',
      );

    // Fallback to Monolith (port 3001) for all other routes
    consumer
      .apply(
        createProxyMiddleware({
          target: process.env.MONOLITH_URL || 'http://localhost:3001',
          changeOrigin: true,
        }),
      )
      .forRoutes('*');
  }
}
