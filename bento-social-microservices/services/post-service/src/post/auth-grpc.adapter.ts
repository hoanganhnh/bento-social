import { Injectable, OnModuleInit, Inject } from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
import {
  ITokenIntrospect,
  TokenPayload,
  TokenIntrospectResult,
  UserRole,
} from "@bento/shared";
import { firstValueFrom } from "rxjs";

interface AuthServiceGrpc {
  IntrospectToken(data: { token: string }): any;
}

@Injectable()
export class AuthGrpcAdapter implements ITokenIntrospect, OnModuleInit {
  private authService: AuthServiceGrpc;

  constructor(@Inject("AUTH_SERVICE") private client: ClientGrpc) {}

  onModuleInit() {
    this.authService = this.client.getService<AuthServiceGrpc>("AuthService");
  }

  async introspect(token: string): Promise<TokenIntrospectResult> {
    try {
      const response: any = await firstValueFrom(
        this.authService.IntrospectToken({ token }),
      );

      if (!response || !response.valid) {
        return {
          payload: null,
          isOk: false,
          error: new Error("Invalid token"),
        };
      }

      const payload: TokenPayload = {
        sub: response.userId,
        role: response.role as UserRole,
      };

      return {
        payload,
        isOk: true,
      };
    } catch (error) {
      return {
        payload: null,
        isOk: false,
        error: error as Error,
      };
    }
  }
}
