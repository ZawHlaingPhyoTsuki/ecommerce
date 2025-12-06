import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiResponseDto } from 'src/common/dtos/api-response.dto';

/**
 * Product info in cart item
 */
export class CartItemProductDto {
  @ApiProperty({
    description: 'Product ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Product name',
    example: 'Wireless Bluetooth Headphones',
  })
  name: string;

  @ApiProperty({
    description: 'Product slug',
    example: 'wireless-bluetooth-headphones',
  })
  slug: string;

  @ApiProperty({
    description: 'Product price',
    example: 99.99,
  })
  price: number;

  @ApiProperty({
    description: 'Available stock',
    example: 50,
  })
  stock: number;

  @ApiProperty({
    description: 'Product availability',
    example: true,
  })
  isAvailable: boolean;

  @ApiPropertyOptional({
    description: 'Product images',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        order: { type: 'number' },
      },
    },
    example: [{ url: 'https://example.com/image.jpg', order: 0 }],
  })
  images?: Array<{ url: string; order: number }>;
}

/**
 * Cart item DTO
 */
export class CartItemDto {
  @ApiProperty({
    description: 'Cart item ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Product ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  productId: string;

  @ApiProperty({
    description: 'Quantity',
    example: 2,
  })
  quantity: number;

  @ApiProperty({
    description: 'Product details',
    type: CartItemProductDto,
  })
  product: CartItemProductDto;
}

/**
 * Cart DTO
 */
export class CartDto {
  @ApiProperty({
    description: 'Cart ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  userId: string;

  @ApiProperty({
    description: 'Cart items',
    type: [CartItemDto],
  })
  items: CartItemDto[];

  @ApiProperty({
    description: 'Total number of items in cart',
    example: 5,
  })
  totalItems: number;

  @ApiProperty({
    description: 'Total price of all items',
    example: 299.97,
  })
  totalPrice: number;

  @ApiProperty({
    description: 'When the cart was created',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the cart was last updated',
  })
  updatedAt: Date;
}

/**
 * Cart response DTO for Swagger
 */
export class CartResponseDto extends ApiResponseDto<CartDto> {
  @ApiProperty({ example: 200 })
  declare statusCode: number;

  @ApiProperty({ example: 'Cart retrieved successfully' })
  declare message: string;

  @ApiProperty({ type: CartDto })
  declare data: CartDto;
}
