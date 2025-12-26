import { Controller, Inject } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { IAuthService } from "./auth.port";
import { AUTH_SERVICE } from "./auth.di-token";

/**
 * gRPC Controller for Auth Service
 * Handles token introspection for inter-service authentication
 */
@Controller()
export class AuthGrpcController {
  constructor(
    @Inject(AUTH_SERVICE)
    private readonly authService: IAuthService,
  ) {}

  /**
   * gRPC method: IntrospectToken
   * Validates JWT token and returns user information
   */
  @GrpcMethod("AuthService", "IntrospectToken")
  async introspectToken(data: { token: string }): Promise<any> {
    try {
      const payload = await this.authService.introspectToken(data.token);

      return {
        valid: true,
        userId: payload.sub,
        username: payload.sub, // Use sub as username for now
        role: payload.role,
        error: "",
      };
    } catch (error) {
      return {
        valid: false,
        userId: "",
        username: "",
        role: "",
        error: (error as Error).message || "Invalid token",
      };
    }
  }
}
