import { Inject, Injectable } from '@nestjs/common';
import { v7 } from 'uuid';
import {
  AppError,
  ErrNotFound,
  IAuthorRpc,
  IPostRpc,
  Paginated,
  PagingDTO,
  pagingDTOSchema,
  PublicUser,
  Requester,
  RedisClient,
  PostCommentedEvent,
  PostCommentDeletedEvent,
  POST_RPC,
  USER_RPC,
} from '@bento/shared';
import { COMMENT_REPOSITORY } from './comment.di-token';
import { ICommentRepository, ICommentService } from './comment.port';
import {
  Comment,
  CommentCondDTO,
  CommentCreateDTO,
  commentCreateDTOSchema,
  CommentStatus,
  CommentUpdateDTO,
  ErrInvalidParentId,
  ErrPostNotFound,
} from './comment.model';

@Injectable()
export class CommentService implements ICommentService {
  constructor(
    @Inject(COMMENT_REPOSITORY) private readonly repository: ICommentRepository,
    @Inject(POST_RPC) private readonly postRpc: IPostRpc,
    @Inject(USER_RPC) private readonly userRpc: IAuthorRpc,
  ) {}

  async create(dto: CommentCreateDTO): Promise<string> {
    const data = commentCreateDTOSchema.parse(dto);

    const postExist = await this.postRpc.findById(data.postId);

    if (!postExist) {
      throw AppError.from(ErrPostNotFound, 404);
    }

    let authorIdOfParentComment: string | null = null;

    if (data.parentId) {
      const parentComment = await this.repository.findById(data.parentId);
      if (!parentComment) throw AppError.from(ErrInvalidParentId, 400);
      // cannot reply to a replied comment
      if (parentComment.parentId) throw AppError.from(ErrInvalidParentId, 400);

      authorIdOfParentComment = parentComment.userId;
    }

    const newId = v7();

    const model: Comment = {
      id: newId,
      userId: data.userId,
      postId: data.postId,
      parentId: data.parentId ?? null,
      content: data.content,
      status: CommentStatus.APPROVED,
      replyCount: 0,
      likedCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.repository.insert(model);

    // Publish event
    if (RedisClient.isInitialized()) {
      await RedisClient.getInstance().publish(
        PostCommentedEvent.create({ postId: data.postId, authorIdOfParentComment }, data.userId)
      );
    }

    return newId;
  }

  async update(id: string, requester: Requester, dto: CommentUpdateDTO): Promise<boolean> {
    const oldData = await this.repository.findById(id);
    if (!oldData || oldData.status === CommentStatus.DELETED || oldData.userId !== requester.sub) {
      throw ErrNotFound;
    }

    const updateDTO: CommentUpdateDTO = {
      content: dto.content,
    };

    await this.repository.update(id, updateDTO);
    return true;
  }

  async delete(id: string, requester: Requester): Promise<boolean> {
    const oldData = await this.repository.findById(id);
    if (!oldData || oldData.status === CommentStatus.DELETED || oldData.userId !== requester.sub) {
      throw ErrNotFound;
    }

    await this.repository.delete(id);

    // Publish event
    if (RedisClient.isInitialized()) {
      await RedisClient.getInstance().publish(
        PostCommentDeletedEvent.create({ postId: oldData.postId }, oldData.userId)
      );
    }

    return true;
  }

  async findById(id: string): Promise<Comment | null> {
    const data = await this.repository.findById(id);
    if (!data || data.status === CommentStatus.DELETED) return null;

    return data;
  }

  async list(dto: CommentCondDTO, paging: PagingDTO): Promise<Paginated<Comment>> {
    paging = pagingDTOSchema.parse(paging);
    const result = await this.repository.list(dto, paging);

    const commentIds = result.data.map((item) => item.id);
    if (commentIds.length === 0) {
      return result;
    }

    // Get replies for each comment (max 3)
    const replies = await this.repository.findByIds(commentIds, 'parent_id', 3);
    const repliesMap: Record<string, Comment[]> = {};
    replies.forEach((reply) => {
      if (!repliesMap[reply.parentId!]) {
        repliesMap[reply.parentId!] = [];
      }
      repliesMap[reply.parentId!].push(reply);
    });

    // Get all user IDs and fetch user info
    const userIds = [
      ...new Set([...result.data.map((item) => item.userId), ...replies.map((reply) => reply.userId)]),
    ];
    const users = await this.userRpc.findByIds(userIds);
    const userMap: Record<string, PublicUser> = {};
    users.forEach((user) => {
      userMap[user.id] = user;
    });

    // Enrich comments with user info and replies
    const finalResult = result.data.map((item) => ({
      ...item,
      user: userMap[item.userId],
      children: (repliesMap[item.id] || []).map((reply) => ({
        ...reply,
        user: userMap[reply.userId],
      })),
    }));

    return {
      ...result,
      data: finalResult,
    };
  }
}

