import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Inject,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  UseGuards,
} from '@nestjs/common';
import { ITopicService } from './topic.port';
import { TOPIC_SERVICE } from './topic.di-token';
import {
  CreateTopicDTO,
  UpdateTopicDTO,
  TopicQueryDTO,
  createTopicDTOSchema,
  updateTopicDTOSchema,
  topicQueryDTOSchema,
} from './topic.dto';
import { ErrTopicNotFound, ErrTopicNameExists, ErrForbidden } from './topic.model';
import { RemoteAuthGuard, ReqUser, Requester } from '@bento/shared';

@Controller('topics')
export class TopicController {
  constructor(
    @Inject(TOPIC_SERVICE)
    private readonly topicService: ITopicService,
  ) {}

  /**
   * GET /topics - List all topics (public)
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async listTopics(@Query() query: TopicQueryDTO) {
    const parsed = topicQueryDTOSchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message);
    }

    const result = await this.topicService.listTopics(parsed.data);
    return result;
  }

  /**
   * GET /topics/:id - Get topic by ID (public)
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getTopic(@Param('id') id: string) {
    const topic = await this.topicService.getTopic(id);
    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    return { data: topic };
  }

  /**
   * POST /topics - Create topic (Admin only)
   */
  @Post()
  @UseGuards(RemoteAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createTopic(@Body() body: CreateTopicDTO, @ReqUser() requester: Requester) {
    const parsed = createTopicDTOSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message);
    }

    try {
      const topicId = await this.topicService.createTopic(requester, parsed.data);
      return { data: { id: topicId } };
    } catch (error) {
      if (error === ErrForbidden) {
        throw new ForbiddenException('Only admins can create topics');
      }
      if (error === ErrTopicNameExists) {
        throw new ConflictException('Topic name already exists');
      }
      throw error;
    }
  }

  /**
   * PATCH /topics/:id - Update topic (Admin only)
   */
  @Patch(':id')
  @UseGuards(RemoteAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateTopic(
    @Param('id') id: string,
    @Body() body: UpdateTopicDTO,
    @ReqUser() requester: Requester,
  ) {
    const parsed = updateTopicDTOSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message);
    }

    try {
      await this.topicService.updateTopic(requester, id, parsed.data);
      return { success: true };
    } catch (error) {
      if (error === ErrTopicNotFound) {
        throw new NotFoundException('Topic not found');
      }
      if (error === ErrForbidden) {
        throw new ForbiddenException('Only admins can update topics');
      }
      if (error === ErrTopicNameExists) {
        throw new ConflictException('Topic name already exists');
      }
      throw error;
    }
  }

  /**
   * DELETE /topics/:id - Delete topic (Admin only)
   */
  @Delete(':id')
  @UseGuards(RemoteAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteTopic(@Param('id') id: string, @ReqUser() requester: Requester) {
    try {
      await this.topicService.deleteTopic(requester, id);
      return { success: true };
    } catch (error) {
      if (error === ErrTopicNotFound) {
        throw new NotFoundException('Topic not found');
      }
      if (error === ErrForbidden) {
        throw new ForbiddenException('Only admins can delete topics');
      }
      throw error;
    }
  }
}

