import { Injectable, Logger } from '@nestjs/common';
import { Post as PostPrisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { IPostRepository } from './post.port';
import { Post, PostType } from './post.model';
import { PostCondDTO, UpdatePostDTO } from './post.dto';
import { Paginated, PagingDTO } from '@bento/shared';

@Injectable()
export class PostRepository implements IPostRepository {
  private readonly logger = new Logger(PostRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async get(id: string): Promise<Post | null> {
    const result = await this.prisma.post.findFirst({ where: { id } });
    if (!result) return null;
    return this._toModel(result);
  }

  async list(cond: PostCondDTO, paging: PagingDTO): Promise<Paginated<Post>> {
    const { str, userId, topicId, ...rest } = cond;

    let where: any = { ...rest };

    if (userId) {
      where.authorId = userId;
    }

    if (topicId) {
      where.topicId = topicId;
    }

    if (str) {
      where.content = { contains: str, mode: 'insensitive' };
    }

    const total = await this.prisma.post.count({ where });
    const skip = (paging.page - 1) * paging.limit;

    const result = await this.prisma.post.findMany({
      where,
      take: paging.limit,
      skip,
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: result.map(this._toModel),
      paging,
      total,
    };
  }

  async listByIds(ids: string[]): Promise<Post[]> {
    const result = await this.prisma.post.findMany({
      where: { id: { in: ids } },
    });
    return result.map(this._toModel);
  }

  async insert(post: Post): Promise<void> {
    await this.prisma.post.create({
      data: {
        id: post.id,
        content: post.content,
        image: post.image || null,
        authorId: post.authorId,
        topicId: post.topicId,
        isFeatured: post.isFeatured,
        commentCount: post.commentCount,
        likedCount: post.likedCount,
        type: post.type,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      },
    });
  }

  async update(id: string, dto: UpdatePostDTO): Promise<void> {
    await this.prisma.post.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.post.delete({ where: { id } });
  }

  async incrementCount(id: string, field: string, step: number): Promise<void> {
    try {
      await this.prisma.post.update({
        where: { id },
        data: { [field]: { increment: step } },
      });
    } catch (error) {
      this.logger.error(`Failed to increment ${field} for post ${id}: ${error}`);
    }
  }

  async decrementCount(id: string, field: string, step: number): Promise<void> {
    try {
      await this.prisma.post.update({
        where: { id },
        data: { [field]: { decrement: step } },
      });
    } catch (error) {
      this.logger.error(`Failed to decrement ${field} for post ${id}: ${error}`);
    }
  }

  private _toModel(data: PostPrisma): Post {
    return {
      ...data,
      image: data.image ?? '',
      isFeatured: data.isFeatured ?? false,
      commentCount: data.commentCount ?? 0,
      likedCount: data.likedCount ?? 0,
      type: (data.type as PostType) ?? PostType.TEXT,
    } as Post;
  }
}

