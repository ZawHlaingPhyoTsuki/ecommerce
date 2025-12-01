import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoryRepository } from '../repositories/category.repository';
import { CloudinaryService } from '../../cloudinary/services/cloudinary.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQueryDto,
} from '../dtos';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoryRepository: jest.Mocked<CategoryRepository>;
  let cloudinaryService: jest.Mocked<CloudinaryService>;

  const mockCategory = {
    id: 'test-id-123',
    name: 'Electronics',
    slug: 'electronics',
    image: 'https://cloudinary.com/image.jpg',
    imagePublicId: 'categories/electronics_123',
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { products: 0 },
  };

  const mockUploadResult = {
    secure_url: 'https://cloudinary.com/image.jpg',
    public_id: 'categories/electronics_123',
  };

  beforeEach(async () => {
    const mockCategoryRepository = {
      existsByName: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findBySlug: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      formatName: jest.fn((name) => name),
    };

    const mockCloudinaryService = {
      uploadSingle: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: CategoryRepository,
          useValue: mockCategoryRepository,
        },
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    categoryRepository = module.get(CategoryRepository);
    cloudinaryService = module.get(CloudinaryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateCategoryDto = { name: 'Electronics' };

    it('should create a category successfully without image', async () => {
      categoryRepository.existsByName.mockResolvedValue(false);
      categoryRepository.create.mockResolvedValue(mockCategory);

      const result = await service.create(createDto);

      expect(categoryRepository.existsByName).toHaveBeenCalledWith('Electronics');
      expect(categoryRepository.create).toHaveBeenCalledWith({
        name: 'Electronics',
        image: undefined,
        imagePublicId: undefined,
      });
      expect(result).toEqual(mockCategory);
    });

    it('should create a category successfully with image', async () => {
      const file = {
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg',
        originalname: 'test.jpg',
      } as Express.Multer.File;

      categoryRepository.existsByName.mockResolvedValue(false);
      cloudinaryService.uploadSingle.mockResolvedValue(mockUploadResult as any);
      categoryRepository.create.mockResolvedValue(mockCategory);

      const result = await service.create(createDto, file);

      expect(cloudinaryService.uploadSingle).toHaveBeenCalledWith(
        file,
        'CATEGORIES',
        {
          width: 800,
          height: 800,
          crop: 'fill',
        },
      );
      expect(categoryRepository.create).toHaveBeenCalledWith({
        name: 'Electronics',
        image: mockUploadResult.secure_url,
        imagePublicId: mockUploadResult.public_id,
      });
      expect(result).toEqual(mockCategory);
    });

    it('should throw ConflictException if category name already exists', async () => {
      categoryRepository.existsByName.mockResolvedValue(true);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createDto)).rejects.toThrow(
        'Category with name "Electronics" already exists',
      );
      expect(categoryRepository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if image upload fails', async () => {
      const file = {
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg',
        originalname: 'test.jpg',
      } as Express.Multer.File;

      categoryRepository.existsByName.mockResolvedValue(false);
      cloudinaryService.uploadSingle.mockRejectedValue(new Error('Upload failed'));

      await expect(service.create(createDto, file)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto, file)).rejects.toThrow(
        'Failed to upload category image',
      );
      expect(categoryRepository.create).not.toHaveBeenCalled();
    });

    it('should cleanup uploaded image if category creation fails', async () => {
      const file = {
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg',
        originalname: 'test.jpg',
      } as Express.Multer.File;

      categoryRepository.existsByName.mockResolvedValue(false);
      cloudinaryService.uploadSingle.mockResolvedValue(mockUploadResult as any);
      categoryRepository.create.mockRejectedValue(new Error('Database error'));
      cloudinaryService.delete.mockResolvedValue({} as any);

      await expect(service.create(createDto, file)).rejects.toThrow('Database error');
      expect(cloudinaryService.delete).toHaveBeenCalledWith(
        mockUploadResult.public_id,
      );
    });

    it('should handle cleanup failure gracefully', async () => {
      const file = {
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg',
        originalname: 'test.jpg',
      } as Express.Multer.File;

      categoryRepository.existsByName.mockResolvedValue(false);
      cloudinaryService.uploadSingle.mockResolvedValue(mockUploadResult as any);
      categoryRepository.create.mockRejectedValue(new Error('Database error'));
      cloudinaryService.delete.mockRejectedValue(new Error('Cleanup failed'));

      await expect(service.create(createDto, file)).rejects.toThrow('Database error');
      expect(cloudinaryService.delete).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated categories', async () => {
      const query: CategoryQueryDto = { page: 1, limit: 10 };
      const mockResult = {
        data: [mockCategory],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      categoryRepository.findAll.mockResolvedValue(mockResult);

      const result = await service.findAll(query);

      expect(categoryRepository.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResult);
    });

    it('should handle search query', async () => {
      const query: CategoryQueryDto = { page: 1, limit: 10, search: 'elec' };
      const mockResult = {
        data: [mockCategory],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      categoryRepository.findAll.mockResolvedValue(mockResult);

      const result = await service.findAll(query);

      expect(categoryRepository.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResult);
    });

    it('should handle empty results', async () => {
      const query: CategoryQueryDto = { page: 1, limit: 10 };
      const mockResult = {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
      };

      categoryRepository.findAll.mockResolvedValue(mockResult);

      const result = await service.findAll(query);

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a category by id', async () => {
      categoryRepository.findOne.mockResolvedValue(mockCategory);

      const result = await service.findOne('test-id-123');

      expect(categoryRepository.findOne).toHaveBeenCalledWith('test-id-123');
      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException if category not found', async () => {
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        'Category with ID "non-existent-id" not found',
      );
    });
  });

  describe('findBySlug', () => {
    it('should return a category by slug', async () => {
      categoryRepository.findBySlug.mockResolvedValue(mockCategory);

      const result = await service.findBySlug('electronics');

      expect(categoryRepository.findBySlug).toHaveBeenCalledWith('electronics');
      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException if category not found', async () => {
      categoryRepository.findBySlug.mockResolvedValue(null);

      await expect(service.findBySlug('non-existent-slug')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findBySlug('non-existent-slug')).rejects.toThrow(
        'Category with slug "non-existent-slug" not found',
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateCategoryDto = { name: 'Updated Electronics' };

    it('should throw BadRequestException if no fields provided', async () => {
      await expect(service.update('test-id', {})).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('test-id', {})).rejects.toThrow(
        'At least one field must be provided',
      );
    });

    it('should throw NotFoundException if category does not exist', async () => {
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent-id', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if new name is same as old name', async () => {
      categoryRepository.findOne.mockResolvedValue(mockCategory);
      categoryRepository.formatName.mockReturnValue('Electronics');

      const dto: UpdateCategoryDto = { name: 'electronics' };

      await expect(service.update('test-id', dto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.update('test-id', dto)).rejects.toThrow(
        'New name must be different from the old name',
      );
    });

    it('should update category name successfully', async () => {
      const updatedCategory = { ...mockCategory, name: 'Updated Electronics' };
      categoryRepository.findOne.mockResolvedValue(mockCategory);
      categoryRepository.formatName.mockReturnValue('Updated Electronics');
      categoryRepository.update.mockResolvedValue(updatedCategory);

      const result = await service.update('test-id', updateDto);

      expect(categoryRepository.update).toHaveBeenCalledWith('test-id', {
        name: 'Updated Electronics',
      });
      expect(result).toEqual(updatedCategory);
    });

    it('should update category image successfully (new image)', async () => {
      const file = {
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg',
        originalname: 'new-test.jpg',
      } as Express.Multer.File;

      const categoryWithoutImage = { ...mockCategory, imagePublicId: null };
      const newUploadResult = {
        secure_url: 'https://cloudinary.com/new-image.jpg',
        public_id: 'categories/electronics_456',
      };

      categoryRepository.findOne.mockResolvedValue(categoryWithoutImage);
      cloudinaryService.uploadSingle.mockResolvedValue(newUploadResult as any);
      categoryRepository.update.mockResolvedValue({
        ...categoryWithoutImage,
        image: newUploadResult.secure_url,
        imagePublicId: newUploadResult.public_id,
      });

      const result = await service.update('test-id', {}, file);

      expect(cloudinaryService.uploadSingle).toHaveBeenCalledWith(
        file,
        'CATEGORIES',
        {
          width: 800,
          height: 800,
          crop: 'fill',
        },
      );
      expect(result.image).toBe(newUploadResult.secure_url);
    });

    it('should replace existing image when updating', async () => {
      const file = {
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg',
        originalname: 'replacement.jpg',
      } as Express.Multer.File;

      const newUploadResult = {
        secure_url: 'https://cloudinary.com/new-image.jpg',
        public_id: 'categories/electronics_999',
      };

      categoryRepository.findOne.mockResolvedValue(mockCategory);
      cloudinaryService.uploadSingle.mockResolvedValue(newUploadResult as any);
      categoryRepository.update.mockResolvedValue({
        ...mockCategory,
        image: newUploadResult.secure_url,
        imagePublicId: newUploadResult.public_id,
      });
      cloudinaryService.delete.mockResolvedValue({} as any);

      const result = await service.update('test-id', {}, file);

      expect(cloudinaryService.uploadSingle).toHaveBeenCalledWith(
        file,
        'CATEGORIES',
        expect.objectContaining({
          publicId: mockCategory.imagePublicId,
        }),
      );
      expect(cloudinaryService.delete).toHaveBeenCalledWith(
        mockCategory.imagePublicId,
      );
      expect(result.imagePublicId).toBe(newUploadResult.public_id);
    });

    it('should not delete old image if replacement uses same public ID', async () => {
      const file = {
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg',
        originalname: 'replacement.jpg',
      } as Express.Multer.File;

      const samePublicIdResult = {
        secure_url: 'https://cloudinary.com/updated-image.jpg',
        public_id: mockCategory.imagePublicId, // Same public ID
      };

      categoryRepository.findOne.mockResolvedValue(mockCategory);
      cloudinaryService.uploadSingle.mockResolvedValue(samePublicIdResult as any);
      categoryRepository.update.mockResolvedValue({
        ...mockCategory,
        image: samePublicIdResult.secure_url,
      });

      await service.update('test-id', {}, file);

      expect(cloudinaryService.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if image upload fails during update', async () => {
      const file = {
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg',
        originalname: 'test.jpg',
      } as Express.Multer.File;

      categoryRepository.findOne.mockResolvedValue(mockCategory);
      cloudinaryService.uploadSingle.mockRejectedValue(new Error('Upload failed'));

      await expect(service.update('test-id', {}, file)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('test-id', {}, file)).rejects.toThrow(
        'Failed to upload new category image',
      );
    });

    it('should cleanup new image if update fails (not replacement)', async () => {
      const file = {
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg',
        originalname: 'test.jpg',
      } as Express.Multer.File;

      const categoryWithoutImage = { ...mockCategory, imagePublicId: null };
      const newUploadResult = {
        secure_url: 'https://cloudinary.com/new-image.jpg',
        public_id: 'categories/new_123',
      };

      categoryRepository.findOne.mockResolvedValue(categoryWithoutImage);
      cloudinaryService.uploadSingle.mockResolvedValue(newUploadResult as any);
      categoryRepository.update.mockRejectedValue(new Error('Update failed'));
      cloudinaryService.delete.mockResolvedValue({} as any);

      await expect(service.update('test-id', {}, file)).rejects.toThrow(
        'Update failed',
      );
      expect(cloudinaryService.delete).toHaveBeenCalledWith(
        newUploadResult.public_id,
      );
    });

    it('should not cleanup image if update fails during replacement', async () => {
      const file = {
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg',
        originalname: 'test.jpg',
      } as Express.Multer.File;

      const newUploadResult = {
        secure_url: 'https://cloudinary.com/new-image.jpg',
        public_id: 'categories/new_123',
      };

      categoryRepository.findOne.mockResolvedValue(mockCategory);
      cloudinaryService.uploadSingle.mockResolvedValue(newUploadResult as any);
      categoryRepository.update.mockRejectedValue(new Error('Update failed'));

      await expect(service.update('test-id', {}, file)).rejects.toThrow(
        'Update failed',
      );
      // Should not cleanup because existing image was present
      expect(cloudinaryService.delete).not.toHaveBeenCalled();
    });

    it('should handle old image deletion failure gracefully', async () => {
      const file = {
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg',
        originalname: 'test.jpg',
      } as Express.Multer.File;

      const newUploadResult = {
        secure_url: 'https://cloudinary.com/new-image.jpg',
        public_id: 'categories/new_123',
      };

      categoryRepository.findOne.mockResolvedValue(mockCategory);
      cloudinaryService.uploadSingle.mockResolvedValue(newUploadResult as any);
      categoryRepository.update.mockResolvedValue({
        ...mockCategory,
        image: newUploadResult.secure_url,
        imagePublicId: newUploadResult.public_id,
      });
      cloudinaryService.delete.mockRejectedValue(
        new Error('Delete failed'),
      );

      const result = await service.update('test-id', {}, file);

      // Should still succeed even if old image deletion fails
      expect(result).toBeDefined();
      expect(cloudinaryService.delete).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete category successfully without image', async () => {
      const categoryWithoutImage = { ...mockCategory, imagePublicId: null };
      categoryRepository.findOne.mockResolvedValue(categoryWithoutImage);
      categoryRepository.delete.mockResolvedValue(categoryWithoutImage);

      const result = await service.delete('test-id');

      expect(categoryRepository.delete).toHaveBeenCalledWith('test-id');
      expect(cloudinaryService.delete).not.toHaveBeenCalled();
      expect(result).toEqual({ message: 'Category deleted successfully' });
    });

    it('should delete category and its image from Cloudinary', async () => {
      categoryRepository.findOne.mockResolvedValue(mockCategory);
      categoryRepository.delete.mockResolvedValue(mockCategory);
      cloudinaryService.delete.mockResolvedValue({} as any);

      const result = await service.delete('test-id');

      expect(categoryRepository.delete).toHaveBeenCalledWith('test-id');
      expect(cloudinaryService.delete).toHaveBeenCalledWith(
        mockCategory.imagePublicId,
      );
      expect(result).toEqual({ message: 'Category deleted successfully' });
    });

    it('should throw NotFoundException if category does not exist', async () => {
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(service.delete('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.delete('non-existent-id')).rejects.toThrow(
        'Category with ID "non-existent-id" not found',
      );
      expect(categoryRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if category has products', async () => {
      const categoryWithProducts = { ...mockCategory, _count: { products: 5 } };
      categoryRepository.findOne.mockResolvedValue(categoryWithProducts);

      await expect(service.delete('test-id')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.delete('test-id')).rejects.toThrow(
        'Cannot delete category with 5 associated products',
      );
      expect(categoryRepository.delete).not.toHaveBeenCalled();
    });

    it('should handle Cloudinary deletion failure gracefully', async () => {
      categoryRepository.findOne.mockResolvedValue(mockCategory);
      categoryRepository.delete.mockResolvedValue(mockCategory);
      cloudinaryService.delete.mockRejectedValue(
        new Error('Cloudinary error'),
      );

      const result = await service.delete('test-id');

      // Should still succeed even if Cloudinary deletion fails
      expect(result).toEqual({ message: 'Category deleted successfully' });
      expect(cloudinaryService.delete).toHaveBeenCalled();
    });

    it('should propagate database deletion errors', async () => {
      categoryRepository.findOne.mockResolvedValue(mockCategory);
      categoryRepository.delete.mockRejectedValue(new Error('Database error'));

      await expect(service.delete('test-id')).rejects.toThrow('Database error');
    });
  });
});