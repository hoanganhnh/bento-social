import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { PostController } from "./post.controller";
import { PostRpcController } from "./post-rpc.controller";
import { PostService } from "./post.service";
import { PostRepository } from "./post.repository";
import { PostEventHandler } from "./post-event.handler";
import {
  POST_SERVICE,
  POST_REPOSITORY,
  TOPIC_RPC,
  USER_RPC,
  POST_LIKED_RPC,
  POST_SAVED_RPC,
} from "./post.di-token";
import {
  UserGrpcAdapter,
  TopicGrpcAdapter,
  InteractionGrpcAdapter,
} from "./post-grpc.adapter";
import { AuthGrpcAdapter } from "./auth-grpc.adapter";
import { TOKEN_INTROSPECTOR } from "@bento/shared";
import { join } from "path";

const authServiceUrl = process.env.AUTH_GRPC_URL || "localhost:50052";
const userServiceUrl = process.env.USER_GRPC_URL || "localhost:50051";
const topicServiceUrl = process.env.TOPIC_GRPC_URL || "localhost:50053";
const interactionServiceUrl =
  process.env.INTERACTION_GRPC_URL || "localhost:50054";

@Module({
  imports: [
    ClientsModule.register([
      {
        name: "AUTH_SERVICE",
        transport: Transport.GRPC,
        options: {
          package: "auth",
          protoPath: join(
            __dirname,
            "../../../../packages/shared/src/proto/auth.proto",
          ),
          url: authServiceUrl,
        },
      },
      {
        name: "USER_SERVICE",
        transport: Transport.GRPC,
        options: {
          package: "user",
          protoPath: join(
            __dirname,
            "../../../../packages/shared/src/proto/user.proto",
          ),
          url: userServiceUrl,
        },
      },
      {
        name: "TOPIC_SERVICE",
        transport: Transport.GRPC,
        options: {
          package: "topic",
          protoPath: join(
            __dirname,
            "../../../../packages/shared/src/proto/topic.proto",
          ),
          url: topicServiceUrl,
        },
      },
      {
        name: "INTERACTION_SERVICE",
        transport: Transport.GRPC,
        options: {
          package: "interaction",
          protoPath: join(
            __dirname,
            "../../../../packages/shared/src/proto/interaction.proto",
          ),
          url: interactionServiceUrl,
        },
      },
    ]),
  ],
  controllers: [PostController, PostRpcController],
  providers: [
    {
      provide: POST_REPOSITORY,
      useClass: PostRepository,
    },
    {
      provide: POST_SERVICE,
      useClass: PostService,
    },
    {
      provide: TOKEN_INTROSPECTOR,
      useClass: AuthGrpcAdapter,
    },
    {
      provide: USER_RPC,
      useClass: UserGrpcAdapter,
    },
    {
      provide: TOPIC_RPC,
      useClass: TopicGrpcAdapter,
    },
    {
      provide: POST_LIKED_RPC,
      useClass: InteractionGrpcAdapter,
    },
    {
      provide: POST_SAVED_RPC,
      useClass: InteractionGrpcAdapter,
    },
    PostEventHandler,
  ],
  exports: [POST_SERVICE, POST_REPOSITORY],
})
export class PostModule {}
