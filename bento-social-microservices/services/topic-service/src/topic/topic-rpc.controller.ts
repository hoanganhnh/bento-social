import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Inject,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ITopicRepository } from './topic.port';
import { TOPIC_REPOSITORY } from './topic.di-token';
import { PublicTopic, Topic, TopicStatus } from './topic.model';

@Controller('rpc')
export class TopicRpcController {
  constructor(
    @Inject(TOPIC_REPOSITORY)
    private readonly topicRepository: ITopicRepository,
  ) {}

  /**
   * RPC endpoint to get topic by ID (internal use only)
   */
  @Get('topics/:id')
  @HttpCode(HttpStatus.OK)
  async getTopic(@Param('id') id: string): Promise<{ data: PublicTopic | null }> {
    const topic = await this.topicRepository.get(id);
    if (!topic || topic.status === TopicStatus.DELETED) {
      return { data: null };
    }
    return { data: this._toPublicTopic(topic) };
  }

  /**
   * RPC endpoint to get multiple topics by IDs (internal use only)
   */
  @Post('topics/list-by-ids')
  @HttpCode(HttpStatus.OK)
  async getTopicsByIds(@Body() body: { ids: string[] }): Promise<{ data: PublicTopic[] }> {
    if (!body.ids || !Array.isArray(body.ids)) {
      return { data: [] };
    }
    const topics = await this.topicRepository.listByIds(body.ids);
    return {
      data: topics
        .filter((t) => t.status !== TopicStatus.DELETED)
        .map(this._toPublicTopic),
    };
  }

  private _toPublicTopic(topic: Topic): PublicTopic {
    const { status, ...publicTopic } = topic;
    return publicTopic;
  }
}

