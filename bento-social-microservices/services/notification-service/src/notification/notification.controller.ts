import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  paginatedResponse,
  PagingDTO,
  pagingDTOSchema,
  RemoteAuthGuard,
  ReqWithRequester,
} from '@bento/shared';
import { NOTI_SERVICE } from './notification.di-token';
import { INotificationService } from './notification.port';

@Controller('notifications')
export class NotificationController {
  constructor(
    @Inject(NOTI_SERVICE) private readonly service: INotificationService,
  ) {}

  @Get()
  @UseGuards(RemoteAuthGuard)
  @HttpCode(HttpStatus.OK)
  async list(@Query() paging: PagingDTO, @Request() request: ReqWithRequester) {
    const { sub: userId } = request.requester;
    const parsedPaging = pagingDTOSchema.parse(paging);

    const result = await this.service.list({ receiverId: userId }, parsedPaging);
    return paginatedResponse(result, {});
  }

  @Post(':id/read')
  @UseGuards(RemoteAuthGuard)
  @HttpCode(HttpStatus.OK)
  async read(@Param('id') id: string, @Request() request: ReqWithRequester) {
    const { requester } = request;

    const result = await this.service.read(id, requester);
    return { data: result };
  }

  @Post('read-all')
  @UseGuards(RemoteAuthGuard)
  @HttpCode(HttpStatus.OK)
  async readAll(@Request() request: ReqWithRequester) {
    const { requester } = request;

    const result = await this.service.readAll(requester);
    return { data: result };
  }
}

