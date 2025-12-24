import { Injectable } from '@nestjs/common';
import { User as PrismaUser, UserRole as PrismaUserRole, UserStatus } from '@prisma/client';
import { UserRole } from '@bento/shared';
import { PrismaService } from '../prisma/prisma.service';
import { IUserRepository } from './auth.port';
import { UserCondDTO, UserUpdateDTO } from './auth.dto';
import { User, Status } from './user.model';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async get(id: string): Promise<User | null> {
    const result = await this.prisma.user.findUnique({ where: { id } });
    if (!result) return null;
    return this.toModel(result);
  }

  async findByCond(cond: UserCondDTO): Promise<User | null> {
    const where: any = {};

    if (cond.username) {
      where.username = cond.username;
    }
    if (cond.firstName) {
      where.firstName = cond.firstName;
    }
    if (cond.lastName) {
      where.lastName = cond.lastName;
    }
    if (cond.role) {
      where.role = this.toPrismaRole(cond.role);
    }
    if (cond.status) {
      where.status = cond.status;
    }

    const result = await this.prisma.user.findFirst({ where });
    if (!result) return null;
    return this.toModel(result);
  }

  async listByIds(ids: string[]): Promise<User[]> {
    const results = await this.prisma.user.findMany({
      where: { id: { in: ids } },
    });
    return results.map((r) => this.toModel(r));
  }

  async insert(user: User): Promise<void> {
    await this.prisma.user.create({
      data: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        password: user.password,
        salt: user.salt,
        role: this.toPrismaRole(user.role),
        status: (user.status as UserStatus) || UserStatus.active,
        avatar: user.avatar,
        cover: user.cover,
        bio: user.bio,
        websiteUrl: user.websiteUrl,
        followerCount: user.followerCount ?? 0,
        postCount: user.postCount ?? 0,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  }

  async update(id: string, dto: UserUpdateDTO): Promise<void> {
    const data: any = { ...dto };
    
    if (dto.role) {
      data.role = this.toPrismaRole(dto.role);
    }
    
    data.updatedAt = new Date();

    await this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, isHard: boolean): Promise<void> {
    if (isHard) {
      await this.prisma.user.delete({ where: { id } });
    } else {
      await this.prisma.user.update({
        where: { id },
        data: { status: UserStatus.deleted, updatedAt: new Date() },
      });
    }
  }

  private toModel(data: PrismaUser): User {
    return {
      id: data.id,
      username: data.username,
      firstName: data.firstName,
      lastName: data.lastName,
      password: data.password,
      salt: data.salt,
      role: this.toAppRole(data.role),
      status: data.status as Status,
      avatar: data.avatar,
      cover: data.cover,
      bio: data.bio,
      websiteUrl: data.websiteUrl,
      followerCount: data.followerCount ?? 0,
      postCount: data.postCount ?? 0,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  private toPrismaRole(role: UserRole): PrismaUserRole {
    return role === UserRole.ADMIN ? PrismaUserRole.admin : PrismaUserRole.user;
  }

  private toAppRole(role: PrismaUserRole): UserRole {
    return role === PrismaUserRole.admin ? UserRole.ADMIN : UserRole.USER;
  }
}

