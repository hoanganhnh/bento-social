import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  async getHello(): Promise<string> {
    return '<h1>Simple Social Network API from ptit.io</h1>';
  }
}
