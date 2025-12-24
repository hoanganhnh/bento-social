import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Paginated, PagingDTO } from '@bento/shared';
import { ActionDTO, PostLike } from './post-like.model';
import { IPostLikeRepository } from './post-like.port';

@Injectable()
export class PostLikeRepository implements IPostLikeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async get(data: ActionDTO): Promise<PostLike | null> {
    const result = await this.prisma.postLike.findFirst({
      where: {
        postId: data.postId,
        userId: data.userId,
      },
    });

    if (!result) {
      return null;
    }

    return {
      postId: result.postId,
      userId: result.userId,
      createdAt: result.createdAt,
    };
  }

  async insert(data: PostLike): Promise<void> {
    await this.prisma.postLike.create({
      data: {
        postId: data.postId,
        userId: data.userId,
        createdAt: data.createdAt,
      },
    });
  }

  async delete(data: ActionDTO): Promise<void> {
    await this.prisma.postLike.delete({
      where: {
        postId_userId: {
          postId: data.postId,
          userId: data.userId,
        },
      },
    });
  }

  async list(postId: string, paging: PagingDTO): Promise<Paginated<PostLike>> {
    const total = await this.prisma.postLike.count({
      where: { postId },
    });

    const skip = (paging.page - 1) * paging.limit;

    const items = await this.prisma.postLike.findMany({
      where: { postId },
      take: paging.limit,
      skip,
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: items.map((item) => ({
        postId: item.postId,
        userId: item.userId,
        createdAt: item.createdAt,
      })),
      paging,
      total,
    };
  }

  async listPostIdsLiked(userId: string, postIds: string[]): Promise<Array<string>> {
    const result = await this.prisma.postLike.findMany({
      where: {
        userId,
        postId: { in: postIds },
      },
    });

    return result.map((item) => item.postId);
  }
}


