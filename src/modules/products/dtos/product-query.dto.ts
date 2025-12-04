import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  IsNumber,
  Max,
  IsUUID,
  IsEnum,
  Validate,
  ValidatorConstraint,
} from 'class-validator';

import {
  ValidationArguments,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'IsPriceRangeValid', async: false })
export class IsPriceRangeValidConstraint
  implements ValidatorConstraintInterface
{
  validate(
    _value: any,
    validationArguments?: ValidationArguments,
  ): boolean | Promise<boolean> {
    const object = validationArguments?.object as ProductQueryDto;

    // if both minPrice and maxPrice are provided
    if (object.minPrice !== undefined && object.maxPrice !== undefined) {
      return object.maxPrice >= object.minPrice;
    }

    // if only one is provided, it's valid
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultMessage(_validationArguments?: ValidationArguments): string {
    return 'maxPrice must be greater than or equal to minPrice';
  }
}

/**
 * Product query DTO for filtering and pagination
 */
export class ProductQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Search in product name and description',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by category ID',
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Filter by seller ID',
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  sellerId?: string;

  @ApiPropertyOptional({
    description: 'Minimum price',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum price',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Validate(IsPriceRangeValidConstraint)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Minimum rating (0-5)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({
    enum: ['price', 'rating', 'createdAt', 'name'],
    description: 'Sort by field',
  })
  @IsOptional()
  @IsEnum(['price', 'rating', 'createdAt', 'name'])
  sortBy?: 'price' | 'rating' | 'createdAt' | 'name';

  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    description: 'Sort order',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
