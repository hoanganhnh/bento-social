import { Module } from '@nestjs/common';
import {
  TokenIntrospectRpcClient,
  TOKEN_INTROSPECTOR,
  PostRpcClient,
  POST_RPC,
} from '@bento/shared';
import { PostSaveController, PostSaveRpcController } from './post-save.controller';
import { POST_SAVE_REPOSITORY, POST_SAVE_SERVICE } from './post-save.di-token';
import { PostSaveRepository } from './post-save.repository';
import { PostSaveService } from './post-save.service';

const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const postServiceUrl = process.env.POST_SERVICE_URL || 'http://localhost:3003';

@Module({
  controllers: [PostSaveController, PostSaveRpcController],
  providers: [
    { provide: POST_SAVE_SERVICE, useClass: PostSaveService },
    { provide: POST_SAVE_REPOSITORY, useClass: PostSaveRepository },
    {
      provide: POST_RPC,
      useFactory: () => new PostRpcClient(postServiceUrl),
    },
    {
      provide: TOKEN_INTROSPECTOR,
      useFactory: () => new TokenIntrospectRpcClient(`${authServiceUrl}/rpc/introspect`),
    },
  ],
  exports: [POST_SAVE_REPOSITORY],
})
export class PostSaveModule {}


