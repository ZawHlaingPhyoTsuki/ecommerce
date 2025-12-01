import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import type { Category, Prisma } from 'generated/prisma/client';

type CategoryWithCount = Category & {
  _count: Prisma.CategoryCountOutputType;
};

export class CategoryEntity implements CategoryWithCount {
  @ApiProperty({
    description: 'Unique identifier of the category',
    example: 'clxyz123',
  })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Name of the category', example: 'Electronics' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'URL-friendly slug', example: 'electronics' })
  @Expose()
  slug: string;

  @ApiProperty({
    description: 'URL of the category image (Cloudinary)',
    type: String,
    nullable: true,
    example: 'https://res.cloudinary.com/.../category-image.jpg',
  })
  @Expose()
  image: string | null;

  // @ApiProperty({
  //   description: 'Cloudinary public ID (used for deletion)',
  //   type: String,
  //   nullable: true,
  //   example: 'categories/electronics_v1',
  // })
  @Exclude()
  imagePublicId: string | null;

  @ApiProperty({
    description: 'Number of products in this category',
    type: 'object',
    properties: {
      products: {
        type: 'integer',
        example: 42,
      },
    },
  })
  @Expose()
  _count: {
    products: number;
  };

  @ApiProperty({ description: 'When the category was created' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'When the category was last updated' })
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<CategoryEntity>) {
    Object.assign(this, partial);
  }
}
