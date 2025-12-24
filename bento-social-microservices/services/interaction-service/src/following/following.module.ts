import { Module } from '@nestjs/common';
import {
  TokenIntrospectRpcClient,
  TOKEN_INTROSPECTOR,
  UserRpcClient,
  USER_RPC,
} from '@bento/shared';
import { FollowingController } from './following.controller';
import { FOLLOWING_REPOSITORY, FOLLOWING_SERVICE } from './following.di-token';
import { FollowingRepository } from './following.repository';
import { FollowingService } from './following.service';

const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3002';

@Module({
  controllers: [FollowingController],
  providers: [
    { provide: FOLLOWING_REPOSITORY, useClass: FollowingRepository },
    { provide: FOLLOWING_SERVICE, useClass: FollowingService },
    {
      provide: USER_RPC,
      useFactory: () => new UserRpcClient(userServiceUrl),
    },
    {
      provide: TOKEN_INTROSPECTOR,
      useFactory: () => new TokenIntrospectRpcClient(`${authServiceUrl}/rpc/introspect`),
    },
  ],
})
export class FollowingModule {}


