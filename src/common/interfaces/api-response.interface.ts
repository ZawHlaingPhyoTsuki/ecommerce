export interface IApiResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
  meta?: any;
}

export interface IPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
