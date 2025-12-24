import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostRpcController } from './post-rpc.controller';
import { PostService } from './post.service';
import { PostRepository } from './post.repository';
import { PostEventHandler } from './post-event.handler';
import {
  POST_SERVICE,
  POST_REPOSITORY,
  TOPIC_RPC,
  USER_RPC,
  POST_LIKED_RPC,
  POST_SAVED_RPC,
} from './post.di-token';
import {
  TokenIntrospectRpcClient,
  TOKEN_INTROSPECTOR,
  TopicRpcClient,
  UserRpcClient,
  PostLikedRpcClient,
  PostSavedRpcClient,
} from '@bento/shared';

const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3002';
const topicServiceUrl = process.env.TOPIC_SERVICE_URL || 'http://localhost:3004';
const interactionServiceUrl = process.env.INTERACTION_SERVICE_URL || 'http://localhost:3008';

@Module({
  controllers: [PostController, PostRpcController],
  providers: [
    {
      provide: POST_REPOSITORY,
      useClass: PostRepository,
    },
    {
      provide: POST_SERVICE,
      useClass: PostService,
    },
    {
      provide: TOKEN_INTROSPECTOR,
      useFactory: () => new TokenIntrospectRpcClient(`${authServiceUrl}/rpc/introspect`),
    },
    {
      provide: TOPIC_RPC,
      useFactory: () => new TopicRpcClient(topicServiceUrl),
    },
    {
      provide: USER_RPC,
      useFactory: () => new UserRpcClient(userServiceUrl),
    },
    {
      provide: POST_LIKED_RPC,
      useFactory: () => new PostLikedRpcClient(interactionServiceUrl),
    },
    {
      provide: POST_SAVED_RPC,
      useFactory: () => new PostSavedRpcClient(interactionServiceUrl),
    },
    PostEventHandler,
  ],
  exports: [POST_SERVICE, POST_REPOSITORY],
})
export class PostModule {}

