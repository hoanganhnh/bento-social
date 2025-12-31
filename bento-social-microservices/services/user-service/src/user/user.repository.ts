import { Injectable } from '@nestjs/common';
import { User as UserPrisma } from '@generated/user-client';
import { PrismaService } from '../prisma/prisma.service';
import { IUserRepository } from './user.port';
import { User, Status } from './user.model';
import { UserCondDTO, UserUpdateDTO } from './user.dto';
import { UserRole } from '@bento/shared';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async get(id: string): Promise<User | null> {
    const data = await this.prisma.user.findUnique({ where: { id } });
    if (!data) return null;
    return this._toModel(data);
  }

  async findByCond(cond: UserCondDTO): Promise<User | null> {
    const data = await this.prisma.user.findFirst({ where: cond });
    if (!data) return null;
    return this._toModel(data);
  }

  async listByIds(ids: string[]): Promise<User[]> {
    const data = await this.prisma.user.findMany({
      where: { id: { in: ids } },
    });
    return data.map(this._toModel);
  }

  async getSuggestedUsers(
    currentUserId: string,
    limit: number,
  ): Promise<User[]> {
    try {
      // Get IDs of users the current user is already following
      const following = await this.prisma.follower.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true },
      });
      const followingIds = following.map((f) => f.followingId);

      // Get users not followed by current user (excluding self)
      const data = await this.prisma.user.findMany({
        where: {
          id: { notIn: [...followingIds, currentUserId] },
          status: 'active',
        },
        take: limit,
        orderBy: { followerCount: 'desc' },
      });

      return data.map(this._toModel);
    } catch {
      // Fallback if followers table doesn't exist yet
      const data = await this.prisma.user.findMany({
        where: {
          id: { not: currentUserId },
          status: 'active',
        },
        take: limit,
        orderBy: { followerCount: 'desc' },
      });
      return data.map(this._toModel);
    }
  }

  async update(id: string, dto: UserUpdateDTO): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: dto });
  }

  async delete(id: string, isHard: boolean): Promise<void> {
    if (isHard) {
      await this.prisma.user.delete({ where: { id } });
    } else {
      await this.prisma.user.update({
        where: { id },
        data: { status: Status.DELETED },
      });
    }
  }

  private _toModel(data: UserPrisma): User {
    return {
      ...data,
      role: data.role as UserRole,
      status: data.status as Status,
      followerCount: data.followerCount ?? 0,
      postCount: data.postCount ?? 0,
    } as User;
  }
}
