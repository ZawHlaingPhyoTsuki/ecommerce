import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Add item to cart DTO
 */
export class AddToCartDto {
  @ApiProperty({
    description: 'Product ID to add to cart',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  productId: string;

  @ApiProperty({
    description: 'Quantity to add',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number = 1;
}
