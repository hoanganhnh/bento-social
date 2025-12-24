import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { PublicUser } from '../data-model';
import { IAuthorRpc } from '../interface';

@Injectable()
export class UserRPCClient implements IAuthorRpc {
  constructor(private readonly userServiceUrl: string) {}

  async findById(id: string): Promise<PublicUser | null> {
    try {
      const { data } = await axios.get(
        `${this.userServiceUrl}/rpc/users/${id}`,
      );
      const user = data.data;
      return {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
      } as PublicUser;
    } catch (error) {
      console.error('UserRPCClient.findById error:', error);
      return null;
    }
  }

  async findByIds(ids: Array<string>): Promise<Array<PublicUser>> {
    try {
      const { data } = await axios.post(
        `${this.userServiceUrl}/rpc/users/list-by-ids`,
        { ids },
      );
      return data.data.map((user: any) => ({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
      })) as PublicUser[];
    } catch (error) {
      console.error('UserRPCClient.findByIds error:', error);
      return [];
    }
  }
}
