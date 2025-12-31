import { Injectable, Logger, OnModuleInit, Inject } from "@nestjs/common";
import {
  RabbitMQClient,
  EvtPostCreated,
  EvtPostDeleted,
  PostCreatedEvent,
  PostDeletedEvent,
} from "@bento/shared";
import { ITopicService } from "./topic.port";
import { TOPIC_SERVICE } from "./topic.di-token";

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
    if (!RabbitMQClient.isInitialized()) {
      this.logger.warn(
        "RabbitMQ not initialized, skipping event subscriptions",
      );
      return;
    }

    const rabbitmq = RabbitMQClient.getInstance();

    await rabbitmq.subscribe<PostCreatedEvent>(
      EvtPostCreated,
      async (event: PostCreatedEvent) => {
        try {
          this.logger.log(`Received PostCreated event: ${event.id}`);
          if (event.payload.topicId) {
            await this.topicService.incrementPostCount(event.payload.topicId);
          }
        } catch (error) {
          this.logger.error(`Failed to handle PostCreated event: ${error}`);
          throw error;
        }
      },
      "topic-service.post-created.queue",
    );

    await rabbitmq.subscribe<PostDeletedEvent>(
      EvtPostDeleted,
      async (event: PostDeletedEvent) => {
        try {
          this.logger.log(`Received PostDeleted event: ${event.id}`);
          if (event.payload.topicId) {
            await this.topicService.decrementPostCount(event.payload.topicId);
          }
        } catch (error) {
          this.logger.error(`Failed to handle PostDeleted event: ${error}`);
          throw error;
        }
      },
      "topic-service.post-deleted.queue",
    );

    this.logger.log(
      "Subscribed to PostCreated and PostDeleted events via RabbitMQ",
    );
  }
}
