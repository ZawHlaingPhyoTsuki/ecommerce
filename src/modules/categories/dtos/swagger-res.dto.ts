import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CategoryEntity } from '../entities/category.entity';
import {
  ApiResponseDto,
  PaginationMeta,
} from 'src/common/dtos/api-response.dto';

export class CategoryResponseDto extends ApiResponseDto<CategoryEntity> {
  @ApiProperty({ type: CategoryEntity })
  declare data: CategoryEntity;
}

export class CategoryPaginatedResponseDto extends ApiResponseDto<
  CategoryEntity[]
> {
  @ApiProperty({ type: [CategoryEntity] })
  @Type(() => CategoryEntity)
  declare data: CategoryEntity[];

  @ApiProperty({ type: PaginationMeta })
  @Type(() => PaginationMeta)
  declare meta?: PaginationMeta;
}
