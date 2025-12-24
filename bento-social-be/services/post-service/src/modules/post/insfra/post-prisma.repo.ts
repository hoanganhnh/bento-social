import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Paginated, PagingDTO } from 'src/share/data-model';
import { IPostRepository } from '../post.port';
import { Post, PostCondDTO, UpdatePostDTO } from '../model';

@Injectable()
export class PostPrismaRepository implements IPostRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async get(id: string): Promise<Post | null> {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) return null;
    return this.toModel(post);
  }

  async list(cond: PostCondDTO, paging: PagingDTO): Promise<Paginated<Post>> {
    const where: any = {};
    if (cond.topicId) where.topicId = cond.topicId;
    if (cond.userId) where.authorId = cond.userId;
    if (cond.isFeatured !== undefined) where.isFeatured = cond.isFeatured;
    if (cond.str) {
      where.content = { contains: cond.str, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip: (paging.page - 1) * paging.limit,
        take: paging.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      data: data.map(this.toModel),
      paging: { ...paging, total },
      total,
    };
  }

  async listByIds(ids: string[]): Promise<Post[]> {
    const posts = await this.prisma.post.findMany({
      where: { id: { in: ids } },
    });
    return posts.map(this.toModel);
  }

  async insert(dto: Post): Promise<void> {
    await this.prisma.post.create({
      data: {
        id: dto.id,
        content: dto.content,
        image: dto.image,
        authorId: dto.authorId,
        topicId: dto.topicId,
        isFeatured: dto.isFeatured,
        commentCount: dto.commentCount,
        likedCount: dto.likedCount,
        type: dto.type,
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
      },
    });
  }

  async update(id: string, dto: UpdatePostDTO): Promise<void> {
    await this.prisma.post.update({
      where: { id },
      data: dto as any,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.post.delete({ where: { id } });
  }

  async increaseCount(id: string, field: string, step: number): Promise<void> {
    await this.prisma.post.update({
      where: { id },
      data: { [field]: { increment: step } },
    });
  }

  async decreaseCount(id: string, field: string, step: number): Promise<void> {
    await this.prisma.post.update({
      where: { id },
      data: { [field]: { decrement: step } },
    });
  }

  private toModel(data: any): Post {
    return {
      id: data.id,
      content: data.content,
      image: data.image,
      authorId: data.authorId,
      topicId: data.topicId,
      isFeatured: data.isFeatured,
      commentCount: data.commentCount ?? 0,
      likedCount: data.likedCount ?? 0,
      type: data.type,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
