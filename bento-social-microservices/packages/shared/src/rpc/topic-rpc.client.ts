import { Topic } from '../dto/data-model';
import { ITopicRpc } from '../interfaces/rpc.interface';
import { BaseRpcClient } from './base-rpc.client';

export class TopicRpcClient extends BaseRpcClient implements ITopicRpc {
  constructor(baseUrl: string) {
    super(baseUrl);
  }

  async findById(id: string): Promise<Topic | null> {
    try {
      return await this.get<Topic>(`/rpc/topics/${id}`);
    } catch {
      return null;
    }
  }

  async findByIds(ids: string[]): Promise<Topic[]> {
    if (ids.length === 0) return [];
    try {
      return await this.post<Topic[]>('/rpc/topics/list-by-ids', { ids });
    } catch {
      return [];
    }
  }
}

