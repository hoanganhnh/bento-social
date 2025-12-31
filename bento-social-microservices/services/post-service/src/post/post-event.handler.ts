import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import {
  RedisClient,
  EvtPostLiked,
  EvtPostUnliked,
  EvtPostCommented,
  EvtPostCommentDeleted,
  PostLikedEvent,
  PostUnlikedEvent,
  PostCommentedEvent,
  PostCommentDeletedEvent,
} from '@bento/shared';
import { IPostRepository } from './post.port';
import { POST_REPOSITORY } from './post.di-token';

@Injectable()
export class PostEventHandler implements OnModuleInit {
  private readonly logger = new Logger(PostEventHandler.name);

  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: IPostRepository,
  ) {}

  async onModuleInit() {
    await this.subscribeToEvents();
  }

  private async subscribeToEvents() {
    // Check if Redis is initialized
    if (!RedisClient.isInitialized()) {
      this.logger.warn('Redis not initialized, skipping event subscriptions');
      return;
    }

    const redis = RedisClient.getInstance();

    // Subscribe to PostLiked event
    await redis.subscribe(EvtPostLiked, async (message: string) => {
      try {
        const json = JSON.parse(message);
        const event = PostLikedEvent.from(json);
        this.logger.log(`Received PostLiked event: ${event.id}`);
        await this.handlePostLiked(event);
      } catch (error) {
        this.logger.error(`Failed to handle PostLiked event: ${error}`);
      }
    });

    // Subscribe to PostUnliked event
    await redis.subscribe(EvtPostUnliked, async (message: string) => {
      try {
        const json = JSON.parse(message);
        const event = PostUnlikedEvent.from(json);
        this.logger.log(`Received PostUnliked event: ${event.id}`);
        await this.handlePostUnliked(event);
      } catch (error) {
        this.logger.error(`Failed to handle PostUnliked event: ${error}`);
      }
    });

    // Subscribe to PostCommented event
    await redis.subscribe(EvtPostCommented, async (message: string) => {
      try {
        const json = JSON.parse(message);
        const event = PostCommentedEvent.from(json);
        this.logger.log(`Received PostCommented event: ${event.id}`);
        await this.handlePostCommented(event);
      } catch (error) {
        this.logger.error(`Failed to handle PostCommented event: ${error}`);
      }
    });

    // Subscribe to PostCommentDeleted event
    await redis.subscribe(EvtPostCommentDeleted, async (message: string) => {
      try {
        const json = JSON.parse(message);
        const event = PostCommentDeletedEvent.from(json);
        this.logger.log(`Received PostCommentDeleted event: ${event.id}`);
        await this.handlePostCommentDeleted(event);
      } catch (error) {
        this.logger.error(`Failed to handle PostCommentDeleted event: ${error}`);
      }
    });

    this.logger.log('Subscribed to PostLiked, PostUnliked, PostCommented, PostCommentDeleted events');
  }

  private async handlePostLiked(event: PostLikedEvent): Promise<void> {
    await this.postRepository.incrementCount(event.payload.postId, 'likedCount', 1);
    this.logger.debug(`Incremented likedCount for post ${event.payload.postId}`);
  }

  private async handlePostUnliked(event: PostUnlikedEvent): Promise<void> {
    await this.postRepository.decrementCount(event.payload.postId, 'likedCount', 1);
    this.logger.debug(`Decremented likedCount for post ${event.payload.postId}`);
  }

  private async handlePostCommented(event: PostCommentedEvent): Promise<void> {
    await this.postRepository.incrementCount(event.payload.postId, 'commentCount', 1);
    this.logger.debug(`Incremented commentCount for post ${event.payload.postId}`);
  }

  private async handlePostCommentDeleted(event: PostCommentDeletedEvent): Promise<void> {
    await this.postRepository.decrementCount(event.payload.postId, 'commentCount', 1);
    this.logger.debug(`Decremented commentCount for post ${event.payload.postId}`);
  }
}

