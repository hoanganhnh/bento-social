import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Logger,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  IPostRpc,
  paginatedResponse,
  PagingDTO,
  pagingDTOSchema,
  Post as PostModel,
  PublicUser,
  RemoteAuthGuard,
  ReqWithRequester,
  Topic,
  UserRpcClient,
  IAuthorRpc,
  PostRpcClient,
  TopicRpcClient,
  ITopicRpc,
} from '@bento/shared';
import { POST_SAVE_REPOSITORY, POST_SAVE_SERVICE } from './post-save.di-token';
import { IPostSaveRepository, IPostSaveService } from './post-save.port';

@Controller()
export class PostSaveController {
  private readonly postRpc: IPostRpc;
  private readonly userRpc: IAuthorRpc;
  private readonly topicRpc: ITopicRpc;

  constructor(
    @Inject(POST_SAVE_SERVICE) private readonly usecase: IPostSaveService,
    @Inject(POST_SAVE_REPOSITORY) private readonly repo: IPostSaveRepository,
  ) {
    const postServiceUrl = process.env.POST_SERVICE_URL || 'http://localhost:3003';
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3002';
    const topicServiceUrl = process.env.TOPIC_SERVICE_URL || 'http://localhost:3004';

    this.postRpc = new PostRpcClient(postServiceUrl);
    this.userRpc = new UserRpcClient(userServiceUrl);
    this.topicRpc = new TopicRpcClient(topicServiceUrl);
  }

  @Post('posts/:id/save')
  @UseGuards(RemoteAuthGuard)
  @HttpCode(200)
  async save(@Param('id') postId: string, @Request() req: ReqWithRequester) {
    const { sub } = req.requester;
    const dto = { postId, userId: sub };

    const result = await this.usecase.save(dto);
    return { data: result };
  }

  @Delete('posts/:id/save')
  @UseGuards(RemoteAuthGuard)
  @HttpCode(200)
  async unsave(@Param('id') postId: string, @Request() req: ReqWithRequester) {
    const { sub } = req.requester;

    const dto = { postId, userId: sub };
    const result = await this.usecase.unsave(dto);
    return { data: result };
  }

  @Get('users/:id/saved-posts')
  @UseGuards(RemoteAuthGuard)
  @HttpCode(200)
  async listPostSave(
    @Param('id') userId: string,
    @Query() paging: PagingDTO,
  ) {
    const pagingData = pagingDTOSchema.parse(paging);

    const postUserSave = await this.repo.list(userId, pagingData);

    const postIds = postUserSave.data.map((item) => item.postId);
    const posts = await this.postRpc.findByIds(postIds);

    const authorMap: Record<string, PublicUser> = {};
    const postMap: Record<string, PostModel> = {};
    const topicMap: Record<string, Topic> = {};

    let topicIds: string[] = [];
    let authorIds: string[] = [];

    posts.forEach((p: PostModel) => {
      postMap[p.id] = p;
      topicIds.push(p.topicId);
      authorIds.push(p.authorId);
    });

    const authors = await this.userRpc.findByIds(authorIds);

    authors.forEach((au: PublicUser) => {
      authorMap[au.id] = au;
    });

    const topics = await this.topicRpc.findByIds(topicIds);

    topics.forEach((t: Topic) => {
      topicMap[t.id] = t;
    });

    const listPosts = postUserSave.data.map((item) => {
      const post = postMap[item.postId];
      if (!post) return null;
      
      const author = authorMap[post.authorId];
      const topic = topicMap[post.topicId];

      return {
        ...post,
        author,
        topic,
        hasSaved: true,
        createdAt: item.createdAt,
      };
    }).filter(Boolean);

    const pagingResult = {
      paging,
      total: postUserSave.total,
      data: listPosts,
    };

    return paginatedResponse(pagingResult, {});
  }
}

@Controller('rpc')
export class PostSaveRpcController {
  constructor(
    @Inject(POST_SAVE_REPOSITORY) private readonly repo: IPostSaveRepository,
  ) {}

  @Post('has-saved')
  @HttpCode(200)
  async hasSavedAPI(@Body() body: { userId: string; postId: string }) {
    try {
      const { userId, postId } = body;
      const result = await this.repo.get({ userId, postId });
      return { data: result !== null };
    } catch (e) {
      Logger.error((e as Error).message);
      return { data: false };
    }
  }

  @Post('list-post-ids-saved')
  @HttpCode(200)
  async listPostIdsSavedAPI(@Body() body: { userId: string; postIds: string[] }) {
    const { userId, postIds } = body;
    const result = await this.repo.listPostIdsSaved(userId, postIds);
    return { data: result };
  }
}


