import { Post } from '../dto/data-model';
import { IPostRpc } from '../interfaces/rpc.interface';
import { BaseRpcClient } from './base-rpc.client';

export class PostRpcClient extends BaseRpcClient implements IPostRpc {
  constructor(baseUrl: string) {
    super(baseUrl);
  }

  async findById(id: string): Promise<Post | null> {
    try {
      return await this.get<Post>(`/posts/rpc/posts/${id}`);
    } catch {
      return null;
    }
  }

  async findByIds(ids: string[]): Promise<Post[]> {
    if (ids.length === 0) return [];
    try {
      return await this.post<Post[]>('/posts/rpc/posts/list-by-ids', { ids });
    } catch {
      return [];
    }
  }
}

