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
import { IPostRepository } from './post.port';
import { POST_REPOSITORY } from './post.di-token';
import { Post as PostModel } from './post.model';

@Controller('posts/rpc/posts')
export class PostRpcController {
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: IPostRepository,
  ) {}

  /**
   * RPC endpoint to get post by ID (internal use only)
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getById(@Param('id') id: string): Promise<{ data: PostModel | null }> {
    const post = await this.postRepository.get(id);
    return { data: post };
  }

  /**
   * RPC endpoint to get multiple posts by IDs (internal use only)
   */
  @Post('list-by-ids')
  @HttpCode(HttpStatus.OK)
  async listByIds(@Body() body: { ids: string[] }): Promise<{ data: PostModel[] }> {
    if (!body.ids || !Array.isArray(body.ids)) {
      return { data: [] };
    }
    const posts = await this.postRepository.listByIds(body.ids);
    return { data: posts };
  }
}

