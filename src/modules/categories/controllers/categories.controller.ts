import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { CategoriesService } from '../services/categories.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQueryDto,
  CreateCategorySwaggerDto,
  UpdateCategorySwaggerDto,
  CategoryIdParamDto,
  CategorySlugParamDto,
  CategoryResponseDto,
  CategoriesResponseDto,
} from '../dtos';
import { AllowAnonymous, Roles } from '@thallesp/nestjs-better-auth';
import {
  ApiResponseDto,
  PaginatedResponseDto,
} from 'src/common/dtos/api-response.dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Roles(['ADMIN'])
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Create a new category' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateCategorySwaggerDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    type: CategoryResponseDto,
  })
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoriesService.create(
      createCategoryDto,
      file,
    );

    return ApiResponseDto.created('Category created successfully', category);
  }

  @AllowAnonymous()
  @Get()
  @ApiOperation({ summary: 'Get all categories with pagination and search' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    type: CategoriesResponseDto,
  })
  async findAll(
    @Query() query: CategoryQueryDto,
  ): Promise<CategoriesResponseDto> {
    const result = await this.categoriesService.findAll(query);

    return PaginatedResponseDto.paginated(
      'Categories retrieved successfully',
      result.data,
      result.meta,
    );
  }

  @AllowAnonymous()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a category by slug' })
  @ApiResponse({
    status: 200,
    description: 'Category retrieved successfully',
    type: CategoryResponseDto,
  })
  async findBySlug(
    @Param() params: CategorySlugParamDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoriesService.findBySlug(params.slug);

    return ApiResponseDto.success('Category retrieved successfully', category);
  }

  @AllowAnonymous()
  @Get(':id')
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiResponse({
    status: 200,
    description: 'Category retrieved successfully',
    type: CategoryResponseDto,
  })
  async findOne(
    @Param() params: CategoryIdParamDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoriesService.findOne(params.id);

    return ApiResponseDto.success('Category retrieved successfully', category);
  }

  @Roles(['ADMIN'])
  @Put(':id')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Update a category' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateCategorySwaggerDto })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
    type: CategoryResponseDto,
  })
  async update(
    @Param() params: CategoryIdParamDto,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoriesService.update(
      params.id,
      updateCategoryDto,
      file,
    );

    return ApiResponseDto.success('Category updated successfully', category);
  }

  @Roles(['ADMIN'])
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({
    status: 200,
    description: 'Category deleted successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Category deleted successfully' },
        data: { type: 'null', nullable: true },
      },
    },
  })
  async delete(@Param() params: CategoryIdParamDto): Promise<ApiResponseDto> {
    const result = await this.categoriesService.delete(params.id);

    return ApiResponseDto.deleted(result.message, null);
  }
}
