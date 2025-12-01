import { Test, TestingModule } from '@nestjs/testing';
import { CategoryRepository } from './category.repository';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto, CategoryQueryDto } from '../dtos';

describe('CategoryRepository', () => {
  let repository: CategoryRepository;
  let prismaService: jest.Mocked<PrismaService>;

  const mockCategory = {
    id: 'test-id-123',
    name: 'Electronics',
    slug: 'electronics',
    image: 'https://cloudinary.com/image.jpg',
    imagePublicId: 'categories/electronics_123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      category: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<CategoryRepository>(CategoryRepository);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a category with formatted name and slug', async () => {
      const dto: CreateCategoryDto = { name: 'home appliances' };
      const expectedCategory = {
        ...mockCategory,
        name: 'Home Appliances',
        slug: 'home-appliances',
      };

      (prismaService.category.create as jest.Mock).mockResolvedValue(
        expectedCategory,
      );

      const result = await repository.create(dto);

      expect(prismaService.category.create).toHaveBeenCalledWith({
        data: {
          name: 'Home Appliances',
          slug: 'home-appliances',
          image: undefined,
          imagePublicId: undefined,
        },
      });
      expect(result).toEqual(expectedCategory);
    });

    it('should create a category with image data', async () => {
      const dto: CreateCategoryDto & { image: string; imagePublicId: string } = {
        name: 'Electronics',
        image: 'https://cloudinary.com/test.jpg',
        imagePublicId: 'categories/test_123',
      };

      (prismaService.category.create as jest.Mock).mockResolvedValue(mockCategory);

      await repository.create(dto);

      expect(prismaService.category.create).toHaveBeenCalledWith({
        data: {
          name: 'Electronics',
          slug: 'electronics',
          image: dto.image,
          imagePublicId: dto.imagePublicId,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated categories without search', async () => {
      const query: CategoryQueryDto = { page: 1, limit: 10 };
      const mockCategories = [mockCategory];

      (prismaService.category.findMany as jest.Mock).mockResolvedValue(
        mockCategories,
      );
      (prismaService.category.count as jest.Mock).mockResolvedValue(1);

      const result = await repository.findAll(query);

      expect(prismaService.category.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { products: true },
          },
        },
      });
      expect(prismaService.category.count).toHaveBeenCalledWith({ where: {} });
      expect(result).toEqual({
        data: mockCategories,
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    it('should return paginated categories with search query', async () => {
      const query: CategoryQueryDto = { page: 2, limit: 5, search: 'elec' };
      const mockCategories = [mockCategory];

      (prismaService.category.findMany as jest.Mock).mockResolvedValue(
        mockCategories,
      );
      (prismaService.category.count as jest.Mock).mockResolvedValue(10);

      const result = await repository.findAll(query);

      expect(prismaService.category.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'elec', mode: 'insensitive' } },
            { slug: { contains: 'elec', mode: 'insensitive' } },
          ],
        },
        skip: 5,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { products: true },
          },
        },
      });
      expect(result.meta).toEqual({
        total: 10,
        page: 2,
        limit: 5,
        totalPages: 2,
      });
    });

    it('should handle default pagination values', async () => {
      const query: CategoryQueryDto = {};

      (prismaService.category.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.category.count as jest.Mock).mockResolvedValue(0);

      await repository.findAll(query);

      expect(prismaService.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        }),
      );
    });

    it('should calculate totalPages correctly', async () => {
      const query: CategoryQueryDto = { page: 1, limit: 10 };

      (prismaService.category.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.category.count as jest.Mock).mockResolvedValue(25);

      const result = await repository.findAll(query);

      expect(result.meta.totalPages).toBe(3);
    });

    it('should handle zero results', async () => {
      const query: CategoryQueryDto = { page: 1, limit: 10 };

      (prismaService.category.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.category.count as jest.Mock).mockResolvedValue(0);

      const result = await repository.findAll(query);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should find a category by id', async () => {
      (prismaService.category.findUnique as jest.Mock).mockResolvedValue(
        mockCategory,
      );

      const result = await repository.findOne('test-id-123');

      expect(prismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id-123' },
        include: {
          _count: {
            select: { products: true },
          },
        },
      });
      expect(result).toEqual(mockCategory);
    });

    it('should return null if category not found', async () => {
      (prismaService.category.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findOne('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findBySlug', () => {
    it('should find a category by slug', async () => {
      (prismaService.category.findUnique as jest.Mock).mockResolvedValue(
        mockCategory,
      );

      const result = await repository.findBySlug('electronics');

      expect(prismaService.category.findUnique).toHaveBeenCalledWith({
        where: { slug: 'electronics' },
        include: {
          _count: {
            select: { products: true },
          },
        },
      });
      expect(result).toEqual(mockCategory);
    });

    it('should return null if category not found', async () => {
      (prismaService.category.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findBySlug('non-existent-slug');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update category name and regenerate slug', async () => {
      const dto: UpdateCategoryDto = { name: 'Updated Electronics' };
      const updatedCategory = {
        ...mockCategory,
        name: 'Updated Electronics',
        slug: 'updated-electronics',
      };

      (prismaService.category.update as jest.Mock).mockResolvedValue(
        updatedCategory,
      );

      const result = await repository.update('test-id', dto);

      expect(prismaService.category.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: {
          name: 'Updated Electronics',
          slug: 'updated-electronics',
        },
      });
      expect(result).toEqual(updatedCategory);
    });

    it('should update only image fields when provided', async () => {
      const dto: UpdateCategoryDto & { image: string; imagePublicId: string } = {
        image: 'https://cloudinary.com/new.jpg',
        imagePublicId: 'categories/new_456',
      };

      (prismaService.category.update as jest.Mock).mockResolvedValue(mockCategory);

      await repository.update('test-id', dto);

      expect(prismaService.category.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: {
          image: dto.image,
          imagePublicId: dto.imagePublicId,
        },
      });
    });

    it('should update both name and image fields', async () => {
      const dto: UpdateCategoryDto & { image: string; imagePublicId: string } = {
        name: 'New Name',
        image: 'https://cloudinary.com/new.jpg',
        imagePublicId: 'categories/new_456',
      };

      (prismaService.category.update as jest.Mock).mockResolvedValue(mockCategory);

      await repository.update('test-id', dto);

      expect(prismaService.category.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: {
          name: 'New Name',
          slug: 'new-name',
          image: dto.image,
          imagePublicId: dto.imagePublicId,
        },
      });
    });
  });

  describe('delete', () => {
    it('should delete a category', async () => {
      (prismaService.category.delete as jest.Mock).mockResolvedValue(mockCategory);

      const result = await repository.delete('test-id');

      expect(prismaService.category.delete).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
      expect(result).toEqual(mockCategory);
    });
  });

  describe('exists', () => {
    it('should return true if category exists', async () => {
      (prismaService.category.count as jest.Mock).mockResolvedValue(1);

      const result = await repository.exists('test-id');

      expect(prismaService.category.count).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
      expect(result).toBe(true);
    });

    it('should return false if category does not exist', async () => {
      (prismaService.category.count as jest.Mock).mockResolvedValue(0);

      const result = await repository.exists('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('existsByName', () => {
    it('should return true if category with name exists', async () => {
      (prismaService.category.count as jest.Mock).mockResolvedValue(1);

      const result = await repository.existsByName('Electronics');

      expect(prismaService.category.count).toHaveBeenCalledWith({
        where: { name: 'Electronics' },
      });
      expect(result).toBe(true);
    });

    it('should return false if category with name does not exist', async () => {
      (prismaService.category.count as jest.Mock).mockResolvedValue(0);

      const result = await repository.existsByName('NonExistent');

      expect(result).toBe(false);
    });

    it('should exclude specific id when checking name existence', async () => {
      (prismaService.category.count as jest.Mock).mockResolvedValue(0);

      await repository.existsByName('Electronics', 'exclude-id');

      expect(prismaService.category.count).toHaveBeenCalledWith({
        where: {
          name: 'Electronics',
          id: { not: 'exclude-id' },
        },
      });
    });
  });

  describe('formatName', () => {
    it('should capitalize first letter of each word', () => {
      expect(repository.formatName('electronics')).toBe('Electronics');
      expect(repository.formatName('home appliances')).toBe('Home Appliances');
    });

    it('should handle multiple spaces', () => {
      expect(repository.formatName('home  appliances')).toBe('Home Appliances');
    });

    it('should handle hyphens', () => {
      expect(repository.formatName('home-appliances')).toBe('Home-Appliances');
    });

    it('should handle underscores', () => {
      expect(repository.formatName('home_appliances')).toBe('Home Appliances');
    });

    it('should not capitalize small words in the middle', () => {
      expect(repository.formatName('lord of the rings')).toBe('Lord of the Rings');
      expect(repository.formatName('beauty and the beast')).toBe(
        'Beauty and the Beast',
      );
    });

    it('should capitalize small words at the start', () => {
      expect(repository.formatName('the lord of rings')).toBe('The Lord of Rings');
      expect(repository.formatName('a tale of two cities')).toBe(
        'A Tale of Two Cities',
      );
    });

    it('should capitalize small words at the end', () => {
      expect(repository.formatName('things to do')).toBe('Things to Do');
      expect(repository.formatName('places to go')).toBe('Places to Go');
    });

    it('should handle mixed case input', () => {
      expect(repository.formatName('HoMe ApPlIaNcEs')).toBe('Home Appliances');
    });

    it('should handle single word', () => {
      expect(repository.formatName('electronics')).toBe('Electronics');
    });

    it('should handle all small words', () => {
      expect(repository.formatName('a and the')).toBe('A and The');
    });

    it('should preserve spacing after formatting', () => {
      expect(repository.formatName('word1 word2 word3')).toBe('Word1 Word2 Word3');
    });

    it('should handle special small words like "vs" and "v"', () => {
      expect(repository.formatName('cats vs dogs')).toBe('Cats vs Dogs');
      expect(repository.formatName('smith v jones')).toBe('Smith v Jones');
    });

    it('should handle "via"', () => {
      expect(repository.formatName('travel via train')).toBe('Travel via Train');
    });
  });

  describe('generateSlug', () => {
    it('should generate lowercase slug from name', () => {
      expect(repository.generateSlug('Electronics')).toBe('electronics');
      expect(repository.generateSlug('Home Appliances')).toBe('home-appliances');
    });

    it('should replace spaces with hyphens', () => {
      expect(repository.generateSlug('Home And Garden')).toBe('home-and-garden');
    });

    it('should remove special characters', () => {
      expect(repository.generateSlug('Electronics & Gadgets!')).toBe(
        'electronics-gadgets',
      );
      expect(repository.generateSlug('Books: Fiction')).toBe('books-fiction');
    });

    it('should handle multiple spaces', () => {
      expect(repository.generateSlug('Home  Appliances')).toBe('home-appliances');
    });

    it('should replace multiple hyphens with single hyphen', () => {
      expect(repository.generateSlug('Home---Appliances')).toBe('home-appliances');
    });

    it('should trim whitespace', () => {
      expect(repository.generateSlug('  Electronics  ')).toBe('electronics');
    });

    it('should handle mixed case', () => {
      expect(repository.generateSlug('HoMe ApPlIaNcEs')).toBe('home-appliances');
    });

    it('should handle underscores', () => {
      expect(repository.generateSlug('home_appliances')).toBe('home-appliances');
    });

    it('should format name before generating slug', () => {
      expect(repository.generateSlug('lord of the rings')).toBe(
        'lord-of-the-rings',
      );
    });

    it('should handle numbers', () => {
      expect(repository.generateSlug('Category 123')).toBe('category-123');
    });

    it('should handle accented characters by removing them', () => {
      // Note: This test assumes the current implementation removes accents
      // The actual behavior depends on the regex [^\w\s-]
      expect(repository.generateSlug('Café')).toBe('caf');
    });
  });
});