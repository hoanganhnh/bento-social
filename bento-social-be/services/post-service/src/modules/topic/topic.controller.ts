import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { TOPIC_REPOSITORY, TOPIC_SERVICE } from './token.di-token';
import { ITopicRepository, ITopicService } from './topic.port';
import { CreateTopicDTO, UpdateTopicDTO } from './topic.model';

@Controller('topics')
export class TopicController {
  constructor(
    @Inject(TOPIC_SERVICE) private readonly service: ITopicService,
    @Inject(TOPIC_REPOSITORY) private readonly repository: ITopicRepository,
  ) {}

  @Get()
  async findAll() {
    const topics = await this.repository.findAll();
    return { data: topics };
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const topic = await this.repository.get(id);
    return { data: topic };
  }

  @Post()
  async create(@Body() dto: CreateTopicDTO) {
    const id = await this.service.create(dto);
    return { data: { id } };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTopicDTO) {
    await this.service.update(id, dto);
    return { data: { success: true } };
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.service.delete(id);
    return { data: { success: true } };
  }
}

// RPC Controller for internal service communication
@Controller('rpc/topics')
export class TopicRpcController {
  constructor(
    @Inject(TOPIC_REPOSITORY) private readonly repository: ITopicRepository,
  ) {}

  @Get(':id')
  async getById(@Param('id') id: string) {
    const topic = await this.repository.get(id);
    return { data: topic };
  }

  @Get()
  async findAll() {
    const topics = await this.repository.findAll();
    return { data: topics };
  }
}
