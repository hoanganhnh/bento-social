import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Paginated, PagingDTO } from '@bento/shared';
import { ActionDTO, PostSave } from './post-save.model';
import { IPostSaveRepository } from './post-save.port';

@Injectable()
export class PostSaveRepository implements IPostSaveRepository {
  constructor(private readonly prisma: PrismaService) {}

  async get(data: ActionDTO): Promise<PostSave | null> {
    const result = await this.prisma.postSave.findFirst({
      where: {
        postId: data.postId,
        userId: data.userId,
      },
    });

    if (!result) return null;

    return {
      userId: result.userId,
      postId: result.postId,
      createdAt: result.createdAt,
    };
  }

  async insert(data: PostSave): Promise<boolean> {
    await this.prisma.postSave.create({
      data: {
        userId: data.userId,
        postId: data.postId,
        createdAt: data.createdAt,
      },
    });

    return true;
  }

  async delete(data: ActionDTO): Promise<boolean> {
    await this.prisma.postSave.delete({
      where: {
        postId_userId: {
          postId: data.postId,
          userId: data.userId,
        },
      },
    });

    return true;
  }

  async list(userId: string, paging: PagingDTO): Promise<Paginated<PostSave>> {
    const condition = { userId };

    const total = await this.prisma.postSave.count({ where: condition });

    const skip = (paging.page - 1) * paging.limit;

    const result = await this.prisma.postSave.findMany({
      where: condition,
      take: paging.limit,
      skip,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      data: result.map((item) => ({
        userId: item.userId,
        postId: item.postId,
        createdAt: item.createdAt,
      })),
      paging,
      total,
    };
  }

  async listPostIdsSaved(userId: string, postIds: string[]): Promise<string[]> {
    const result = await this.prisma.postSave.findMany({
      where: {
        userId,
        postId: { in: postIds },
      },
    });

    return result.map((item) => item.postId);
  }
}


