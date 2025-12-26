import { Module } from "@nestjs/common";
import { TopicController } from "./topic.controller";
import { TopicRpcController } from "./topic-rpc.controller";
import { TopicGrpcController } from "./topic-grpc.controller";
import { TopicService } from "./topic.service";
import { TopicRepository } from "./topic.repository";
import { TopicEventHandler } from "./topic-event.handler";
import { TOPIC_SERVICE, TOPIC_REPOSITORY } from "./topic.di-token";
import { TokenIntrospectRpcClient, TOKEN_INTROSPECTOR } from "@bento/shared";

const authServiceUrl = process.env.AUTH_SERVICE_URL || "http://localhost:3001";

@Module({
  controllers: [TopicController, TopicRpcController, TopicGrpcController],
  providers: [
    {
      provide: TOPIC_REPOSITORY,
      useClass: TopicRepository,
    },
    {
      provide: TOPIC_SERVICE,
      useClass: TopicService,
    },
    {
      provide: TOKEN_INTROSPECTOR,
      useFactory: () =>
        new TokenIntrospectRpcClient(`${authServiceUrl}/rpc/introspect`),
    },
    TopicEventHandler,
  ],
  exports: [TOPIC_SERVICE, TOPIC_REPOSITORY],
})
export class TopicModule {}
