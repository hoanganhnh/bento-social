import { Module, Provider } from '@nestjs/common';
import { config } from 'src/share/config';
import { ShareModule } from 'src/share/module';
import { TopicQueryRPC } from '../post/insfra/post.rpc-client';
import { PostSaveController } from './post-save.controller';
import {
  POST_SAVE_REPOSITORY,
  POST_SAVE_SERVICE,
  TOPIC_QUERY_RPC,
} from './post-save.di-token';
import { PostSaveRepository } from './post-save.repository';
import { PostSaveService } from './post-save.service';

const dependencies: Provider[] = [
  { provide: POST_SAVE_SERVICE, useClass: PostSaveService },
  { provide: POST_SAVE_REPOSITORY, useClass: PostSaveRepository },
  {
    provide: TOPIC_QUERY_RPC,
    useFactory: () => new TopicQueryRPC(config.rpc.topicServiceURL),
  },
];

@Module({
  imports: [ShareModule],
  controllers: [PostSaveController],
  providers: [...dependencies],
})
export class PostSaveModule {}
