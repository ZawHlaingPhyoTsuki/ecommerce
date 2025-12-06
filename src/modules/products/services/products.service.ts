import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ProductsRepository } from '../respositories/products.repository';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  ProductDto,
} from '../dtos';
import { CloudinaryService } from 'src/modules/cloudinary/services/cloudinary.service';
import { convertDecimal } from 'src/common/utils/prisma.utils';

// Infer types from repository return types
type ProductWithRelations = NonNullable<
  Awaited<ReturnType<ProductsRepository['findOne']>>
>;
type ProductImage = ProductWithRelations['images'][number];

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private readonly MAX_IMAGES = 5;

  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Transform product data from Prisma to DTO
   */
  private transformProduct(product: ProductWithRelations): ProductDto {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: convertDecimal(product.price),
      images: product.images?.map((img: ProductImage) => ({
        id: img.id,
        productId: img.productId,
        url: img.url,
        order: img.order,
        createdAt: img.createdAt,
      })),
      stock: product.stock,
      isAvailable: product.isAvailable,
      rating: convertDecimal(product.rating),
      ratingCount: product.ratingCount,
      categoryId: product.categoryId,
      category: product.category,
      sellerId: product.sellerId,
      seller: product.seller,
      _count: product._count,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  /**
   * Create a new product
   */
  async create(
    sellerId: string,
    dto: CreateProductDto,
    files?: Express.Multer.File[],
  ) {
    this.logger.log(`Creating product: ${dto.name} for seller: ${sellerId}`);

    // Validate category exists
    const categoryExists = await this.productsRepository.categoryExists(
      dto.categoryId,
    );
    if (!categoryExists) {
      throw new BadRequestException(
        `Category with ID "${dto.categoryId}" not found`,
      );
    }

    // Validate image count
    if (files && files.length > this.MAX_IMAGES) {
      throw new BadRequestException(
        `Maximum ${this.MAX_IMAGES} images allowed`,
      );
    }

    let uploadedImages: Array<{
      url: string;
      publicId: string;
      order: number;
    }> = [];

    // Upload images to Cloudinary if provided
    if (files && files.length > 0) {
      try {
        const uploadResults = await this.cloudinaryService.uploadMany(
          files,
          'PRODUCTS',
          {
            width: 1000,
            height: 1000,
            crop: 'fill',
          },
        );

        uploadedImages = uploadResults.map((result, index) => ({
          url: result.secure_url,
          publicId: result.public_id,
          order: index,
        }));

        this.logger.log(`Uploaded ${uploadedImages.length} images`);
      } catch (error) {
        this.logger.error('Failed to upload product images', error);
        throw new BadRequestException('Failed to upload product images');
      }
    }

    try {
      const product = await this.productsRepository.create(sellerId, {
        ...dto,
        images: uploadedImages,
      });

      this.logger.log(`Product created successfully: ${product.id}`);
      return this.transformProduct(product);
    } catch (error) {
      // Cleanup uploaded images if product creation fails
      if (uploadedImages.length > 0) {
        await this.cloudinaryService
          .deleteMany(uploadedImages.map((img) => img.publicId))
          .catch((err) => {
            this.logger.error(
              'Failed to cleanup images after failed creation',
              err,
            );
          });
      }
      throw error;
    }
  }

  /**
   * Find all products with filtering and pagination
   */
  async findAll(query: ProductQueryDto) {
    this.logger.log('Fetching all products');
    const result = await this.productsRepository.findAll(query);

    return {
      data: result.data.map((product) => this.transformProduct(product)),
      meta: result.meta,
    };
  }

  /**
   * Find a product by ID
   */
  async findOne(id: string) {
    this.logger.log(`Fetching product: ${id}`);

    const product = await this.productsRepository.findOne(id);
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    return this.transformProduct(product);
  }

  /**
   * Find a product by slug and seller ID
   */
  async findBySlug(sellerId: string, slug: string) {
    this.logger.log(
      `Fetching product by slug: ${slug} for seller: ${sellerId}`,
    );

    const product = await this.productsRepository.findBySlug(sellerId, slug);
    if (!product) {
      throw new NotFoundException(
        `Product with slug "${slug}" not found for this seller`,
      );
    }

    return this.transformProduct(product);
  }

  /**
   * Update a product
   */
  async update(
    id: string,
    sellerId: string,
    dto: UpdateProductDto,
    files?: Express.Multer.File[],
  ) {
    this.logger.log(`Updating product: ${id}`);

    // Check if at least one field is provided
    const hasUpdates = Object.values({ ...dto, files }).some(
      (val) =>
        val !== undefined &&
        val !== null &&
        (Array.isArray(val) ? val.length > 0 : true),
    );

    if (!hasUpdates) {
      throw new BadRequestException('At least one field must be provided');
    }

    // Check if product exists
    const existingProduct = await this.productsRepository.findOne(id);
    if (!existingProduct) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    // Check if product belongs to seller
    if (existingProduct.sellerId !== sellerId) {
      throw new ForbiddenException(
        'You do not have permission to update this product',
      );
    }

    // Validate category if provided and different from current
    if (dto.categoryId && dto.categoryId !== existingProduct.categoryId) {
      const categoryExists = await this.productsRepository.categoryExists(
        dto.categoryId,
      );
      if (!categoryExists) {
        throw new BadRequestException(
          `Category with ID "${dto.categoryId}" not found`,
        );
      }
    }

    // Handle new images
    let uploadedImages: Array<{
      url: string;
      publicId: string;
      order: number;
    }> = [];

    if (files && files.length > 0) {
      const currentImageCount = existingProduct.images?.length || 0;
      const totalImages = currentImageCount + files.length;

      if (totalImages > this.MAX_IMAGES) {
        throw new BadRequestException(
          `Maximum ${this.MAX_IMAGES} images allowed. Current: ${currentImageCount}, Adding: ${files.length}`,
        );
      }

      try {
        const uploadResults = await this.cloudinaryService.uploadMany(
          files,
          'PRODUCTS',
          {
            width: 1000,
            height: 1000,
            crop: 'fill',
          },
        );

        uploadedImages = uploadResults.map((result, index) => ({
          url: result.secure_url,
          publicId: result.public_id,
          order: currentImageCount + index,
        }));

        this.logger.log(`Uploaded ${uploadedImages.length} new images`);
      } catch (error) {
        this.logger.error('Failed to upload new product images', error);
        throw new BadRequestException('Failed to upload new product images');
      }
    }

    try {
      // Update product (with images if provided)
      // Repository handles slug generation internally when name changes
      const product = await this.productsRepository.update(id, sellerId, {
        ...dto,
        ...(uploadedImages.length > 0 && { images: uploadedImages }),
      });

      this.logger.log(`Product updated successfully: ${id}`);
      return this.transformProduct(product);
    } catch (error) {
      // Cleanup newly uploaded images if update fails
      if (uploadedImages.length > 0) {
        await this.cloudinaryService
          .deleteMany(uploadedImages.map((img) => img.publicId))
          .catch((err) => {
            this.logger.error(
              'Failed to cleanup new images after failed update',
              err,
            );
          });
      }
      throw error;
    }
  }

  /**
   * Delete a product
   */
  async delete(id: string, sellerId: string) {
    this.logger.log(`Deleting product: ${id}`);

    // Check if product exists
    const product = await this.productsRepository.findOne(id);
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    // Check if product belongs to seller
    if (product.sellerId !== sellerId) {
      throw new ForbiddenException(
        'You do not have permission to delete this product',
      );
    }

    try {
      await this.productsRepository.delete(id);

      // Delete images from Cloudinary if they exist
      if (product.images && product.images.length > 0) {
        const publicIds: string[] = product.images.map((img) => img.publicId);
        await this.cloudinaryService.deleteMany(publicIds).catch((err) => {
          this.logger.error(
            'Failed to delete product images from Cloudinary',
            err,
          );
        });
        this.logger.log(`Deleted ${publicIds.length} product images`);
      }

      this.logger.log(`Product deleted successfully: ${id}`);
      return { message: 'Product deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete product: ${id}`, error);
      throw error;
    }
  }

  /**
   * Remove specific images from a product
   */
  async removeImages(id: string, sellerId: string, imageIds: string[]) {
    this.logger.log(`Removing images from product: ${id}`);

    if (!imageIds || imageIds.length === 0) {
      throw new BadRequestException('No image IDs provided');
    }

    // Check if product exists
    const product = await this.productsRepository.findOne(id);
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    // Check if product belongs to seller
    if (product.sellerId !== sellerId) {
      throw new ForbiddenException(
        'You do not have permission to modify this product',
      );
    }

    // Get the images to be deleted
    const imagesToDelete =
      await this.productsRepository.getImagesByIds(imageIds);

    // Validate that all images belong to this product
    const invalidImages = imagesToDelete.filter((img) => img.productId !== id);
    if (invalidImages.length > 0) {
      throw new BadRequestException(
        'Some images do not belong to this product',
      );
    }

    // Validate that all provided IDs exist
    if (imagesToDelete.length !== imageIds.length) {
      throw new BadRequestException('Some image IDs are invalid');
    }

    try {
      // Delete images from database
      await this.productsRepository.removeImages(imageIds);

      // Delete images from Cloudinary
      const publicIds: string[] = imagesToDelete.map((img) => img.publicId);
      await this.cloudinaryService.deleteMany(publicIds).catch((err) => {
        this.logger.error('Failed to delete images from Cloudinary', err);
      });

      this.logger.log(`Removed ${imageIds.length} images from product`);

      // Return updated product
      const updatedProduct = await this.productsRepository.findOne(id);
      if (!updatedProduct) {
        throw new NotFoundException(`Product with ID "${id}" not found`);
      }
      return this.transformProduct(updatedProduct);
    } catch (error) {
      this.logger.error(`Failed to remove images from product: ${id}`, error);
      throw error;
    }
  }
}
