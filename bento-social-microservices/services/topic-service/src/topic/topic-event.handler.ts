import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import {
  RedisClient,
  EvtPostCreated,
  EvtPostDeleted,
  PostCreatedEvent,
  PostDeletedEvent,
} from '@bento/shared';
import { ITopicService } from './topic.port';
import { TOPIC_SERVICE } from './topic.di-token';

@Injectable()
export class TopicEventHandler implements OnModuleInit {
  private readonly logger = new Logger(TopicEventHandler.name);

  constructor(
    @Inject(TOPIC_SERVICE)
    private readonly topicService: ITopicService,
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

    // Subscribe to PostCreated event
    await redis.subscribe(EvtPostCreated, async (message: string) => {
      try {
        const json = JSON.parse(message);
        const event = PostCreatedEvent.from(json);
        this.logger.log(`Received PostCreated event: ${event.id}`);

        if (event.payload.topicId) {
          await this.topicService.incrementPostCount(event.payload.topicId);
        }
      } catch (error) {
        this.logger.error(`Failed to handle PostCreated event: ${error}`);
      }
    });

    // Subscribe to PostDeleted event
    await redis.subscribe(EvtPostDeleted, async (message: string) => {
      try {
        const json = JSON.parse(message);
        const event = PostDeletedEvent.from(json);
        this.logger.log(`Received PostDeleted event: ${event.id}`);

        if (event.payload.topicId) {
          await this.topicService.decrementPostCount(event.payload.topicId);
        }
      } catch (error) {
        this.logger.error(`Failed to handle PostDeleted event: ${error}`);
      }
    });

    this.logger.log('Subscribed to PostCreated and PostDeleted events');
  }
}

