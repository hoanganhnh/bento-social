import {
  ClientGrpc,
  ClientProxyFactory,
  Transport,
} from "@nestjs/microservices";
import { join } from "path";

export interface UserServiceGrpc {
  findById(data: { id: string }): Promise<any>;
  findByIds(data: { ids: string[] }): Promise<any>;
}

export interface AuthServiceGrpc {
  introspectToken(data: { token: string }): Promise<any>;
}

export interface TopicServiceGrpc {
  findById(data: { id: string }): Promise<any>;
  findByIds(data: { ids: string[] }): Promise<any>;
}

export interface InteractionServiceGrpc {
  hasLiked(data: {
    userId: string;
    postId: string;
  }): Promise<{ liked: boolean }>;
  listPostIdsLiked(data: {
    userId: string;
    postIds: string[];
  }): Promise<{ postIds: string[] }>;
  hasSaved(data: {
    userId: string;
    postId: string;
  }): Promise<{ saved: boolean }>;
  listPostIdsSaved(data: {
    userId: string;
    postIds: string[];
  }): Promise<{ postIds: string[] }>;
}

export class GrpcClientFactory {
  private static protoPath(filename: string): string {
    // Adjust path based on where this file is located
    return join(__dirname, "../proto", filename);
  }

  static createUserClient(url: string = "localhost:50051"): ClientGrpc {
    return ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: "user",
        protoPath: this.protoPath("user.proto"),
        url,
      },
    }) as any;
  }

  static createAuthClient(url: string = "localhost:50052"): ClientGrpc {
    return ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: "auth",
        protoPath: this.protoPath("auth.proto"),
        url,
      },
    }) as any;
  }

  static createTopicClient(url: string = "localhost:50053"): ClientGrpc {
    return ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: "topic",
        protoPath: this.protoPath("topic.proto"),
        url,
      },
    }) as any;
  }

  static createInteractionClient(url: string = "localhost:50054"): ClientGrpc {
    return ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: "interaction",
        protoPath: this.protoPath("interaction.proto"),
        url,
      },
    }) as any;
  }
}
