import { Inject, Injectable, Logger } from '@nestjs/common';
import { Requester, UserRole } from '@bento/shared';
import { IUserRepository, IUserService } from './user.port';
import { User, PublicUser, ErrUserNotFound, ErrForbidden } from './user.model';
import { UserUpdateDTO } from './user.dto';
import { USER_REPOSITORY } from './user.di-token';

@Injectable()
export class UserService implements IUserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async getUser(id: string): Promise<PublicUser | null> {
    const user = await this.userRepository.get(id);
    if (!user) return null;
    return this._toPublicUser(user);
  }

  async getSuggestedUsers(currentUserId: string, limit: number): Promise<PublicUser[]> {
    const users = await this.userRepository.getSuggestedUsers(currentUserId, limit);
    return users.map(this._toPublicUser);
  }

  async updateUser(requester: Requester, userId: string, dto: UserUpdateDTO): Promise<void> {
    // Check permission: user can only update own profile, admin can update any
    if (requester.sub !== userId && requester.role !== UserRole.ADMIN) {
      throw ErrForbidden;
    }

    const user = await this.userRepository.get(userId);
    if (!user) {
      throw ErrUserNotFound;
    }

    // Non-admin cannot change role or status
    if (requester.role !== UserRole.ADMIN) {
      delete dto.role;
      delete dto.status;
    }

    await this.userRepository.update(userId, dto);
    this.logger.log(`User ${userId} updated by ${requester.sub}`);
  }

  async deleteUser(requester: Requester, userId: string): Promise<void> {
    // Check permission: user can only delete own profile, admin can delete any
    if (requester.sub !== userId && requester.role !== UserRole.ADMIN) {
      throw ErrForbidden;
    }

    const user = await this.userRepository.get(userId);
    if (!user) {
      throw ErrUserNotFound;
    }

    // Soft delete by default, only admin can hard delete
    const isHardDelete = requester.role === UserRole.ADMIN && requester.sub !== userId;
    await this.userRepository.delete(userId, isHardDelete);
    this.logger.log(`User ${userId} deleted (hard: ${isHardDelete}) by ${requester.sub}`);
  }

  private _toPublicUser(user: User): PublicUser {
    const { password, salt, ...publicUser } = user;
    return publicUser;
  }
}


