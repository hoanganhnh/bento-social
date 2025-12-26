import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthRpcController } from "./auth-rpc.controller";
import { AuthGrpcController } from "./auth-grpc.controller";
import { AuthService } from "./auth.service";
import { UserRepository } from "./user.repository";
import { JwtTokenService } from "./jwt.service";
import { AUTH_SERVICE, USER_REPOSITORY, TOKEN_PROVIDER } from "./auth.di-token";

const config = {
  jwtSecret: process.env.JWT_SECRET || "bento_jwt_secret_key",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
};

@Module({
  controllers: [AuthController, AuthRpcController, AuthGrpcController],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    {
      provide: TOKEN_PROVIDER,
      useFactory: () =>
        new JwtTokenService(config.jwtSecret, config.jwtExpiresIn),
    },
    {
      provide: AUTH_SERVICE,
      useClass: AuthService,
    },
  ],
  exports: [AUTH_SERVICE, USER_REPOSITORY, TOKEN_PROVIDER],
})
export class AuthModule {}

