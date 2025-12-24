import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { PostLikeModule } from './post-like/post-like.module';
import { PostSaveModule } from './post-save/post-save.module';
import { FollowingModule } from './following/following.module';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    PostLikeModule,
    PostSaveModule,
    FollowingModule,
  ],
})
export class AppModule {}


