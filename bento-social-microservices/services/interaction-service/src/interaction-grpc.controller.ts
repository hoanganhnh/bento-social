import { Controller, Inject } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { IPostLikeRepository } from "./post-like/post-like.port";
import { IPostSaveRepository } from "./post-save/post-save.port";
import { POST_LIKE_REPOSITORY } from "./post-like/post-like.di-token";
import { POST_SAVE_REPOSITORY } from "./post-save/post-save.di-token";

@Controller()
export class InteractionGrpcController {
  constructor(
    @Inject(POST_LIKE_REPOSITORY)
    private readonly postLikeRepository: IPostLikeRepository,
    @Inject(POST_SAVE_REPOSITORY)
    private readonly postSaveRepository: IPostSaveRepository,
  ) {}

  @GrpcMethod("InteractionService", "HasLiked")
  async hasLiked(data: {
    userId: string;
    postId: string;
  }): Promise<{ liked: boolean }> {
    const like = await this.postLikeRepository.get({
      userId: data.userId,
      postId: data.postId,
    });
    return { liked: !!like };
  }

  @GrpcMethod("InteractionService", "ListPostIdsLiked")
  async listPostIdsLiked(data: {
    userId: string;
    postIds: string[];
  }): Promise<{ postIds: string[] }> {
    if (!data.postIds || data.postIds.length === 0) {
      return { postIds: [] };
    }

    const likedPostIds = await this.postLikeRepository.listPostIdsLiked(
      data.userId,
      data.postIds,
    );
    return { postIds: likedPostIds };
  }

  @GrpcMethod("InteractionService", "HasSaved")
  async hasSaved(data: {
    userId: string;
    postId: string;
  }): Promise<{ saved: boolean }> {
    const save = await this.postSaveRepository.get({
      userId: data.userId,
      postId: data.postId,
    });
    return { saved: !!save };
  }

  @GrpcMethod("InteractionService", "ListPostIdsSaved")
  async listPostIdsSaved(data: {
    userId: string;
    postIds: string[];
  }): Promise<{ postIds: string[] }> {
    if (!data.postIds || data.postIds.length === 0) {
      return { postIds: [] };
    }

    const savedPostIds = await this.postSaveRepository.listPostIdsSaved(
      data.userId,
      data.postIds,
    );
    return { postIds: savedPostIds };
  }
}
