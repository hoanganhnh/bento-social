import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { CommentModule } from './comment/comment.module';

@Module({
  imports: [PrismaModule, HealthModule, CommentModule],
})
export class AppModule {}

