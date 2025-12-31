import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';
import { AUTH_SERVICE } from './auth.di-token';
import { IAuthService } from './auth.port';

@Controller('rpc')
export class AuthRpcController {
  constructor(
    @Inject(AUTH_SERVICE) private readonly authService: IAuthService,
  ) {}

  /**
   * Token introspection endpoint for other services
   * POST /rpc/introspect
   */
  @Post('introspect')
  @HttpCode(HttpStatus.OK)
  async introspect(@Body() dto: { token: string }) {
    try {
      const payload = await this.authService.introspectToken(dto.token);
      return { data: payload };
    } catch (error) {
      return {
        data: null,
        error: (error as Error).message,
      };
    }
  }
}


