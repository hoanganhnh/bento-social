import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export abstract class BaseRpcClient {
  protected readonly client: AxiosInstance;

  constructor(
    protected readonly baseUrl: string,
    config?: AxiosRequestConfig,
  ) {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      ...config,
    });
  }

  protected async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<{ data: T }>(url, config);
    return response.data.data;
  }

  protected async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.post<{ data: T }>(url, data, config);
    return response.data.data;
  }
}

