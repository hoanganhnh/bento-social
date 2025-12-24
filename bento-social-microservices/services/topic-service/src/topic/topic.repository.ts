import { Injectable } from '@nestjs/common';
import { Topic as TopicPrisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ITopicRepository } from './topic.port';
import { Topic, TopicStatus } from './topic.model';
import { TopicCondDTO, UpdateTopicDTO, TopicQueryDTO } from './topic.dto';

@Injectable()
export class TopicRepository implements ITopicRepository {
  constructor(private readonly prisma: PrismaService) {}

  async get(id: string): Promise<Topic | null> {
    const data = await this.prisma.topic.findUnique({ where: { id } });
    if (!data) return null;
    return this._toModel(data);
  }

  async findByCond(cond: TopicCondDTO): Promise<Topic | null> {
    const data = await this.prisma.topic.findFirst({ where: cond });
    if (!data) return null;
    return this._toModel(data);
  }

  async listByIds(ids: string[]): Promise<Topic[]> {
    const data = await this.prisma.topic.findMany({
      where: { id: { in: ids } },
    });
    return data.map(this._toModel);
  }

  async list(query: TopicQueryDTO): Promise<{ topics: Topic[]; total: number }> {
    const { page, limit, status, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    // Default to active topics only
    if (status) {
      where.status = status;
    } else {
      where.status = TopicStatus.ACTIVE;
    }

    // Search by name
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [topics, total] = await Promise.all([
      this.prisma.topic.findMany({
        where,
        skip,
        take: limit,
        orderBy: { postCount: 'desc' },
      }),
      this.prisma.topic.count({ where }),
    ]);

    return {
      topics: topics.map(this._toModel),
      total,
    };
  }

  async insert(topic: Topic): Promise<void> {
    await this.prisma.topic.create({
      data: {
        id: topic.id,
        name: topic.name,
        color: topic.color,
        postCount: topic.postCount,
        status: topic.status,
        createdAt: topic.createdAt,
        updatedAt: topic.updatedAt,
      },
    });
  }

  async update(id: string, dto: UpdateTopicDTO): Promise<void> {
    await this.prisma.topic.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: string, isHard: boolean): Promise<void> {
    if (isHard) {
      await this.prisma.topic.delete({ where: { id } });
    } else {
      await this.prisma.topic.update({
        where: { id },
        data: { status: TopicStatus.DELETED, updatedAt: new Date() },
      });
    }
  }

  async incrementPostCount(id: string): Promise<void> {
    await this.prisma.topic.update({
      where: { id },
      data: {
        postCount: { increment: 1 },
        updatedAt: new Date(),
      },
    });
  }

  async decrementPostCount(id: string): Promise<void> {
    await this.prisma.topic.update({
      where: { id },
      data: {
        postCount: { decrement: 1 },
        updatedAt: new Date(),
      },
    });
  }

  private _toModel(data: TopicPrisma): Topic {
    return {
      ...data,
      status: data.status as TopicStatus,
    } as Topic;
  }
}

