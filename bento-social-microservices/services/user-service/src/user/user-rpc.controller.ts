import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Inject,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IUserRepository } from './user.port';
import { USER_REPOSITORY } from './user.di-token';
import { PublicUser, User } from './user.model';

@Controller('rpc')
export class UserRpcController {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  /**
   * RPC endpoint to get user by ID (internal use only)
   */
  @Get('users/:id')
  @HttpCode(HttpStatus.OK)
  async getUser(@Param('id') id: string): Promise<{ data: PublicUser | null }> {
    const user = await this.userRepository.get(id);
    if (!user) {
      return { data: null };
    }
    return { data: this._toPublicUser(user) };
  }

  /**
   * RPC endpoint to get multiple users by IDs (internal use only)
   */
  @Post('users/by-ids')
  @HttpCode(HttpStatus.OK)
  async getUsersByIds(@Body() body: { ids: string[] }): Promise<{ data: PublicUser[] }> {
    if (!body.ids || !Array.isArray(body.ids)) {
      return { data: [] };
    }
    const users = await this.userRepository.listByIds(body.ids);
    return { data: users.map(this._toPublicUser) };
  }

  /**
   * RPC endpoint to find user by condition (internal use only)
   */
  @Post('users/find')
  @HttpCode(HttpStatus.OK)
  async findUser(@Body() cond: any): Promise<{ data: PublicUser | null }> {
    const user = await this.userRepository.findByCond(cond);
    if (!user) {
      return { data: null };
    }
    return { data: this._toPublicUser(user) };
  }

  private _toPublicUser(user: User): PublicUser {
    const { password, salt, ...publicUser } = user;
    return publicUser;
  }
}

