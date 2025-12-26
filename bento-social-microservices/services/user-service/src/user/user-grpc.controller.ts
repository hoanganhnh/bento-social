import { Controller, Inject } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { IUserRepository } from './user.port';
import { USER_REPOSITORY } from './user.di-token';
import { PublicUser, User } from './user.model';

/**
 * gRPC Controller for User Service
 * Handles inter-service communication via gRPC protocol
 */
@Controller()
export class UserGrpcController {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  /**
   * gRPC method: FindById
   * Returns a single user by ID
   */
  @GrpcMethod('UserService', 'FindById')
  async findById(data: { id: string }): Promise<any> {
    const user = await this.userRepository.get(data.id);

    if (!user) {
      return {
        id: '',
        username: '',
        firstName: '',
        lastName: '',
        avatar: '',
        cover: '',
        bio: '',
        websiteUrl: '',
        followerCount: 0,
        postCount: 0,
        role: '',
        status: '',
      };
    }

    return this._toGrpcUser(user);
  }

  /**
   * gRPC method: FindByIds
   * Returns multiple users by their IDs
   */
  @GrpcMethod('UserService', 'FindByIds')
  async findByIds(data: { ids: string[] }): Promise<{ users: any[] }> {
    if (!data.ids || !Array.isArray(data.ids) || data.ids.length === 0) {
      return { users: [] };
    }

    const users = await this.userRepository.listByIds(data.ids);
    return {
      users: users.map((user) => this._toGrpcUser(user)),
    };
  }

  /**
   * Convert internal User model to gRPC UserResponse format
   * Removes sensitive fields like password and salt
   */
  private _toGrpcUser(user: User): any {
    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar || '',
      cover: user.cover || '',
      bio: user.bio || '',
      websiteUrl: user.websiteUrl || '',
      followerCount: user.followerCount || 0,
      postCount: user.postCount || 0,
      role: user.role,
      status: user.status,
    };
  }
}
