import { Inject, Injectable, Logger } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import {
  Requester,
  UserRole,
  RedisClient,
  PostCreatedEvent,
  PostDeletedEvent,
} from '@bento/shared';
import { IPostRepository, IPostService, ITopicRpc, IUserRpc } from './post.port';
import {
  Post,
  PostType,
  ErrPostNotFound,
  ErrAuthorNotFound,
  ErrTopicNotFound,
  ErrForbidden,
} from './post.model';
import { CreatePostDTO, UpdatePostDTO, createPostDTOSchema, updatePostDTOSchema } from './post.dto';
import { POST_REPOSITORY, TOPIC_RPC, USER_RPC } from './post.di-token';

@Injectable()
export class PostService implements IPostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    @Inject(POST_REPOSITORY) private readonly postRepository: IPostRepository,
    @Inject(TOPIC_RPC) private readonly topicRpc: ITopicRpc,
    @Inject(USER_RPC) private readonly userRpc: IUserRpc,
  ) {}

  async create(dto: CreatePostDTO): Promise<string> {
    const data = createPostDTOSchema.parse(dto);

    // Verify topic exists
    const topic = await this.topicRpc.findById(data.topicId);
    if (!topic) {
      throw ErrTopicNotFound;
    }

    // Verify author exists
    const author = await this.userRpc.findById(data.authorId);
    if (!author) {
      throw ErrAuthorNotFound;
    }

    const now = new Date();
    const post: Post = {
      id: uuidv7(),
      content: data.content,
      image: data.image || '',
      authorId: data.authorId,
      topicId: topic.id,
      isFeatured: false,
      commentCount: 0,
      likedCount: 0,
      type: data.image ? PostType.MEDIA : PostType.TEXT,
      createdAt: now,
      updatedAt: now,
    };

    await this.postRepository.insert(post);

    // Publish PostCreated event
    this._publishPostCreated(post);

    this.logger.log(`Post ${post.id} created by ${data.authorId}`);
    return post.id;
  }

  async update(id: string, dto: UpdatePostDTO, requester: Requester): Promise<boolean> {
    const data = updatePostDTOSchema.parse(dto);

    const post = await this.postRepository.get(id);
    if (!post) {
      throw ErrPostNotFound;
    }

    // Check permission: only author or admin can update
    if (post.authorId !== requester.sub && requester.role !== UserRole.ADMIN) {
      throw ErrForbidden;
    }

    // If topicId is being changed, verify new topic exists
    if (data.topicId && data.topicId !== post.topicId) {
      const topic = await this.topicRpc.findById(data.topicId);
      if (!topic) {
        throw ErrTopicNotFound;
      }
    }

    const updateData: UpdatePostDTO = {
      ...data,
    };

    // Update type based on image
    if (data.image !== undefined) {
      (updateData as any).type = data.image ? PostType.MEDIA : PostType.TEXT;
    }

    await this.postRepository.update(id, updateData);
    this.logger.log(`Post ${id} updated by ${requester.sub}`);

    return true;
  }

  async delete(id: string, requester: Requester): Promise<boolean> {
    const post = await this.postRepository.get(id);
    if (!post) {
      throw ErrPostNotFound;
    }

    // Check permission: only author or admin can delete
    if (post.authorId !== requester.sub && requester.role !== UserRole.ADMIN) {
      throw ErrForbidden;
    }

    await this.postRepository.delete(id);

    // Publish PostDeleted event
    this._publishPostDeleted(post);

    this.logger.log(`Post ${id} deleted by ${requester.sub}`);
    return true;
  }

  private _publishPostCreated(post: Post): void {
    try {
      if (RedisClient.isInitialized()) {
        const event = PostCreatedEvent.create(
          { postId: post.id, topicId: post.topicId },
          post.authorId,
        );
        RedisClient.getInstance().publish(event);
        this.logger.debug(`Published PostCreated event for post ${post.id}`);
      }
    } catch (error) {
      this.logger.error(`Failed to publish PostCreated event: ${error}`);
    }
  }

  private _publishPostDeleted(post: Post): void {
    try {
      if (RedisClient.isInitialized()) {
        const event = PostDeletedEvent.create(
          { postId: post.id, topicId: post.topicId },
          post.authorId,
        );
        RedisClient.getInstance().publish(event);
        this.logger.debug(`Published PostDeleted event for post ${post.id}`);
      }
    } catch (error) {
      this.logger.error(`Failed to publish PostDeleted event: ${error}`);
    }
  }
}

