import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ITopicQueryRPC } from '../post.port';
import { TopicModel } from '../model';

@Injectable()
export class TopicQueryRPC implements ITopicQueryRPC {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async findById(id: string): Promise<TopicModel | null> {
    const topic = await this.prisma.topic.findUnique({ where: { id } });
    if (!topic) return null;
    return {
      id: topic.id,
      name: topic.name,
      color: topic.color,
      postCount: topic.postCount ?? 0,
      createdAt: topic.createdAt,
      updatedAt: topic.updatedAt,
    };
  }

  async findByIds(ids: string[]): Promise<Array<TopicModel>> {
    const topics = await this.prisma.topic.findMany({
      where: { id: { in: ids } },
    });
    return topics.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      postCount: t.postCount ?? 0,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
  }
}
