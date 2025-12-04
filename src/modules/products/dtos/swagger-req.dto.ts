import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Swagger DTO for create product with file upload
 */
export class CreateProductSwaggerDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Wireless Bluetooth Headphones',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'High-quality wireless headphones with noise cancellation',
  })
  description?: string;

  @ApiProperty({
    description: 'Product price',
    example: 99.99,
  })
  price: number;

  @ApiPropertyOptional({
    description: 'Product stock quantity',
    example: 100,
    default: 0,
  })
  stock?: number;

  @ApiPropertyOptional({
    description: 'Whether the product is available for purchase',
    example: true,
    default: true,
  })
  isAvailable?: boolean;

  @ApiProperty({
    description: 'Category ID',
    example: 'clxyz123-category-id',
  })
  categoryId: string;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'Product images (max 5)',
  })
  images: Express.Multer.File[];
}

/**
 * Swagger DTO for update product with file upload
 */
export class UpdateProductSwaggerDto {
  @ApiPropertyOptional({
    description: 'Product name',
    example: 'Wireless Bluetooth Headphones Pro',
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'Premium wireless headphones with advanced noise cancellation',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Product price',
    example: 129.99,
  })
  price?: number;

  @ApiPropertyOptional({
    description: 'Product stock quantity',
    example: 150,
  })
  stock?: number;

  @ApiPropertyOptional({
    description: 'Whether the product is available for purchase',
    example: true,
  })
  isAvailable?: boolean;

  @ApiPropertyOptional({
    description: 'Category ID',
    example: 'clxyz123-category-id',
  })
  categoryId?: string;

  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'New product images to add (max 5 total)',
  })
  images?: Express.Multer.File[];
}
