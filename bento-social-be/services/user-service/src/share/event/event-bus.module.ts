import { Inject, Logger, Module, OnModuleInit } from '@nestjs/common';
import { RedisClient } from '../components';
import { config } from '../config';
import { EvtPostCreated, EvtPostDeleted } from './post.evt';
import { USER_REPOSITORY } from '../../modules/user/user.di-token';
import { IUserRepository } from '../../modules/user/user.port';
import { UserPrismaRepository } from '../../modules/user/user-prisma.repo';

const USER_REPOSITORY_PROVIDER = {
  provide: USER_REPOSITORY,
  useClass: UserPrismaRepository,
};

@Module({
  providers: [USER_REPOSITORY_PROVIDER],
  exports: [USER_REPOSITORY_PROVIDER],
})
export class EventBusModule implements OnModuleInit {
  private readonly logger = new Logger(EventBusModule.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {}

  async onModuleInit() {
    await this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      await RedisClient.init(config.redis.url);
      const redis = RedisClient.getInstance();

      // Subscribe to post.created event
      await redis.subscribe(EvtPostCreated, async (message: string) => {
        try {
          const event = JSON.parse(message);
          const userId = event.senderId;
          if (userId) {
            await this.userRepo.increaseCount(userId, 'postCount', 1);
            this.logger.log(`Incremented postCount for user ${userId}`);
          }
        } catch (err) {
          this.logger.error(`Error processing ${EvtPostCreated}: ${err}`);
        }
      });

      // Subscribe to post.deleted event
      await redis.subscribe(EvtPostDeleted, async (message: string) => {
        try {
          const event = JSON.parse(message);
          const userId = event.senderId;
          if (userId) {
            await this.userRepo.decreaseCount(userId, 'postCount', 1);
            this.logger.log(`Decremented postCount for user ${userId}`);
          }
        } catch (err) {
          this.logger.error(`Error processing ${EvtPostDeleted}: ${err}`);
        }
      });

      this.logger.log('Subscribed to PostCreated and PostDeleted events');
    } catch (err) {
      this.logger.error(`Failed to initialize Redis: ${err}`);
    }
  }
}
