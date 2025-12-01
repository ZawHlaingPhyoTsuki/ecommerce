import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQueryDto,
} from '../dtos';
import { Prisma } from 'generated/prisma/client';

@Injectable()
export class CategoryRepository {
  private readonly logger = new Logger(CategoryRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreateCategoryDto & { image?: string; imagePublicId?: string },
  ) {
    this.logger.log(`Creating category: ${data.name}`);

    return this.prisma.category.create({
      data: {
        name: this.formatName(data.name),
        slug: this.generateSlug(data.name),
        image: data.image,
        imagePublicId: data.imagePublicId,
      },
    });
  }

  async findAll(query: CategoryQueryDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CategoryWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { slug: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    this.logger.log(
      `Fetching categories - Page: ${page}, Limit: ${limit}, Search: ${search || 'none'}`,
    );

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { products: true },
          },
        },
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      data: categories,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    this.logger.log(`Fetching category by ID: ${id}`);

    return this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    this.logger.log(`Fetching category by slug: ${slug}`);

    return this.prisma.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async update(
    id: string,
    data: UpdateCategoryDto & { image?: string; imagePublicId?: string },
  ) {
    this.logger.log(`Updating category: ${id}`);

    const updateData: Prisma.CategoryUpdateInput = {};

    if (data.name) {
      updateData.name = this.formatName(data.name);
      updateData.slug = this.generateSlug(data.name);
    }

    if (data.image !== undefined) {
      updateData.image = data.image;
    }

    if (data.imagePublicId !== undefined) {
      updateData.imagePublicId = data.imagePublicId;
    }

    return this.prisma.category.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    this.logger.log(`Deleting category: ${id}`);

    return this.prisma.category.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.category.count({
      where: { id },
    });
    return count > 0;
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const formattedName = this.formatName(name);
    const count = await this.prisma.category.count({
      where: {
        name: formattedName,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
    return count > 0;
  }

  formatName(name: string): string {
    const smallWords =
      /^(a|an|and|as|at|but|by|en|for|if|in|of|on|or|the|to|v\.?|vs\.?|via)$/i;

    return name
      .toLowerCase()
      .split(/[\s\-_]+/) // Split by spaces, hyphens, and underscores
      .map((word, index, words) => {
        // Don't capitalize small words unless they're the first or last word
        if (index > 0 && index < words.length - 1 && smallWords.test(word)) {
          return word;
        }

        // Capitalize first letter of each word
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }

  generateSlug(name: string): string {
    const generatedName = this.formatName(name);
    return generatedName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
  }
}
