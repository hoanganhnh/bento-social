import { Inject, Injectable } from '@nestjs/common';
import { AppError, ErrNotFound, RedisClient, PostLikedEvent, PostUnlikedEvent } from '@bento/shared';
import { POST_LIKE_REPOSITORY, POST_QUERY_RPC } from './post-like.di-token';
import {
  ActionDTO,
  actionDTOSchema,
  ErrPostAlreadyLiked,
  ErrPostHasNotLiked,
  PostLike,
} from './post-like.model';
import { IPostLikeRepository, IPostLikeService, IPostQueryRpc } from './post-like.port';

@Injectable()
export class PostLikeService implements IPostLikeService {
  constructor(
    @Inject(POST_LIKE_REPOSITORY)
    private readonly repo: IPostLikeRepository,
    @Inject(POST_QUERY_RPC)
    private readonly postRpc: IPostQueryRpc,
  ) {}

  async like(data: ActionDTO): Promise<boolean> {
    const parseData = actionDTOSchema.parse(data);

    const postExist = await this.postRpc.existed(parseData.postId);
    if (!postExist) {
      throw ErrNotFound;
    }

    const existed = await this.repo.get(parseData);
    if (existed) {
      throw AppError.from(ErrPostAlreadyLiked, 400);
    }

    const newLike: PostLike = {
      ...parseData,
      createdAt: new Date(),
    };

    await this.repo.insert(newLike);

    // Publish event
    if (RedisClient.isInitialized()) {
      await RedisClient.getInstance().publish(
        PostLikedEvent.create({ postId: parseData.postId }, parseData.userId)
      );
    }

    return true;
  }

  async unlike(data: ActionDTO): Promise<boolean> {
    const parseData = actionDTOSchema.parse(data);

    const postExist = await this.postRpc.existed(parseData.postId);
    if (!postExist) {
      throw ErrNotFound;
    }

    const existed = await this.repo.get(parseData);
    if (!existed) {
      throw AppError.from(ErrPostHasNotLiked, 400);
    }

    await this.repo.delete(parseData);

    // Publish event
    if (RedisClient.isInitialized()) {
      await RedisClient.getInstance().publish(
        PostUnlikedEvent.create({ postId: parseData.postId }, parseData.userId)
      );
    }

    return true;
  }
}


