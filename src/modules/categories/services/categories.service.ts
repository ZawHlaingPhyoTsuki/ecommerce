import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import {
  CloudinaryService,
  UploadOptionsType,
} from '../../cloudinary/services/cloudinary.service';
import { CategoryRepository } from '../repositories/category.repository';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQueryDto,
} from '../dtos';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(dto: CreateCategoryDto, file?: Express.Multer.File) {
    this.logger.log(`Creating category: ${dto.name}`);

    // Check if category with same name already exists
    const exists = await this.categoryRepository.existsByName(dto.name);
    if (exists) {
      throw new ConflictException(
        `Category with name "${dto.name}" already exists`,
      );
    }

    let imageUrl: string | undefined;
    let imagePublicId: string | undefined;

    // Upload image to Cloudinary if provided
    if (file) {
      try {
        const uploadResult = await this.cloudinaryService.uploadSingle(
          file,
          'CATEGORIES',
          {
            width: 800,
            height: 800,
            crop: 'fill',
          },
        );
        imageUrl = uploadResult.secure_url;
        imagePublicId = uploadResult.public_id;
        this.logger.log(`Image uploaded: ${imagePublicId}`);
      } catch (error) {
        this.logger.error('Failed to upload category image', error);
        throw new BadRequestException('Failed to upload category image');
      }
    }

    try {
      const category = await this.categoryRepository.create({
        ...dto,
        image: imageUrl,
        imagePublicId,
      });

      this.logger.log(`Category created successfully: ${category.id}`);
      return category;
    } catch (error) {
      // If category creation fails, delete the uploaded image
      if (imagePublicId) {
        await this.cloudinaryService.delete(imagePublicId).catch((err) => {
          this.logger.error(
            'Failed to cleanup image after failed creation',
            err,
          );
        });
      }
      throw error;
    }
  }

  async findAll(query: CategoryQueryDto) {
    this.logger.log('Fetching all categories');
    return this.categoryRepository.findAll(query);
  }

  async findOne(id: string) {
    this.logger.log(`Fetching category: ${id}`);

    const category = await this.categoryRepository.findOne(id);
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    return category;
  }

  async findBySlug(slug: string) {
    this.logger.log(`Fetching category by slug: ${slug}`);

    const category = await this.categoryRepository.findBySlug(slug);
    if (!category) {
      throw new NotFoundException(`Category with slug "${slug}" not found`);
    }

    return category;
  }

  async update(id: string, dto: UpdateCategoryDto, file?: Express.Multer.File) {
    this.logger.log(`Updating category: ${id}`);

    // Check if at least one field is provided
    const hasUpdates = Object.values({ ...dto, file }).some(
      (val) => val !== undefined && val !== null,
    );

    if (!hasUpdates) {
      throw new BadRequestException('At least one field must be provided');
    }

    // Check if category exists
    const existingCategory = await this.categoryRepository.findOne(id);
    if (!existingCategory) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    if (dto.name) {
      const formattedName = this.categoryRepository.formatName(dto.name);

      // Prevent no-op rename
      if (formattedName === existingCategory.name) {
        throw new ConflictException(
          `New name must be different from the old name`,
        );
      }

      // Ensure uniqueness across other categories
      const nameExists = await this.categoryRepository.existsByName(
        dto.name,
        id,
      );
      if (nameExists) {
        throw new ConflictException(
          `Category with name "${dto.name}" already exists`,
        );
      }
    }

    let imageUrl: string | undefined;
    let imagePublicId: string | undefined;
    const oldImagePublicId: string | null = existingCategory.imagePublicId;

    // Handle image update
    if (file) {
      try {
        // Use the existing public ID for replacement, or upload new
        const uploadOptions: UploadOptionsType = {
          width: 800,
          height: 800,
          crop: 'fill',
        };

        // If we have an existing image, use its public ID for replacement
        if (existingCategory.imagePublicId) {
          uploadOptions.publicId = existingCategory.imagePublicId;
        }

        const uploadResult = await this.cloudinaryService.uploadSingle(
          file,
          'CATEGORIES',
          uploadOptions,
        );

        imageUrl = uploadResult.secure_url;
        imagePublicId = uploadResult.public_id;

        this.logger.log(
          `Image ${existingCategory.imagePublicId ? 'replaced' : 'uploaded'}: ${imagePublicId}`,
        );
      } catch (error) {
        this.logger.error('Failed to upload new category image', error);
        throw new BadRequestException('Failed to upload new category image');
      }
    }

    try {
      const updatedCategory = await this.categoryRepository.update(id, {
        ...(dto.name && { name: dto.name }),
        ...(imageUrl && { image: imageUrl }),
        ...(imagePublicId && { imagePublicId }),
      });

      // Delete old image ONLY if it was replaced and was different from new one
      if (
        oldImagePublicId &&
        imagePublicId &&
        oldImagePublicId !== imagePublicId
      ) {
        await this.cloudinaryService.delete(oldImagePublicId).catch((err) => {
          this.logger.error('Failed to delete old category image', err);
        });
        this.logger.log(`Old image deleted: ${oldImagePublicId}`);
      }

      this.logger.log(`Category updated successfully: ${id}`);
      return updatedCategory;
    } catch (error) {
      // NEED CHECK
      // If update fails, delete the newly uploaded image (only if it's new, not replacement)
      if (imagePublicId && !existingCategory.imagePublicId) {
        await this.cloudinaryService.delete(imagePublicId).catch((err) => {
          this.logger.error(
            'Failed to cleanup new image after failed update',
            err,
          );
        });
      }
      throw error;
    }
  }

  async delete(id: string) {
    this.logger.log(`Deleting category: ${id}`);

    // Check if category exists
    const category = await this.categoryRepository.findOne(id);
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    // Check if category has products
    if (category._count.products > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${category._count.products} associated products`,
      );
    }

    try {
      await this.categoryRepository.delete(id);

      // Delete image from Cloudinary if exists
      if (category.imagePublicId) {
        await this.cloudinaryService
          .delete(category.imagePublicId)
          .catch((err) => {
            this.logger.error(
              'Failed to delete category image from Cloudinary',
              err,
            );
          });
        this.logger.log(`Category image deleted: ${category.imagePublicId}`);
      }

      this.logger.log(`Category deleted successfully: ${id}`);
      return { message: 'Category deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete category: ${id}`, error);
      throw error;
    }
  }
}
