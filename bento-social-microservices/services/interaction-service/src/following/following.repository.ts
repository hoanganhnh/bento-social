import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Paginated, PagingDTO } from '@bento/shared';
import { Follow, FollowCondDTO, FollowDTO } from './following.model';
import { IFollowingRepository } from './following.port';

@Injectable()
export class FollowingRepository implements IFollowingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async insert(follow: Follow): Promise<boolean> {
    await this.prisma.follower.create({
      data: {
        followerId: follow.followerId,
        followingId: follow.followingId,
        createdAt: follow.createdAt,
      },
    });

    return true;
  }

  async delete(follow: FollowDTO): Promise<boolean> {
    await this.prisma.follower.delete({
      where: {
        followingId_followerId: {
          followerId: follow.followerId,
          followingId: follow.followingId,
        },
      },
    });

    return true;
  }

  async find(cond: FollowDTO): Promise<Follow | null> {
    const result = await this.prisma.follower.findFirst({
      where: {
        followerId: cond.followerId,
        followingId: cond.followingId,
      },
    });

    if (!result) return null;

    return {
      followerId: result.followerId,
      followingId: result.followingId,
      createdAt: result.createdAt,
    };
  }

  async whoAmIFollowing(followingId: string, ids: string[]): Promise<Follow[]> {
    const result = await this.prisma.follower.findMany({
      where: {
        followingId: {
          in: ids,
        },
        followerId: followingId,
      },
    });

    return result.map((item) => ({
      followerId: item.followerId,
      followingId: item.followingId,
      createdAt: item.createdAt,
    }));
  }

  async list(cond: FollowCondDTO, paging: PagingDTO): Promise<Paginated<Follow>> {
    const count = await this.prisma.follower.count({
      where: cond,
    });

    const skip = (paging.page - 1) * paging.limit;
    const result = await this.prisma.follower.findMany({
      where: cond,
      skip,
      take: paging.limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      data: result.map((item) => ({
        followerId: item.followerId,
        followingId: item.followingId,
        createdAt: item.createdAt,
      })),
      paging,
      total: count,
    };
  }
}


