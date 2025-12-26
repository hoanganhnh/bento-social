import { Injectable, Inject, OnModuleInit } from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
import { ITopicRpc, IUserRpc, IPostLikedRpc, IPostSavedRpc } from "./post.port";
import { Topic, PublicUser } from "@bento/shared";
import { firstValueFrom } from "rxjs";

interface UserServiceGrpc {
  FindById(data: { id: string }): any;
  FindByIds(data: { ids: string[] }): any;
}

interface TopicServiceGrpc {
  FindById(data: { id: string }): any;
  FindByIds(data: { ids: string[] }): any;
}

interface InteractionServiceGrpc {
  HasLiked(data: { userId: string; postId: string }): any;
  ListPostIdsLiked(data: { userId: string; postIds: string[] }): any;
  HasSaved(data: { userId: string; postId: string }): any;
  ListPostIdsSaved(data: { userId: string; postIds: string[] }): any;
}

@Injectable()
export class UserGrpcAdapter implements IUserRpc, OnModuleInit {
  private userService: UserServiceGrpc;

  constructor(@Inject("USER_SERVICE") private client: ClientGrpc) {}

  onModuleInit() {
    this.userService = this.client.getService<UserServiceGrpc>("UserService");
  }

  async findById(id: string): Promise<PublicUser | null> {
    const response: any = await firstValueFrom(
      this.userService.FindById({ id }),
    );
    if (!response || !response.id) {
      return null;
    }
    return {
      id: response.id,
      username: response.username,
      firstName: response.firstName,
      lastName: response.lastName,
      avatar: response.avatar,
      cover: response.cover,
      bio: response.bio,
      websiteUrl: response.websiteUrl,
      followerCount: response.followerCount,
      postCount: response.postCount,
    } as PublicUser;
  }

  async findByIds(ids: string[]): Promise<PublicUser[]> {
    const response: any = await firstValueFrom(
      this.userService.FindByIds({ ids }),
    );
    if (!response || !response.users) {
      return [];
    }
    return response.users.map((u: any) => ({
      id: u.id,
      username: u.username,
      firstName: u.firstName,
      lastName: u.lastName,
      avatar: u.avatar,
      cover: u.cover,
      bio: u.bio,
      websiteUrl: u.websiteUrl,
      followerCount: u.followerCount,
      postCount: u.postCount,
    })) as any[];
  }
}

@Injectable()
export class TopicGrpcAdapter implements ITopicRpc, OnModuleInit {
  private topicService: TopicServiceGrpc;

  constructor(@Inject("TOPIC_SERVICE") private client: ClientGrpc) {}

  onModuleInit() {
    this.topicService =
      this.client.getService<TopicServiceGrpc>("TopicService");
  }

  async findById(id: string): Promise<Topic | null> {
    const response: any = await firstValueFrom(
      this.topicService.FindById({ id }),
    );
    if (!response || !response.id) {
      return null;
    }
    return {
      id: response.id,
      name: response.name,
      color: response.color,
      postCount: response.postCount,
      status: response.status,
    } as any;
  }

  async findByIds(ids: string[]): Promise<Topic[]> {
    const response: any = await firstValueFrom(
      this.topicService.FindByIds({ ids }),
    );
    if (!response || !response.topics) {
      return [];
    }
    return response.topics.map((t: any) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      postCount: t.postCount,
      status: t.status,
    })) as any[];
  }
}

@Injectable()
export class InteractionGrpcAdapter
  implements IPostLikedRpc, IPostSavedRpc, OnModuleInit
{
  private interactionService: InteractionServiceGrpc;

  constructor(@Inject("INTERACTION_SERVICE") private client: ClientGrpc) {}

  onModuleInit() {
    this.interactionService =
      this.client.getService<InteractionServiceGrpc>("InteractionService");
  }

  async hasLiked(userId: string, postId: string): Promise<boolean> {
    const response: any = await firstValueFrom(
      this.interactionService.HasLiked({ userId, postId }),
    );
    return response.liked;
  }

  async listPostIdsLiked(userId: string, postIds: string[]): Promise<string[]> {
    const response: any = await firstValueFrom(
      this.interactionService.ListPostIdsLiked({ userId, postIds }),
    );
    return response.postIds || [];
  }

  async hasSaved(userId: string, postId: string): Promise<boolean> {
    const response: any = await firstValueFrom(
      this.interactionService.HasSaved({ userId, postId }),
    );
    return response.saved;
  }

  async listPostIdsSaved(userId: string, postIds: string[]): Promise<string[]> {
    const response: any = await firstValueFrom(
      this.interactionService.ListPostIdsSaved({ userId, postIds }),
    );
    return response.postIds || [];
  }
}
