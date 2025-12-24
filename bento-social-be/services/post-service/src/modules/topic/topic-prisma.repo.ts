import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ITopicRepository } from './topic.port';
import { Topic, UpdateTopicDTO } from './topic.model';

@Injectable()
export class TopicPrismaRepository implements ITopicRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async get(id: string): Promise<Topic | null> {
    const topic = await this.prisma.topic.findUnique({ where: { id } });
    if (!topic) return null;
    return this.toModel(topic);
  }

  async findAll(): Promise<Topic[]> {
    const topics = await this.prisma.topic.findMany({
      orderBy: { name: 'asc' },
    });
    return topics.map(this.toModel);
  }

  async findByName(name: string): Promise<Topic | null> {
    const topic = await this.prisma.topic.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    if (!topic) return null;
    return this.toModel(topic);
  }

  async insert(topic: Topic): Promise<void> {
    await this.prisma.topic.create({
      data: {
        id: topic.id,
        name: topic.name,
        color: topic.color,
        postCount: topic.postCount,
        createdAt: topic.createdAt,
        updatedAt: topic.updatedAt,
      },
    });
  }

  async update(id: string, dto: UpdateTopicDTO): Promise<void> {
    await this.prisma.topic.update({
      where: { id },
      data: { ...dto, updatedAt: new Date() },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.topic.delete({ where: { id } });
  }

  async increaseCount(id: string, field: string, step: number): Promise<void> {
    await this.prisma.topic.update({
      where: { id },
      data: { [field]: { increment: step } },
    });
  }

  async decreaseCount(id: string, field: string, step: number): Promise<void> {
    await this.prisma.topic.update({
      where: { id },
      data: { [field]: { decrement: step } },
    });
  }

  private toModel(data: any): Topic {
    return {
      id: data.id,
      name: data.name,
      color: data.color,
      postCount: data.postCount ?? 0,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
