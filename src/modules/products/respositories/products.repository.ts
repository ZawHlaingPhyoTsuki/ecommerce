import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateProductDto, ProductQueryDto, UpdateProductDto } from '../dtos';
import slugify from 'slugify';
import { Prisma } from 'generated/prisma/client';

interface ProductImageData {
  url: string;
  publicId: string;
  order: number;
}

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a unique slug for a product
   */
  async generateSlug(name: string, sellerId: string): Promise<string> {
    const baseSlug = slugify(name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    // Check if slug exists for this seller
    while (
      await this.prisma.product.findUnique({
        where: { sellerId_slug: { sellerId, slug } },
      })
    ) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * Get the include object for product queries
   */
  private getProductInclude() {
    return {
      images: {
        orderBy: { order: 'asc' as const },
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      seller: {
        select: {
          id: true,
          name: true,
          businessName: true,
        },
      },
      _count: {
        select: {
          images: true,
          ratings: true,
          cartItems: true,
          orderItems: true,
        },
      },
    };
  }

  /**
   * Create a new product
   */
  async create(
    sellerId: string,
    dto: CreateProductDto & {
      images?: ProductImageData[];
    },
  ) {
    const slug = await this.generateSlug(dto.name, sellerId);

    return this.prisma.product.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        price: dto.price,
        stock: dto.stock ?? 0,
        isAvailable: dto.isAvailable ?? true,
        categoryId: dto.categoryId,
        sellerId,
        ...(dto.images &&
          dto.images.length > 0 && {
            images: {
              create: dto.images,
            },
          }),
      },
      include: this.getProductInclude(),
    });
  }

  /**
   * Find all products with filtering and pagination
   */
  async findAll(query: ProductQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      sellerId,
      minPrice,
      maxPrice,
      minRating,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(categoryId && { categoryId }),
      ...(sellerId && { sellerId }),
      ...(minPrice !== undefined && { price: { gte: minPrice } }),
      ...(maxPrice !== undefined && {
        price: {
          ...(minPrice !== undefined && { gte: minPrice }),
          lte: maxPrice,
        },
      }),
      ...(minRating !== undefined && { rating: { gte: minRating } }),
    };

    // Build orderBy clause
    const orderBy: Prisma.ProductOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: this.getProductInclude(),
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find a product by ID
   */
  async findOne(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: this.getProductInclude(),
    });
  }

  /**
   * Find a product by slug and seller ID
   */
  async findBySlug(sellerId: string, slug: string) {
    return this.prisma.product.findUnique({
      where: { sellerId_slug: { sellerId, slug } },
      include: this.getProductInclude(),
    });
  }

  /**
   * Update a product (with optional images)
   */
  async update(
    id: string,
    dto: UpdateProductDto & {
      slug?: string;
      images?: ProductImageData[];
    },
  ) {
    // If no images to add, simple update
    if (!dto.images || dto.images.length === 0) {
      return this.prisma.product.update({
        where: { id },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.slug && { slug: dto.slug }),
          ...(dto.description !== undefined && {
            description: dto.description,
          }),
          ...(dto.price !== undefined && { price: dto.price }),
          ...(dto.stock !== undefined && { stock: dto.stock }),
          ...(dto.isAvailable !== undefined && {
            isAvailable: dto.isAvailable,
          }),
          ...(dto.categoryId && { categoryId: dto.categoryId }),
        },
        include: this.getProductInclude(),
      });
    }

    // If images to add, use transaction to handle ordering
    return this.prisma.$transaction(async (tx) => {
      // Get current max order
      const maxOrder = await tx.productImage.findFirst({
        where: { productId: id },
        orderBy: { order: 'desc' },
        select: { order: true },
      });

      const startOrder = maxOrder ? maxOrder.order + 1 : 0;

      // Update product with new images
      return tx.product.update({
        where: { id },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.slug && { slug: dto.slug }),
          ...(dto.description !== undefined && {
            description: dto.description,
          }),
          ...(dto.price !== undefined && { price: dto.price }),
          ...(dto.stock !== undefined && { stock: dto.stock }),
          ...(dto.isAvailable !== undefined && {
            isAvailable: dto.isAvailable,
          }),
          ...(dto.categoryId && { categoryId: dto.categoryId }),
          images: {
            create: dto.images!.map((img, index) => ({
              url: img.url,
              publicId: img.publicId,
              order: startOrder + index,
            })),
          },
        },
        include: this.getProductInclude(),
      });
    });
  }

  /**
   * Delete a product
   */
  async delete(id: string) {
    return this.prisma.product.delete({
      where: { id },
    });
  }

  /**
   * Remove images from a product
   */
  async removeImages(imageIds: string[]) {
    return await this.prisma.productImage.deleteMany({
      where: {
        id: {
          in: imageIds,
        },
      },
    });
  }

  /**
   * Get product images
   */
  async getProductImages(productId: string) {
    return await this.prisma.productImage.findMany({
      where: { productId },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Get images by IDs
   */
  async getImagesByIds(imageIds: string[]) {
    return await this.prisma.productImage.findMany({
      where: {
        id: {
          in: imageIds,
        },
      },
    });
  }

  /**
   * Check if a category exists
   */
  async categoryExists(categoryId: string): Promise<boolean> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    return !!category;
  }

  /**
   * Check if a product belongs to a seller
   */
  async belongsToSeller(productId: string, sellerId: string): Promise<boolean> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { sellerId: true },
    });
    return product?.sellerId === sellerId;
  }
}
