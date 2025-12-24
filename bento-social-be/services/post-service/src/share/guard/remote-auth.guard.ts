import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { TOKEN_INTROSPECTOR } from '../di-token';
import { ITokenIntrospect, Requester } from '../interface';

@Injectable()
export class RemoteAuthGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_INTROSPECTOR)
    private readonly tokenIntrospector: ITokenIntrospect,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Missing authorization token');
    }

    const result = await this.tokenIntrospector.introspect(token);

    if (!result.isOk || !result.payload) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    (request as any).requester = result.payload as Requester;
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
