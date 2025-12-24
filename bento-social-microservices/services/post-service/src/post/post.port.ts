import { Requester, Paginated, PagingDTO, PublicUser, Topic } from '@bento/shared';
import { CreatePostDTO, UpdatePostDTO, PostCondDTO } from './post.dto';
import { Post } from './post.model';

export interface IPostService {
  create(dto: CreatePostDTO): Promise<string>;
  update(id: string, dto: UpdatePostDTO, requester: Requester): Promise<boolean>;
  delete(id: string, requester: Requester): Promise<boolean>;
}

export interface IPostRepository {
  // Query
  get(id: string): Promise<Post | null>;
  list(cond: PostCondDTO, paging: PagingDTO): Promise<Paginated<Post>>;
  listByIds(ids: string[]): Promise<Post[]>;
  
  // Command
  insert(post: Post): Promise<void>;
  update(id: string, dto: UpdatePostDTO): Promise<void>;
  delete(id: string): Promise<void>;
  
  // Counters
  incrementCount(id: string, field: string, step: number): Promise<void>;
  decrementCount(id: string, field: string, step: number): Promise<void>;
}

export interface ITopicRpc {
  findById(id: string): Promise<Topic | null>;
  findByIds(ids: string[]): Promise<Topic[]>;
}

export interface IUserRpc {
  findById(id: string): Promise<PublicUser | null>;
  findByIds(ids: string[]): Promise<PublicUser[]>;
}

export interface IPostLikedRpc {
  hasLiked(userId: string, postId: string): Promise<boolean>;
  listPostIdsLiked(userId: string, postIds: string[]): Promise<string[]>;
}

export interface IPostSavedRpc {
  hasSaved(userId: string, postId: string): Promise<boolean>;
  listPostIdsSaved(userId: string, postIds: string[]): Promise<string[]>;
}

