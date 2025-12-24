import { Inject, Injectable } from '@nestjs/common';
import { v7 } from 'uuid';
import { AppError } from 'src/share';
import {
  CreateTopicDTO,
  ErrTopicNameAlreadyExists,
  ErrTopicNotFound,
  Topic,
  UpdateTopicDTO,
} from './topic.model';
import { TOPIC_REPOSITORY } from './token.di-token';
import { ITopicRepository, ITopicService } from './topic.port';

@Injectable()
export class TopicService implements ITopicService {
  constructor(
    @Inject(TOPIC_REPOSITORY) private readonly repository: ITopicRepository,
  ) {}

  async create(dto: CreateTopicDTO): Promise<string> {
    const existing = await this.repository.findByName(dto.name);
    if (existing) {
      throw AppError.from(ErrTopicNameAlreadyExists, 400);
    }

    const newId = v7();
    const topic: Topic = {
      id: newId,
      name: dto.name,
      color: dto.color || '#008000',
      postCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.repository.insert(topic);
    return newId;
  }

  async update(id: string, dto: UpdateTopicDTO): Promise<boolean> {
    const existing = await this.repository.get(id);
    if (!existing) {
      throw AppError.from(ErrTopicNotFound, 404);
    }

    await this.repository.update(id, dto);
    return true;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.repository.get(id);
    if (!existing) {
      throw AppError.from(ErrTopicNotFound, 404);
    }

    await this.repository.delete(id);
    return true;
  }

  async increasePostCount(id: string, step: number): Promise<void> {
    await this.repository.increaseCount(id, 'postCount', step);
  }

  async decreasePostCount(id: string, step: number): Promise<void> {
    await this.repository.decreaseCount(id, 'postCount', step);
  }
}
