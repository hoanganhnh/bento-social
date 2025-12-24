import { Module } from '@nestjs/common';
import { UserModule } from './modules/user/user.module';
import { EventBusModule } from './share/event';

@Module({
  imports: [UserModule, EventBusModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
