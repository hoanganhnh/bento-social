import { TokenPayload, Requester } from '@bento/shared';
import {
  UserLoginDTO,
  UserRegistrationDTO,
  UserUpdateDTO,
  UserUpdateProfileDTO,
  UserCondDTO,
} from './auth.dto';
import { User } from './user.model';

export interface IAuthService {
  register(dto: UserRegistrationDTO): Promise<string>;
  login(dto: UserLoginDTO): Promise<string>;
  profile(userId: string): Promise<Omit<User, 'password' | 'salt'>>;
  updateProfile(userId: string, dto: UserUpdateProfileDTO): Promise<void>;
  introspectToken(token: string): Promise<TokenPayload>;
}

export interface IUserRepository {
  // Query
  get(id: string): Promise<User | null>;
  findByCond(cond: UserCondDTO): Promise<User | null>;
  listByIds(ids: string[]): Promise<User[]>;
  // Command
  insert(user: User): Promise<void>;
  update(id: string, dto: UserUpdateDTO): Promise<void>;
  delete(id: string, isHard: boolean): Promise<void>;
}

export interface ITokenProvider {
  generateToken(payload: TokenPayload): Promise<string>;
  verifyToken(token: string): Promise<TokenPayload | null>;
}


