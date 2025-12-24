import { Paginated, PagingDTO } from './paging.dto';

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  paging: PagingDTO;
  filter?: Record<string, any>;
}

export function paginatedResponse<T>(
  result: Paginated<T>,
  filter: Record<string, any>,
): PaginatedResponse<T> {
  return {
    data: result.data,
    paging: {
      ...result.paging,
      total: result.total,
    },
    filter,
  };
}

