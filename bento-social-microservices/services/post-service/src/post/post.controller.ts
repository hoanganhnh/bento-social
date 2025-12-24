import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Inject,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import {
  RemoteAuthGuard,
  RemoteAuthGuardOptional,
  ReqUser,
  Requester,
  PagingDTO,
  pagingDTOSchema,
  PublicUser,
  Topic,
} from '@bento/shared';
import { IPostService, IPostRepository, ITopicRpc, IUserRpc, IPostLikedRpc, IPostSavedRpc } from './post.port';
import {
  POST_SERVICE,
  POST_REPOSITORY,
  TOPIC_RPC,
  USER_RPC,
  POST_LIKED_RPC,
  POST_SAVED_RPC,
} from './post.di-token';
import {
  CreatePostDTO,
  UpdatePostDTO,
  PostCondDTO,
  createPostDTOSchema,
  updatePostDTOSchema,
  postCondDTOSchema,
} from './post.dto';
import { ErrPostNotFound, ErrForbidden, ErrTopicNotFound, ErrAuthorNotFound, Post as PostModel } from './post.model';

@Controller('posts')
export class PostController {
  constructor(
    @Inject(POST_SERVICE) private readonly postService: IPostService,
    @Inject(POST_REPOSITORY) private readonly postRepository: IPostRepository,
    @Inject(TOPIC_RPC) private readonly topicRpc: ITopicRpc,
    @Inject(USER_RPC) private readonly userRpc: IUserRpc,
    @Inject(POST_LIKED_RPC) private readonly postLikedRpc: IPostLikedRpc,
    @Inject(POST_SAVED_RPC) private readonly postSavedRpc: IPostSavedRpc,
  ) {}

  /**
   * POST /posts - Create a new post
   */
  @Post()
  @UseGuards(RemoteAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createPost(@Body() body: CreatePostDTO, @ReqUser() requester: Requester) {
    const parsed = createPostDTOSchema.safeParse({ ...body, authorId: requester.sub });
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message);
    }

    try {
      const postId = await this.postService.create(parsed.data);
      return { data: postId };
    } catch (error) {
      if (error === ErrTopicNotFound) {
        throw new NotFoundException('Topic not found');
      }
      if (error === ErrAuthorNotFound) {
        throw new NotFoundException('Author not found');
      }
      throw error;
    }
  }

  /**
   * GET /posts - List posts with pagination and enrichment
   */
  @Get()
  @UseGuards(RemoteAuthGuardOptional)
  @HttpCode(HttpStatus.OK)
  async listPosts(
    @Query() query: PostCondDTO & PagingDTO,
    @ReqUser() requester?: Requester,
  ) {
    const pagingParsed = pagingDTOSchema.safeParse(query);
    const condParsed = postCondDTOSchema.safeParse(query);

    const paging = pagingParsed.success ? pagingParsed.data : { page: 1, limit: 20 };
    const cond = condParsed.success ? condParsed.data : {};

    const result = await this.postRepository.list(cond, paging);

    // Enrich posts with topics, authors, and interaction status
    const enrichedPosts = await this._enrichPosts(result.data, requester?.sub);

    return {
      data: enrichedPosts,
      paging: result.paging,
      total: result.total,
    };
  }

  /**
   * GET /posts/:id - Get a single post with enrichment
   */
  @Get(':id')
  @UseGuards(RemoteAuthGuardOptional)
  @HttpCode(HttpStatus.OK)
  async getPost(@Param('id') id: string, @ReqUser() requester?: Requester) {
    const post = await this.postRepository.get(id);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const enrichedPost = await this._enrichPost(post, requester?.sub);
    return { data: enrichedPost };
  }

  /**
   * PATCH /posts/:id - Update a post
   */
  @Patch(':id')
  @UseGuards(RemoteAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updatePost(
    @Param('id') id: string,
    @Body() body: UpdatePostDTO,
    @ReqUser() requester: Requester,
  ) {
    const parsed = updatePostDTOSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message);
    }

    try {
      const result = await this.postService.update(id, parsed.data, requester);
      return { data: result };
    } catch (error) {
      if (error === ErrPostNotFound) {
        throw new NotFoundException('Post not found');
      }
      if (error === ErrForbidden) {
        throw new ForbiddenException('You do not have permission');
      }
      if (error === ErrTopicNotFound) {
        throw new NotFoundException('Topic not found');
      }
      throw error;
    }
  }

  /**
   * DELETE /posts/:id - Delete a post
   */
  @Delete(':id')
  @UseGuards(RemoteAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deletePost(@Param('id') id: string, @ReqUser() requester: Requester) {
    try {
      const result = await this.postService.delete(id, requester);
      return { data: result };
    } catch (error) {
      if (error === ErrPostNotFound) {
        throw new NotFoundException('Post not found');
      }
      if (error === ErrForbidden) {
        throw new ForbiddenException('You do not have permission');
      }
      throw error;
    }
  }

  /**
   * Enrich a list of posts with topics, authors, and interaction status
   */
  private async _enrichPosts(posts: PostModel[], userId?: string): Promise<PostModel[]> {
    if (posts.length === 0) return [];

    const topicIds = [...new Set(posts.map(p => p.topicId))];
    const authorIds = [...new Set(posts.map(p => p.authorId))];
    const postIds = posts.map(p => p.id);

    // Fetch all data in parallel
    const [topics, authors, likedIds, savedIds] = await Promise.all([
      this.topicRpc.findByIds(topicIds),
      this.userRpc.findByIds(authorIds),
      userId ? this.postLikedRpc.listPostIdsLiked(userId, postIds) : [],
      userId ? this.postSavedRpc.listPostIdsSaved(userId, postIds) : [],
    ]);

    // Create lookup maps
    const topicMap: Record<string, Topic> = {};
    const authorMap: Record<string, PublicUser> = {};
    const likedSet = new Set(likedIds);
    const savedSet = new Set(savedIds);

    topics.forEach(t => { topicMap[t.id] = t; });
    authors.forEach(a => { authorMap[a.id] = a; });

    // Enrich posts
    return posts.map(post => ({
      ...post,
      topic: topicMap[post.topicId],
      author: authorMap[post.authorId],
      hasLiked: likedSet.has(post.id),
      hasSaved: savedSet.has(post.id),
    }));
  }

  /**
   * Enrich a single post with topic, author, and interaction status
   */
  private async _enrichPost(post: PostModel, userId?: string): Promise<PostModel> {
    const [topic, author, hasLiked, hasSaved] = await Promise.all([
      this.topicRpc.findById(post.topicId),
      this.userRpc.findById(post.authorId),
      userId ? this.postLikedRpc.hasLiked(userId, post.id) : false,
      userId ? this.postSavedRpc.hasSaved(userId, post.id) : false,
    ]);

    return {
      ...post,
      topic: topic || undefined,
      author: author || undefined,
      hasLiked,
      hasSaved,
    };
  }
}

