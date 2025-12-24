import { Module, Provider } from '@nestjs/common';
import { REMOTE_AUTH_GUARD } from 'src/share/di-token';
import { RemoteAuthGuard } from 'src/share/guard';
import { ShareModule } from 'src/share/module';
import {
  PostHttpController,
  PostPrismaRepository,
  PostRpcController,
  TopicQueryRPC,
} from './insfra';
import { POST_REPOSITORY, POST_SERVICE, TOPIC_QUERY } from './post.di-token';
import { PostService } from './service';

const dependencies: Provider[] = [
  { provide: POST_SERVICE, useClass: PostService },
  { provide: POST_REPOSITORY, useClass: PostPrismaRepository },
  { provide: TOPIC_QUERY, useClass: TopicQueryRPC },
  { provide: REMOTE_AUTH_GUARD, useClass: RemoteAuthGuard },
];

@Module({
  imports: [ShareModule],
  controllers: [PostHttpController, PostRpcController],
  providers: [...dependencies],
})
export class PostModule {}
