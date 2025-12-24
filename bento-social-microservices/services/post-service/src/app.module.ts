import { Module } from '@nestjs/common';
import { PostModule } from './post/post.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, PostModule, HealthModule],
})
export class AppModule {}

