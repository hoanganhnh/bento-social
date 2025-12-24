import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Patch,
  Post,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { AUTH_SERVICE } from './auth.di-token';
import { IAuthService } from './auth.port';
import { UserLoginDTO, UserRegistrationDTO, UserUpdateProfileDTO } from './auth.dto';

@Controller()
export class AuthController {
  constructor(
    @Inject(AUTH_SERVICE) private readonly authService: IAuthService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.OK)
  async register(@Body() dto: UserRegistrationDTO) {
    const userId = await this.authService.register(dto);
    return { data: userId };
  }

  @Post('authenticate')
  @HttpCode(HttpStatus.OK)
  async authenticate(@Body() dto: UserLoginDTO) {
    const token = await this.authService.login(dto);
    return { data: token };
  }

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  async getProfile(@Headers('authorization') authorization: string) {
    const token = this.extractToken(authorization);
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    const payload = await this.authService.introspectToken(token);
    const profile = await this.authService.profile(payload.sub);
    return { data: profile };
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Headers('authorization') authorization: string,
    @Body() dto: UserUpdateProfileDTO,
  ) {
    const token = this.extractToken(authorization);
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    const payload = await this.authService.introspectToken(token);
    await this.authService.updateProfile(payload.sub, dto);
    return { data: true };
  }

  private extractToken(authorization: string | undefined): string | null {
    if (!authorization) return null;
    const [type, token] = authorization.split(' ');
    return type === 'Bearer' ? token : null;
  }
}

