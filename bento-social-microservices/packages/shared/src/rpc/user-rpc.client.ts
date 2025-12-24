import { PublicUser } from '../dto/data-model';
import { IAuthorRpc } from '../interfaces/rpc.interface';
import { BaseRpcClient } from './base-rpc.client';

export class UserRpcClient extends BaseRpcClient implements IAuthorRpc {
  constructor(baseUrl: string) {
    super(baseUrl);
  }

  async findById(id: string): Promise<PublicUser | null> {
    try {
      return await this.get<PublicUser>(`/rpc/users/${id}`);
    } catch {
      return null;
    }
  }

  async findByIds(ids: string[]): Promise<PublicUser[]> {
    if (ids.length === 0) return [];
    try {
      return await this.post<PublicUser[]>('/rpc/users/by-ids', { ids });
    } catch {
      return [];
    }
  }
}

