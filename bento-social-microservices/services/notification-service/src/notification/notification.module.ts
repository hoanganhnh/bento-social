import { Module } from '@nestjs/common';
import {
  TokenIntrospectRpcClient,
  TOKEN_INTROSPECTOR,
  PostRpcClient,
  POST_RPC,
  UserRpcClient,
  USER_RPC,
} from '@bento/shared';
import { NotificationController } from './notification.controller';
import { NotificationEventHandler } from './notification-event.handler';
import { NOTI_REPOSITORY, NOTI_SERVICE } from './notification.di-token';
import { NotificationRepository } from './notification.repository';
import { NotificationService } from './notification.service';

const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const postServiceUrl = process.env.POST_SERVICE_URL || 'http://localhost:3003';
const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3002';

@Module({
  controllers: [NotificationController],
  providers: [
    { provide: NOTI_SERVICE, useClass: NotificationService },
    { provide: NOTI_REPOSITORY, useClass: NotificationRepository },
    {
      provide: POST_RPC,
      useFactory: () => new PostRpcClient(postServiceUrl),
    },
    {
      provide: USER_RPC,
      useFactory: () => new UserRpcClient(userServiceUrl),
    },
    {
      provide: TOKEN_INTROSPECTOR,
      useFactory: () => new TokenIntrospectRpcClient(`${authServiceUrl}/rpc/introspect`),
    },
    NotificationEventHandler,
  ],
})
export class NotificationModule {}

