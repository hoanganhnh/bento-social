import { Module } from '@nestjs/common';
import { TopicModule } from './topic/topic.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, TopicModule, HealthModule],
})
export class AppModule {}

