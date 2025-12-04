import { ApiProperty } from '@nestjs/swagger';
import {
  ApiResponseDto,
  PaginationMeta,
} from 'src/common/dtos/api-response.dto';
import { ProductEntity } from '../entities/product.entity';

/**
 * Product response DTO for Swagger
 */
export class ProductResponseDto {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Product retrieved successfully' })
  message: string;

  @ApiProperty({ type: ProductEntity })
  data: ProductEntity;
}

/**
 * Paginated product response DTO for Swagger
 */
export class ProductPaginatedResponseDto extends ApiResponseDto<
  ProductEntity[]
> {
  @ApiProperty({ example: 200 })
  declare statusCode: number;

  @ApiProperty({ example: 'Products retrieved successfully' })
  declare message: string;

  @ApiProperty({ type: [ProductEntity] })
  declare data: ProductEntity[];

  @ApiProperty({ type: PaginationMeta })
  declare meta?: PaginationMeta;
}
