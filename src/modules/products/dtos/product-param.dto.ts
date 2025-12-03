import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, Matches } from 'class-validator';

/**
 * Product ID parameter DTO
 */
export class ProductIdParamDto {
  @ApiProperty({
    description: 'Product ID',
    example: 'clxyz123-product-id',
  })
  @IsString()
  @IsUUID()
  id: string;
}

/**
 * Seller ID and Product slug parameter DTO
 */
export class SellerIdAndProductSlugParamDto {
  @ApiProperty({
    description: 'Seller ID',
    example: 'clxyz123-seller-id',
  })
  @IsString()
  @IsUUID()
  sellerId: string;

  @ApiProperty({
    description: 'Product slug',
    example: 'wireless-bluetooth-headphones',
  })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug: string;
}
