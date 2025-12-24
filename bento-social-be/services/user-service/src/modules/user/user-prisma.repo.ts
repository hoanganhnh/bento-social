import { Injectable } from '@nestjs/common';
import { User as UserPrisma } from '@prisma/client';
import { UserRole } from 'src/share';
import prisma from 'src/share/components/prisma';
import { UserCondDTO, UserUpdateDTO } from './user.dto';
import { Status, User } from './user.model';
import { IUserRepository } from './user.port';

@Injectable()
export class UserPrismaRepository implements IUserRepository {
  async get(id: string): Promise<User | null> {
    const data = await prisma.user.findUnique({ where: { id } });
    if (!data) return null;

    return this._toModel(data);
  }

  async findByCond(cond: UserCondDTO): Promise<User | null> {
    const data = await prisma.user.findFirst({ where: cond });
    if (!data) return null;

    return this._toModel(data);
  }

  async insert(user: User): Promise<void> {
    await prisma.user.create({
      data: {
        id: user.id,
        avatar: user.avatar,
        cover: user.cover,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        password: user.password,
        salt: user.salt,
        bio: user.bio,
        websiteUrl: user.websiteUrl,
        followerCount: user.followerCount,
        postCount: user.postCount,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        role: user.role as any,
        status: user.status as any,
      },
    });
  }

  async listByIds(ids: string[]): Promise<User[]> {
    const data = await prisma.user.findMany({ where: { id: { in: ids } } });
    return data.map(this._toModel);
  }

  async getSuggestedUsers(
    currentUserId: string,
    limit: number,
  ): Promise<User[]> {
    // Get IDs of users the current user is already following
    const following = await prisma.follower.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);

    // Get users not followed by current user (excluding self)
    const data = await prisma.user.findMany({
      where: {
        id: {
          notIn: [...followingIds, currentUserId],
        },
        status: 'active',
      },
      take: limit,
      orderBy: { followerCount: 'desc' },
    });

    return data.map(this._toModel);
  }

  async update(id: string, dto: UserUpdateDTO): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: {
        ...dto,
        role: dto.role as any,
        status: dto.status as any,
      },
    });
  }

  async delete(id: string, isHard: boolean): Promise<void> {
    if (isHard) {
      await prisma.user.delete({ where: { id } });
    } else {
      await prisma.user.update({
        where: { id },
        data: { status: Status.DELETED as any },
      });
    }
  }

  async increaseCount(id: string, field: string, step: number): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { [field]: { increment: step } },
    });
  }

  async decreaseCount(id: string, field: string, step: number): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { [field]: { decrement: step } },
    });
  }

  private _toModel(data: UserPrisma): User {
    return { ...data, role: data.role as UserRole } as User;
  }
}
