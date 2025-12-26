import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserRpcController } from './user-rpc.controller';
import { UserGrpcController } from './user-grpc.controller';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { USER_SERVICE, USER_REPOSITORY } from './user.di-token';
import { TokenIntrospectRpcClient, TOKEN_INTROSPECTOR } from '@bento/shared';

const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

@Module({
  controllers: [UserController, UserRpcController, UserGrpcController],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    {
      provide: USER_SERVICE,
      useClass: UserService,
    },
    {
      provide: TOKEN_INTROSPECTOR,
      useFactory: () =>
        new TokenIntrospectRpcClient(`${authServiceUrl}/rpc/introspect`),
    },
  ],
  exports: [USER_SERVICE, USER_REPOSITORY],
})
export class UserModule {}

