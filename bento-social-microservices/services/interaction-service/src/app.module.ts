import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./health/health.module";
import { PostLikeModule } from "./post-like/post-like.module";
import { PostSaveModule } from "./post-save/post-save.module";
import { FollowingModule } from "./following/following.module";
import { InteractionGrpcController } from "./interaction-grpc.controller";

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    PostLikeModule,
    PostSaveModule,
    FollowingModule,
  ],
  controllers: [InteractionGrpcController],
})
export class AppModule {}
