import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import type { Product, ProductImage, Prisma } from 'generated/prisma/client';

export class ProductImageEntity implements ProductImage {
  @ApiProperty({
    description: 'Image ID',
    example: 'clxyz123-image-id',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Product ID',
    example: 'clxyz123-product-id',
  })
  @Expose()
  productId: string;

  @ApiProperty({
    description: 'Image URL',
    example: 'https://res.cloudinary.com/.../product-1.jpg',
  })
  @Expose()
  url: string;

  @Exclude()
  publicId: string;

  @ApiProperty({
    description: 'Display order',
    example: 0,
  })
  @Expose()
  order: number;

  @ApiProperty({
    description: 'When the image was uploaded',
  })
  @Expose()
  createdAt: Date;

  constructor(partial: Partial<ProductImage>) {
    Object.assign(this, partial);
  }
}

type ProductWithRelations = Product & {
  _count?: Prisma.ProductCountOutputType;
  images?: ProductImage[];
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  seller?: {
    id: string;
    name: string;
    businessName: string | null;
  };
};

export class ProductEntity
  implements Omit<ProductWithRelations, 'price' | 'rating' | 'images'>
{
  @ApiProperty({
    description: 'Unique identifier of the product',
    example: 'clxyz123-product-id',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Product name',
    example: 'Wireless Bluetooth Headphones',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'URL-friendly slug',
    example: 'wireless-bluetooth-headphones',
  })
  @Expose()
  slug: string;

  @ApiProperty({
    description: 'Product description',
    type: String,
    nullable: true,
    example: 'High-quality wireless headphones with noise cancellation',
  })
  @Expose()
  description: string | null;

  @ApiProperty({
    description: 'Product price',
    type: Number,
    example: 99.99,
  })
  @Expose()
  price: number;

  @ApiPropertyOptional({
    description: 'Product images',
    type: [ProductImageEntity],
  })
  @Expose()
  @Type(() => ProductImageEntity)
  images?: ProductImageEntity[];

  @ApiProperty({
    description: 'Product stock quantity',
    example: 100,
  })
  @Expose()
  stock: number;

  @ApiProperty({
    description: 'Whether the product is available for purchase',
    example: true,
  })
  @Expose()
  isAvailable: boolean;

  @ApiProperty({
    description: 'Product rating (0-5)',
    type: Number,
    example: 4.5,
  })
  @Expose()
  rating: number;

  @ApiProperty({
    description: 'Number of ratings',
    example: 42,
  })
  @Expose()
  ratingCount: number;

  @ApiProperty({
    description: 'Category ID',
    example: 'clxyz123-category-id',
  })
  @Expose()
  categoryId: string;

  @ApiPropertyOptional({
    description: 'Category details',
    type: 'object',
    properties: {
      id: { type: 'string', example: 'clxyz123-category-id' },
      name: { type: 'string', example: 'Electronics' },
      slug: { type: 'string', example: 'electronics' },
    },
  })
  @Expose()
  category?: {
    id: string;
    name: string;
    slug: string;
  };

  @ApiProperty({
    description: 'Seller ID',
    example: 'clxyz123-seller-id',
  })
  @Expose()
  sellerId: string;

  @ApiPropertyOptional({
    description: 'Seller details',
    type: 'object',
    properties: {
      id: { type: 'string', example: 'clxyz123-seller-id' },
      name: { type: 'string', example: 'John Doe' },
      businessName: { type: 'string', example: 'Tech Store', nullable: true },
    },
  })
  @Expose()
  seller?: {
    id: string;
    name: string;
    businessName: string | null;
  };

  @ApiPropertyOptional({
    description: 'Product counts',
    type: 'object',
    properties: {
      images: { type: 'integer', example: 3 },
      ratings: { type: 'integer', example: 42 },
      cartItems: { type: 'integer', example: 5 },
      orderItems: { type: 'integer', example: 120 },
    },
  })
  @Expose()
  _count?: {
    images: number;
    ratings: number;
    cartItems: number;
    orderItems: number;
  };

  @ApiProperty({
    description: 'When the product was created',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'When the product was last updated',
  })
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<ProductWithRelations>) {
    // Convert Decimal to number for price and rating before assignment
    const { price, rating, ...rest } = partial;

    Object.assign(this, rest);

    if (price !== undefined && price !== null) {
      this.price =
        price && typeof price === 'object' && 'toNumber' in price
          ? price.toNumber()
          : Number(price);
    }

    if (rating !== undefined && rating !== null) {
      this.rating =
        rating && typeof rating === 'object' && 'toNumber' in rating
          ? (rating as any).toNumber()
          : Number(rating);
    }
  }
}
