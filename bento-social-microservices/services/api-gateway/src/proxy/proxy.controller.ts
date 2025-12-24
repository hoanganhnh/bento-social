import {
  Controller,
  All,
  Req,
  Res,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';

@Controller('v1')
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);

  constructor(private readonly proxyService: ProxyService) {}

  @All('*')
  async proxyRequest(@Req() req: Request, @Res() res: Response) {
    const startTime = Date.now();

    try {
      // Check if this is a multipart request (file upload)
      const isMultipart = (req.headers['content-type'] || '').includes('multipart/form-data');
      
      const response = await this.proxyService.proxy({
        method: req.method,
        path: req.path,
        body: req.body,
        query: req.query as Record<string, any>,
        headers: req.headers as Record<string, string>,
        rawRequest: isMultipart ? req : undefined, // Pass raw request for multipart
      });

      const duration = Date.now() - startTime;
      this.logger.log(
        `${req.method} ${req.path} -> ${response.status} (${duration}ms)`,
      );

      // Forward response headers
      const headersToForward = ['content-type', 'x-request-id'];
      for (const header of headersToForward) {
        if (response.headers[header]) {
          res.setHeader(header, response.headers[header]);
        }
      }

      res.status(response.status).json(response.data);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const status = error.status || error.response?.status || 500;
      const message = error.response?.data || error.message || 'Internal Server Error';

      this.logger.error(
        `${req.method} ${req.path} -> ${status} (${duration}ms): ${JSON.stringify(message)}`,
      );

      res.status(status).json(
        typeof message === 'object' ? message : { message },
      );
    }
  }
}

