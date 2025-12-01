export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
  meta?: any;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
