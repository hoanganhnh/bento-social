import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  paginatedResponse,
  PagingDTO,
  pagingDTOSchema,
  PublicUser,
  RemoteAuthGuard,
  ReqWithRequester,
  UserRpcClient,
  IAuthorRpc,
} from '@bento/shared';
import { UseGuards, Request } from '@nestjs/common';
import { POST_LIKE_REPOSITORY, POST_LIKE_SERVICE } from './post-like.di-token';
import { IPostLikeRepository, IPostLikeService } from './post-like.port';

const USER_RPC = Symbol('USER_RPC');

@Controller('posts')
export class PostLikeHttpController {
  private readonly userRpc: IAuthorRpc;

  constructor(
    @Inject(POST_LIKE_SERVICE) private readonly usecase: IPostLikeService,
    @Inject(POST_LIKE_REPOSITORY) private readonly repo: IPostLikeRepository,
  ) {
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3002';
    this.userRpc = new UserRpcClient(userServiceUrl);
  }

  @Post(':id/like')
  @UseGuards(RemoteAuthGuard)
  @HttpCode(HttpStatus.OK)
  async like(@Param('id') postId: string, @Request() req: ReqWithRequester) {
    const { sub } = req.requester;
    const data = await this.usecase.like({ postId, userId: sub });
    return { data };
  }

  @Delete(':id/unlike')
  @UseGuards(RemoteAuthGuard)
  @HttpCode(HttpStatus.OK)
  async unlike(@Param('id') postId: string, @Request() req: ReqWithRequester) {
    const { sub } = req.requester;
    const data = await this.usecase.unlike({ postId, userId: sub });
    return { data };
  }

  @Get(':id/liked-users')
  @HttpCode(HttpStatus.OK)
  async getLikes(@Param('id') postId: string, @Query() paging: PagingDTO) {
    const pagingData = pagingDTOSchema.parse(paging);

    const result = await this.repo.list(postId, pagingData);

    const userIds = result.data.map((item) => item.userId);
    const users = await this.userRpc.findByIds(userIds);

    const userMap: Record<string, PublicUser> = {};
    users.forEach((user) => {
      userMap[user.id] = user;
    });

    const finalResult = result.data.map((item) => {
      const user = userMap[item.userId];
      return { user, likedAt: item.createdAt };
    });

    return paginatedResponse({ ...result, data: finalResult }, {});
  }
}

@Controller('rpc')
export class PostLikeRpcController {
  constructor(
    @Inject(POST_LIKE_REPOSITORY) private readonly repo: IPostLikeRepository,
  ) {}

  @Post('has-liked')
  @HttpCode(HttpStatus.OK)
  async hasLiked(@Body() req: { userId: string; postId: string }) {
    try {
      const result = await this.repo.get(req);
      return { data: result !== null };
    } catch (e) {
      return { data: false };
    }
  }

  @Post('list-post-ids-liked')
  @HttpCode(HttpStatus.OK)
  async listPostIdsLiked(@Body() req: { userId: string; postIds: string[] }) {
    const data = await this.repo.listPostIdsLiked(req.userId, req.postIds);
    return { data };
  }
}


