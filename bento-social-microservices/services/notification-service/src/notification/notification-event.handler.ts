import { Injectable, Logger, OnModuleInit, Inject } from "@nestjs/common";
import {
  RedisClient,
  EvtPostLiked,
  EvtFollowed,
  EvtPostCommented,
  PostLikedEvent,
  FollowedEvent,
  PostCommentedEvent,
  IPostRpc,
  IAuthorRpc,
} from "@bento/shared";
import { NOTI_SERVICE, POST_RPC, USER_RPC } from "./notification.di-token";
import {
  NotificationAction,
  NotificationCreateDTO,
} from "./notification.model";
import { INotificationService } from "./notification.port";

@Injectable()
export class NotificationEventHandler implements OnModuleInit {
  private readonly logger = new Logger(NotificationEventHandler.name);

  constructor(
    @Inject(NOTI_SERVICE)
    private readonly notificationService: INotificationService,
    @Inject(POST_RPC) private readonly postRpc: IPostRpc,
    @Inject(USER_RPC) private readonly userRpc: IAuthorRpc,
  ) {}

  async onModuleInit() {
    await this.subscribeToEvents();
  }

  private async subscribeToEvents() {
    if (!RedisClient.isInitialized()) {
      this.logger.warn("Redis not initialized, skipping event subscriptions");
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

    // Subscribe to Followed event
    await redis.subscribe(EvtFollowed, async (message: string) => {
      try {
        const json = JSON.parse(message);
        const event = FollowedEvent.from(json);
        this.logger.log(`Received Followed event: ${event.id}`);
        await this.handleFollowed(event);
      } catch (error) {
        this.logger.error(`Failed to handle Followed event: ${error}`);
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

    this.logger.log("Subscribed to PostLiked, Followed, PostCommented events");
  }

  private async handlePostLiked(event: PostLikedEvent): Promise<void> {
    const { postId } = event.payload;
    const actorId = event.senderId!;

    const post = await this.postRpc.findById(postId);
    if (!post) {
      this.logger.warn(`Post ${postId} not found`);
      return;
    }

    // Don't notify self
    if (actorId === post.authorId) return;

    const actor = await this.userRpc.findById(actorId);
    if (!actor) {
      this.logger.warn(`User ${actorId} not found`);
      return;
    }

    const dto: NotificationCreateDTO = {
      receiverId: post.authorId,
      actorId,
      content: `${actor.firstName} ${actor.lastName} liked your post`,
      action: NotificationAction.LIKED,
    };

    await this.notificationService.create(dto);
    this.logger.debug(`Created notification for PostLiked: ${post.authorId}`);
  }

  private async handleFollowed(event: FollowedEvent): Promise<void> {
    const { followingId } = event.payload;
    const actorId = event.senderId!;

    const actor = await this.userRpc.findById(actorId);
    if (!actor) {
      this.logger.warn(`User ${actorId} not found`);
      return;
    }

    const dto: NotificationCreateDTO = {
      receiverId: followingId,
      actorId,
      content: `${actor.firstName} ${actor.lastName} followed you`,
      action: NotificationAction.FOLLOWED,
    };

    await this.notificationService.create(dto);
    this.logger.debug(`Created notification for Followed: ${followingId}`);
  }

  private async handlePostCommented(event: PostCommentedEvent): Promise<void> {
    const { authorIdOfParentComment, postId } = event.payload; // Extract postId
    const actorId = event.senderId!;

    const actor = await this.userRpc.findById(actorId);
    if (!actor) {
      this.logger.warn(`User ${actorId} not found`);
      return;
    }

    // 1. Notify Post Author
    const post = await this.postRpc.findById(postId);
    if (post && post.authorId !== actorId) {
      // Avoid duplicate notification if post author is same as parent comment author (handled below)
      if (post.authorId !== authorIdOfParentComment) {
        const dto: NotificationCreateDTO = {
          receiverId: post.authorId,
          actorId,
          content: `${actor.firstName} ${actor.lastName} commented on your post`,
          action: NotificationAction.COMMENTED,
        };
        await this.notificationService.create(dto);
      }
    }

    // 2. Notify Parent Comment Author (if reply)
    // Only notify for replies (when there's a parent comment author)
    if (!authorIdOfParentComment) return;

    // Don't notify self
    if (actorId === authorIdOfParentComment) return;

    const dto: NotificationCreateDTO = {
      receiverId: authorIdOfParentComment,
      actorId,
      content: `${actor.firstName} ${actor.lastName} replied to your comment`,
      action: NotificationAction.REPLIED,
    };

    await this.notificationService.create(dto);
    this.logger.debug(
      `Created notification for PostCommented: ${authorIdOfParentComment}`,
    );
  }
}
