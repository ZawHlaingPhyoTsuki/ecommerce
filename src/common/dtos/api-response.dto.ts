import { ApiProperty } from '@nestjs/swagger';

export class PaginationMeta {
  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

export class ApiResponseDto<T = any> {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Success message' })
  message: string;

  @ApiProperty({ required: false })
  data: T;

  @ApiProperty({ required: false })
  meta?: any;

  constructor(statusCode: number, message: string, data: T, meta?: any) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.meta = meta;
  }

  static success<T>(message: string, data: T, meta?: any): ApiResponseDto<T> {
    return new ApiResponseDto(200, message, data, meta);
  }

  static deleted<T>(message: string, data: T): ApiResponseDto<T> {
    return new ApiResponseDto(200, message, data);
  }

  static created<T>(message: string, data: T): ApiResponseDto<T> {
    return new ApiResponseDto(201, message, data);
  }
}
