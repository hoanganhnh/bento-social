import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { createProxyMiddleware } from 'http-proxy-middleware';

@Module({})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        createProxyMiddleware({
          target: 'http://localhost:3002',
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
        '/v1/rpc',
        '/v1/users-suggested',
      );

    consumer
      .apply(
        createProxyMiddleware({
          target: 'http://localhost:3001',
          changeOrigin: true,
        }),
      )
      .forRoutes('*');
  }
}
