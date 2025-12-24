import { Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  ErrNotFound,
  IAuthorRpc,
  Paginated,
  PagingDTO,
  pagingDTOSchema,
  RedisClient,
  FollowedEvent,
  UnfollowedEvent,
  USER_RPC,
} from '@bento/shared';
import { FOLLOWING_REPOSITORY } from './following.di-token';
import {
  ErrAlreadyFollowed,
  ErrFollowNotFound,
  ErrFollowYourself,
  Follow,
  FollowDTO,
  followDTOSchema,
  Follower,
} from './following.model';
import { IFollowingRepository, IFollowingService } from './following.port';

@Injectable()
export class FollowingService implements IFollowingService {
  constructor(
    @Inject(FOLLOWING_REPOSITORY)
    private readonly repository: IFollowingRepository,
    @Inject(USER_RPC)
    private readonly userRpc: IAuthorRpc,
  ) {}

  async hasFollowed(followerId: string, followingId: string): Promise<boolean> {
    try {
      const existing = await this.repository.find({ followerId, followingId });
      return existing !== null;
    } catch (e) {
      return false;
    }
  }

  async follow(follow: FollowDTO): Promise<boolean> {
    const data = followDTOSchema.parse(follow);
    if (data.followerId === data.followingId) {
      throw AppError.from(ErrFollowYourself, 400);
    }

    const following = await this.userRpc.findById(data.followingId);
    if (!following) {
      throw ErrNotFound;
    }

    const existing = await this.repository.find(data);
    if (existing) {
      throw AppError.from(ErrAlreadyFollowed, 400);
    }

    const model: Follow = {
      ...data,
      createdAt: new Date(),
    };

    const ok = await this.repository.insert(model);

    // Publish event
    if (RedisClient.isInitialized()) {
      await RedisClient.getInstance().publish(
        FollowedEvent.create({ followingId: data.followingId }, data.followerId)
      );
    }

    return ok;
  }

  async unfollow(follow: FollowDTO): Promise<boolean> {
    const data = followDTOSchema.parse(follow);

    const existing = await this.repository.find(data);
    if (!existing) {
      throw AppError.from(ErrFollowNotFound, 404);
    }

    const ok = await this.repository.delete(existing);

    // Publish event
    if (RedisClient.isInitialized()) {
      await RedisClient.getInstance().publish(
        UnfollowedEvent.create({ followingId: data.followingId }, data.followerId)
      );
    }

    return ok;
  }

  async listFollowers(userId: string, paging: PagingDTO): Promise<Paginated<Follower>> {
    paging = pagingDTOSchema.parse(paging);
    const result = await this.repository.list({ followingId: userId }, paging);

    if (!result.data.length) {
      return {
        data: [],
        paging,
        total: 0,
      };
    }

    // Map public user
    const followerIds = result.data.map((f) => f.followerId);
    const followDataMap = new Map<string, Follow>();
    result.data.forEach((f) => followDataMap.set(f.followerId, f));

    const users = await this.userRpc.findByIds(followerIds);
    const userMap = new Map<string, Follower>();
    users.forEach((user) =>
      userMap.set(user.id, {
        ...user,
        followedAt: followDataMap.get(user.id)!.createdAt,
        hasFollowedBack: false,
      })
    );

    // Map hasFollowed logic
    const hasFollowedData = await this.repository.whoAmIFollowing(userId, followerIds);

    hasFollowedData.forEach((f) => {
      const follower = userMap.get(f.followingId);
      if (follower) {
        follower.hasFollowedBack = true;
      }
    });

    const followers = result.data.map((item) => userMap.get(item.followerId)!).filter(Boolean);

    return {
      data: followers,
      paging,
      total: result.total,
    };
  }

  async listFollowings(userId: string, paging: PagingDTO): Promise<Paginated<Follower>> {
    const result = await this.repository.list({ followerId: userId }, paging);

    if (!result.data.length) {
      return {
        data: [],
        paging,
        total: 0,
      };
    }

    // Map public user
    const followingIds = result.data.map((f) => f.followingId);
    const followDataMap = new Map<string, Follow>();
    result.data.forEach((f) => followDataMap.set(f.followingId, f));

    const users = await this.userRpc.findByIds(followingIds);
    const userMap = new Map<string, Follower>();
    users.forEach((user) =>
      userMap.set(user.id, {
        ...user,
        followedAt: followDataMap.get(user.id)!.createdAt,
        hasFollowedBack: true,
      })
    );

    const followings = result.data.map((item) => userMap.get(item.followingId)!).filter(Boolean);

    return {
      data: followings,
      paging,
      total: result.total,
    };
  }
}


