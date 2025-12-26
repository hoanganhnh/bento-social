import { Post, PublicUser, Topic } from '../dto/data-model';

export interface IPostRpc {
  findById(id: string): Promise<Post | null>;
  findByIds(ids: Array<string>): Promise<Array<Post>>;
}

export interface IAuthorRpc {
  findById(id: string): Promise<PublicUser | null>;
  findByIds(ids: Array<string>): Promise<Array<PublicUser>>;
}

export interface ITopicRpc {
  findById(id: string): Promise<Topic | null>;
  findByIds(ids: Array<string>): Promise<Array<Topic>>;
}

export interface IPublicUserRpc extends IAuthorRpc {}

export interface IPostLikedRpc {
  hasLiked(userId: string, postId: string): Promise<boolean>;
  listPostIdsLiked(userId: string, postIds: string[]): Promise<Array<string>>;
}

export interface IPostSavedRpc {
  hasSaved(userId: string, postId: string): Promise<boolean>;
  listPostIdsSaved(userId: string, postIds: string[]): Promise<Array<string>>;
}


