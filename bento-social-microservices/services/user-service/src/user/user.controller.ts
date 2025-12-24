import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Inject,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { IUserService } from './user.port';
import { USER_SERVICE } from './user.di-token';
import { UserUpdateDTO, userUpdateDTOSchema } from './user.dto';
import { ErrUserNotFound, ErrForbidden } from './user.model';
import { RemoteAuthGuard, ReqUser, Requester } from '@bento/shared';

@Controller('users')
export class UserController {
  constructor(
    @Inject(USER_SERVICE)
    private readonly userService: IUserService,
  ) {}

  @Get('suggested')
  @UseGuards(RemoteAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getSuggestedUsers(@ReqUser() requester: Requester) {
    const users = await this.userService.getSuggestedUsers(requester.sub, 10);
    return { data: users };
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    const user = await this.userService.getUser(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      data: user,
    };
  }

  @Patch(':id')
  @UseGuards(RemoteAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateUser(
    @Param('id') id: string,
    @Body() body: UserUpdateDTO,
    @ReqUser() requester: Requester,
  ) {
    const parsed = userUpdateDTOSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message);
    }

    try {
      await this.userService.updateUser(requester, id, parsed.data);
      return { success: true };
    } catch (error) {
      if (error === ErrUserNotFound) {
        throw new NotFoundException('User not found');
      }
      if (error === ErrForbidden) {
        throw new ForbiddenException('You do not have permission');
      }
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(RemoteAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id') id: string, @ReqUser() requester: Requester) {
    try {
      await this.userService.deleteUser(requester, id);
      return { success: true };
    } catch (error) {
      if (error === ErrUserNotFound) {
        throw new NotFoundException('User not found');
      }
      if (error === ErrForbidden) {
        throw new ForbiddenException('You do not have permission');
      }
      throw error;
    }
  }
}
