import { Module } from '@nestjs/common';
import {
  TokenIntrospectRpcClient,
  TOKEN_INTROSPECTOR,
  PostRpcClient,
  POST_RPC,
  UserRpcClient,
  USER_RPC,
} from '@bento/shared';
import { CommentController } from './comment.controller';
import { COMMENT_REPOSITORY, COMMENT_SERVICE } from './comment.di-token';
import { CommentRepository } from './comment.repository';
import { CommentService } from './comment.service';

const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const postServiceUrl = process.env.POST_SERVICE_URL || 'http://localhost:3003';
const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3002';

@Module({
  controllers: [CommentController],
  providers: [
    { provide: COMMENT_SERVICE, useClass: CommentService },
    { provide: COMMENT_REPOSITORY, useClass: CommentRepository },
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
  ],
})
export class CommentModule {}

