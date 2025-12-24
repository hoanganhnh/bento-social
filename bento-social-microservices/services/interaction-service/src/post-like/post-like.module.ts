import { Module } from '@nestjs/common';
import { TokenIntrospectRpcClient, TOKEN_INTROSPECTOR } from '@bento/shared';
import { PostLikeHttpController, PostLikeRpcController } from './post-like.controller';
import { POST_LIKE_REPOSITORY, POST_LIKE_SERVICE, POST_QUERY_RPC } from './post-like.di-token';
import { PostLikeRepository } from './post-like.repository';
import { PostLikeService } from './post-like.service';
import { PostQueryRpc } from './post-query.rpc';

const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const postServiceUrl = process.env.POST_SERVICE_URL || 'http://localhost:3003';

@Module({
  controllers: [PostLikeHttpController, PostLikeRpcController],
  providers: [
    { provide: POST_LIKE_REPOSITORY, useClass: PostLikeRepository },
    { provide: POST_LIKE_SERVICE, useClass: PostLikeService },
    {
      provide: POST_QUERY_RPC,
      useFactory: () => new PostQueryRpc(postServiceUrl),
    },
    {
      provide: TOKEN_INTROSPECTOR,
      useFactory: () => new TokenIntrospectRpcClient(`${authServiceUrl}/rpc/introspect`),
    },
  ],
  exports: [POST_LIKE_REPOSITORY],
})
export class PostLikeModule {}


