import { Injectable } from "@nestjs/common";
import { Comment as CommentPrisma } from "@generated/comment-client";
import { ErrNotFound, Paginated, PagingDTO } from "@bento/shared";
import { PrismaService } from "../prisma/prisma.service";
import { ICommentRepository } from "./comment.port";
import {
  Comment,
  CommentCondDTO,
  CommentStatus,
  CommentUpdateDTO,
} from "./comment.model";

@Injectable()
export class CommentRepository implements ICommentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Comment | null> {
    const comment = await this.prisma.comment.findFirst({ where: { id } });
    if (!comment) return null;

    return this._toComment(comment);
  }

  async findByCond(cond: CommentCondDTO): Promise<Comment> {
    const conditions: Record<string, any> = {};
    if (cond.postId) {
      conditions.postId = cond.postId;
    }
    if (cond.parentId) {
      conditions.parentId = cond.parentId;
    }

    const comment = await this.prisma.comment.findFirst({ where: conditions });
    if (!comment) throw ErrNotFound;

    return this._toComment(comment);
  }

  async findByIds(
    ids: string[],
    field: string,
    limit?: number,
  ): Promise<Array<Comment>> {
    if (ids.length === 0) return [];

    const sql = ids
      .map(
        (id) =>
          `(SELECT * FROM comments WHERE ${field} = '${id}' ORDER BY id ASC LIMIT ${limit || 3})`,
      )
      .join(" UNION ");

    const replies = await this.prisma.$queryRawUnsafe<any[]>(sql);

    return replies.map((item) => ({
      id: item.id,
      userId: item.user_id,
      postId: item.post_id,
      parentId: item.parent_id,
      content: item.content,
      likedCount: item.liked_count,
      replyCount: item.reply_count,
      status: item.status as CommentStatus,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  }

  async list(
    dto: CommentCondDTO,
    paging: PagingDTO,
  ): Promise<Paginated<Comment>> {
    const conditions: Record<string, any> = {};
    if (dto.postId) {
      conditions.postId = dto.postId;
    }
    if (dto.parentId) {
      conditions.parentId = dto.parentId;
    } else {
      conditions.parentId = null;
    }

    const total = await this.prisma.comment.count({
      where: { ...conditions, status: { not: CommentStatus.DELETED } },
    });

    const skip = (paging.page - 1) * paging.limit;

    const result = await this.prisma.comment.findMany({
      where: conditions,
      take: paging.limit,
      skip,
      orderBy: {
        id: "asc",
      },
    });

    return {
      data: result.map((item) => this._toComment(item)),
      paging,
      total,
    };
  }

  async insert(dto: Comment): Promise<void> {
    await this.prisma.comment.create({
      data: {
        id: dto.id,
        userId: dto.userId,
        postId: dto.postId,
        parentId: dto.parentId || null,
        content: dto.content,
        likedCount: dto.likedCount,
        replyCount: dto.replyCount,
        status: dto.status,
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
      },
    });
  }

  async update(id: string, dto: CommentUpdateDTO): Promise<void> {
    await this.prisma.comment.update({
      where: { id },
      data: { content: dto.content, updatedAt: new Date() },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.comment.delete({ where: { id } });
  }

  async increaseLikeCount(
    id: string,
    field: string,
    step: number,
  ): Promise<void> {
    await this.prisma.comment.update({
      where: { id },
      data: { [field]: { increment: step } },
    });
  }

  async decreaseLikeCount(
    id: string,
    field: string,
    step: number,
  ): Promise<void> {
    await this.prisma.comment.update({
      where: { id },
      data: { [field]: { decrement: step } },
    });
  }

  private _toComment(data: CommentPrisma): Comment {
    return {
      id: data.id,
      userId: data.userId,
      postId: data.postId,
      parentId: data.parentId,
      content: data.content,
      likedCount: data.likedCount,
      replyCount: data.replyCount,
      status: data.status as CommentStatus,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt!,
    };
  }
}
