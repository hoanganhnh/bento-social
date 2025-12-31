import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  check() {
    return {
      status: 'ok',
      service: 'topic-service',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('db')
  @HttpCode(HttpStatus.OK)
  async checkDb() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'connected' };
    } catch (error) {
      return {
        status: 'error',
        database: 'disconnected',
        error: (error as Error).message,
      };
    }
  }
}

