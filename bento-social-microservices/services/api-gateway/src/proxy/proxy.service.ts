import { Injectable, Inject, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig, AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import * as FormData from 'form-data';
import {
  SERVICES_CONFIG,
  IServicesConfig,
  ROUTE_MAPPINGS,
  RouteMapping,
} from '../config/services.config';

export interface ProxyRequest {
  method: string;
  path: string;
  body?: any;
  query?: Record<string, any>;
  headers: Record<string, string>;
  params?: Record<string, string>;
  rawRequest?: any; // Original express request for streaming
}

export interface ProxyResponse {
  status: number;
  data: any;
  headers: Record<string, any>;
}

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  constructor(
    private readonly httpService: HttpService,
    @Inject(SERVICES_CONFIG) private readonly servicesConfig: IServicesConfig,
  ) {}

  /**
   * Find matching route for the given path
   */
  findRoute(path: string): RouteMapping | null {
    // Sort routes by specificity (longer paths first)
    const sortedRoutes = [...ROUTE_MAPPINGS].sort(
      (a, b) => b.path.length - a.path.length,
    );

    for (const route of sortedRoutes) {
      if (this.matchPath(path, route.path)) {
        return route;
      }
    }
    return null;
  }

  /**
   * Check if path matches route pattern
   */
  private matchPath(path: string, pattern: string): boolean {
    const pathParts = path.split('/').filter(Boolean);
    const patternParts = pattern.split('/').filter(Boolean);

    if (pathParts.length < patternParts.length) {
      return false;
    }

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];

      // Skip parameter parts (e.g., :id)
      if (patternPart.startsWith(':')) {
        continue;
      }

      if (patternPart !== pathPart) {
        return false;
      }
    }

    return true;
  }

  /**
   * Extract params from path based on pattern
   */
  extractParams(path: string, pattern: string): Record<string, string> {
    const params: Record<string, string> = {};
    const pathParts = path.split('/').filter(Boolean);
    const patternParts = pattern.split('/').filter(Boolean);

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];

      if (patternPart.startsWith(':')) {
        const paramName = patternPart.slice(1);
        params[paramName] = pathPart;
      }
    }

    return params;
  }

  /**
   * Build target URL with params
   */
  buildTargetUrl(
    serviceUrl: string,
    targetPath: string,
    params: Record<string, string>,
    originalPath: string,
    routePath: string,
  ): string {
    // Replace params in target path
    let url = targetPath;
    for (const [key, value] of Object.entries(params)) {
      url = url.replace(`:${key}`, value);
    }

    // Handle extra path segments after the matched route
    const originalParts = originalPath.split('/').filter(Boolean);
    const routeParts = routePath.split('/').filter(Boolean);
    
    if (originalParts.length > routeParts.length) {
      const extraParts = originalParts.slice(routeParts.length);
      url = `${url}/${extraParts.join('/')}`;
    }

    return `${serviceUrl}${url}`;
  }

  /**
   * Check if request is multipart/form-data
   */
  isMultipart(headers: Record<string, string>): boolean {
    const contentType = headers['content-type'] || '';
    return contentType.includes('multipart/form-data');
  }

  /**
   * Proxy request to target service
   */
  async proxy(request: ProxyRequest): Promise<ProxyResponse> {
    const route = this.findRoute(request.path);

    if (!route) {
      throw new HttpException(
        `No route found for path: ${request.path}`,
        HttpStatus.NOT_FOUND,
      );
    }

    const serviceUrl = this.servicesConfig[route.service];
    const params = this.extractParams(request.path, route.path);
    const targetPath = route.targetPath || route.path.replace('/v1', '');
    const targetUrl = this.buildTargetUrl(
      serviceUrl,
      targetPath,
      params,
      request.path,
      route.path,
    );

    this.logger.debug(
      `Proxying ${request.method} ${request.path} -> ${targetUrl}`,
    );

    // Handle multipart/form-data requests by streaming the raw request
    if (this.isMultipart(request.headers) && request.rawRequest) {
      return this.proxyMultipart(request, targetUrl);
    }

    const config: AxiosRequestConfig = {
      method: request.method as any,
      url: targetUrl,
      headers: this.filterHeaders(request.headers),
      params: request.query,
      data: request.body,
    };

    try {
      const response = await firstValueFrom(this.httpService.request(config));
      
      return {
        status: response.status,
        data: response.data,
        headers: response.headers as Record<string, any>,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        const status = error.response?.status || HttpStatus.BAD_GATEWAY;
        const data = error.response?.data || { message: error.message };
        
        this.logger.error(
          `Proxy error for ${request.method} ${targetUrl}: ${error.message}`,
        );

        throw new HttpException(data, status);
      }
      throw error;
    }
  }

  /**
   * Proxy multipart/form-data request by streaming the raw request
   */
  private async proxyMultipart(request: ProxyRequest, targetUrl: string): Promise<ProxyResponse> {
    const req = request.rawRequest;
    
    const config: AxiosRequestConfig = {
      method: request.method as any,
      url: targetUrl,
      headers: {
        ...this.filterHeaders(request.headers),
        'content-type': request.headers['content-type'],
        'content-length': request.headers['content-length'],
      },
      data: req, // Stream the raw request
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    };

    try {
      const response = await firstValueFrom(this.httpService.request(config));
      
      return {
        status: response.status,
        data: response.data,
        headers: response.headers as Record<string, any>,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        const status = error.response?.status || HttpStatus.BAD_GATEWAY;
        const data = error.response?.data || { message: error.message };
        
        this.logger.error(
          `Multipart proxy error for ${request.method} ${targetUrl}: ${error.message}`,
        );

        throw new HttpException(data, status);
      }
      throw error;
    }
  }

  /**
   * Filter headers to forward
   */
  private filterHeaders(headers: Record<string, string>): Record<string, string> {
    const allowedHeaders = [
      'authorization',
      'content-type',
      'accept',
      'user-agent',
      'x-request-id',
      'x-correlation-id',
    ];

    const filtered: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(headers)) {
      if (allowedHeaders.includes(key.toLowerCase())) {
        filtered[key] = value;
      }
    }

    return filtered;
  }
}

