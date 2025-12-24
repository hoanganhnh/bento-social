import { IPostLikedRpc, IPostSavedRpc } from '../interfaces/rpc.interface';
import { BaseRpcClient } from './base-rpc.client';

export class PostLikedRpcClient extends BaseRpcClient implements IPostLikedRpc {
  constructor(baseUrl: string) {
    super(baseUrl);
  }

  async hasLiked(userId: string, postId: string): Promise<boolean> {
    try {
      return await this.post<boolean>('/rpc/has-liked', { userId, postId });
    } catch {
      return false;
    }
  }

  async listPostIdsLiked(userId: string, postIds: string[]): Promise<string[]> {
    if (postIds.length === 0) return [];
    try {
      return await this.post<string[]>('/rpc/list-post-ids-liked', { userId, postIds });
    } catch {
      return [];
    }
  }
}

export class PostSavedRpcClient extends BaseRpcClient implements IPostSavedRpc {
  constructor(baseUrl: string) {
    super(baseUrl);
  }

  async hasSaved(userId: string, postId: string): Promise<boolean> {
    try {
      return await this.post<boolean>('/rpc/has-saved', { userId, postId });
    } catch {
      return false;
    }
  }

  async listPostIdsSaved(userId: string, postIds: string[]): Promise<string[]> {
    if (postIds.length === 0) return [];
    try {
      return await this.post<string[]>('/rpc/list-post-ids-saved', { userId, postIds });
    } catch {
      return [];
    }
  }
}

