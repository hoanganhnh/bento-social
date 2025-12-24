import { Module } from '@nestjs/common';
import { PostModule } from './modules/post/post.module';
import { TopicModule } from './modules/topic/topic.module';

@Module({
  imports: [PostModule, TopicModule],
})
export class AppModule {}
