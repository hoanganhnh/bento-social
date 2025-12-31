import { Requester } from '@bento/shared';
import { UserCondDTO, UserUpdateDTO } from './user.dto';
import { User, PublicUser } from './user.model';

export interface IUserService {
  getUser(id: string): Promise<PublicUser | null>;
  getSuggestedUsers(currentUserId: string, limit: number): Promise<PublicUser[]>;
  updateUser(requester: Requester, userId: string, dto: UserUpdateDTO): Promise<void>;
  deleteUser(requester: Requester, userId: string): Promise<void>;
}

export interface IUserRepository {
  // Query
  get(id: string): Promise<User | null>;
  findByCond(cond: UserCondDTO): Promise<User | null>;
  listByIds(ids: string[]): Promise<User[]>;
  getSuggestedUsers(currentUserId: string, limit: number): Promise<User[]>;
  // Command
  update(id: string, dto: UserUpdateDTO): Promise<void>;
  delete(id: string, isHard: boolean): Promise<void>;
}


