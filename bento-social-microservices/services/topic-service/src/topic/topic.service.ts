import { Inject, Injectable, Logger } from '@nestjs/common';
import { Requester, UserRole, Paginated } from '@bento/shared';
import { v7 as uuidv7 } from 'uuid';
import { ITopicRepository, ITopicService } from './topic.port';
import {
  Topic,
  PublicTopic,
  TopicStatus,
  ErrTopicNotFound,
  ErrTopicNameExists,
  ErrForbidden,
} from './topic.model';
import { CreateTopicDTO, UpdateTopicDTO, TopicQueryDTO } from './topic.dto';
import { TOPIC_REPOSITORY } from './topic.di-token';

@Injectable()
export class TopicService implements ITopicService {
  private readonly logger = new Logger(TopicService.name);

  constructor(
    @Inject(TOPIC_REPOSITORY)
    private readonly topicRepository: ITopicRepository,
  ) {}

  async getTopic(id: string): Promise<PublicTopic | null> {
    const topic = await this.topicRepository.get(id);
    if (!topic || topic.status === TopicStatus.DELETED) return null;
    return this._toPublicTopic(topic);
  }

  async listTopics(query: TopicQueryDTO): Promise<Paginated<PublicTopic>> {
    const { topics, total } = await this.topicRepository.list(query);
    
    return {
      data: topics.map(this._toPublicTopic),
      paging: {
        page: query.page,
        limit: query.limit,
      },
      total,
    };
  }

  async createTopic(requester: Requester, dto: CreateTopicDTO): Promise<string> {
    // Only admin can create topics
    if (requester.role !== UserRole.ADMIN) {
      throw ErrForbidden;
    }

    // Check if topic name already exists
    const existing = await this.topicRepository.findByCond({ name: dto.name });
    if (existing) {
      throw ErrTopicNameExists;
    }

    const now = new Date();
    const topic: Topic = {
      id: uuidv7(),
      name: dto.name,
      color: dto.color || '#3B82F6',
      postCount: 0,
      status: TopicStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    };

    await this.topicRepository.insert(topic);
    this.logger.log(`Topic ${topic.id} created by ${requester.sub}`);
    
    return topic.id;
  }

  async updateTopic(requester: Requester, topicId: string, dto: UpdateTopicDTO): Promise<void> {
    // Only admin can update topics
    if (requester.role !== UserRole.ADMIN) {
      throw ErrForbidden;
    }

    const topic = await this.topicRepository.get(topicId);
    if (!topic || topic.status === TopicStatus.DELETED) {
      throw ErrTopicNotFound;
    }

    // Check if new name conflicts with existing topic
    if (dto.name && dto.name !== topic.name) {
      const existing = await this.topicRepository.findByCond({ name: dto.name });
      if (existing) {
        throw ErrTopicNameExists;
      }
    }

    await this.topicRepository.update(topicId, dto);
    this.logger.log(`Topic ${topicId} updated by ${requester.sub}`);
  }

  async deleteTopic(requester: Requester, topicId: string): Promise<void> {
    // Only admin can delete topics
    if (requester.role !== UserRole.ADMIN) {
      throw ErrForbidden;
    }

    const topic = await this.topicRepository.get(topicId);
    if (!topic || topic.status === TopicStatus.DELETED) {
      throw ErrTopicNotFound;
    }

    // Soft delete by default
    await this.topicRepository.delete(topicId, false);
    this.logger.log(`Topic ${topicId} deleted by ${requester.sub}`);
  }

  async incrementPostCount(topicId: string): Promise<void> {
    try {
      await this.topicRepository.incrementPostCount(topicId);
      this.logger.debug(`Incremented post count for topic ${topicId}`);
    } catch (error) {
      this.logger.error(`Failed to increment post count for topic ${topicId}: ${error}`);
    }
  }

  async decrementPostCount(topicId: string): Promise<void> {
    try {
      await this.topicRepository.decrementPostCount(topicId);
      this.logger.debug(`Decremented post count for topic ${topicId}`);
    } catch (error) {
      this.logger.error(`Failed to decrement post count for topic ${topicId}: ${error}`);
    }
  }

  private _toPublicTopic(topic: Topic): PublicTopic {
    const { status, ...publicTopic } = topic;
    return publicTopic;
  }
}

