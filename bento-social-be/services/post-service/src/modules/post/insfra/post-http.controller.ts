import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { PagingDTO, pagingDTOSchema } from 'src/share/data-model';
import { REMOTE_AUTH_GUARD } from 'src/share/di-token';
import { Requester } from 'src/share/interface';
import { POST_REPOSITORY, POST_SERVICE } from '../post.di-token';
import { IPostRepository, IPostService } from '../post.port';
import { CreatePostDTO, PostCondDTO, postCondDTOSchema } from '../model';

@Controller('posts')
export class PostHttpController {
  constructor(
    @Inject(POST_SERVICE) private readonly service: IPostService,
    @Inject(POST_REPOSITORY) private readonly repository: IPostRepository,
    @Inject(REMOTE_AUTH_GUARD) private readonly authGuard: any,
  ) {}

  @Get()
  async list(@Query() query: any) {
    const cond: PostCondDTO = postCondDTOSchema.parse(query);
    const paging: PagingDTO = pagingDTOSchema.parse(query);
    const result = await this.repository.list(cond, paging);
    return { data: result.data, paging: result.paging };
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const post = await this.repository.get(id);
    return { data: post };
  }

  @Post()
  @UseGuards()
  async create(@Body() body: any, @Req() req: Request) {
    // Auth validation via middleware or guard
    const requester = (req as any).requester as Requester;
    const dto: CreatePostDTO = {
      content: body.content,
      image: body.image,
      topicId: body.topicId,
      authorId: requester?.sub || body.authorId,
    };
    const id = await this.service.create(dto);
    return { data: { id } };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    const requester = (req as any).requester as Requester;
    await this.service.update(id, body, requester);
    return { data: { success: true } };
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: Request) {
    const requester = (req as any).requester as Requester;
    await this.service.delete(id, requester);
    return { data: { success: true } };
  }
}

// RPC Controller for internal service calls
@Controller('rpc/posts')
export class PostRpcController {
  constructor(
    @Inject(POST_REPOSITORY) private readonly repository: IPostRepository,
  ) {}

  @Get(':id')
  async getById(@Param('id') id: string) {
    const post = await this.repository.get(id);
    return { data: post };
  }

  @Post('list-by-ids')
  async listByIds(@Body() body: { ids: string[] }) {
    const posts = await this.repository.listByIds(body.ids);
    return { data: posts };
  }
}
