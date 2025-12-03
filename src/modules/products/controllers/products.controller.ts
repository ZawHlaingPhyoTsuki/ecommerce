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
  UploadedFiles,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ProductsService } from '../services/products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  CreateProductSwaggerDto,
  UpdateProductSwaggerDto,
  ProductIdParamDto,
  SellerIdAndProductSlugParamDto,
} from '../dtos';
import { ProductEntity } from '../entities/product.entity';
import {
  AllowAnonymous,
  Roles,
  Session,
  UserSession,
} from '@thallesp/nestjs-better-auth';
import {
  ProductResponseDto,
  ProductPaginatedResponseDto,
} from '../dtos/swagger-res.dto';
import { ApiResponseDto } from 'src/common/dtos/api-response.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Roles(['SELLER'])
  @Post()
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiOperation({ summary: 'Create a new product (Sellers only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateProductSwaggerDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: ProductResponseDto,
  })
  async create(
    @Session() session: UserSession,
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.create(
      session.user.id,
      createProductDto,
      files,
    );

    return ApiResponseDto.created(
      'Product created successfully',
      new ProductEntity(product),
    );
  }

  @AllowAnonymous()
  @Get()
  @ApiOperation({ summary: 'Get all products with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
    type: ProductPaginatedResponseDto,
  })
  async findAll(
    @Query() query: ProductQueryDto,
  ): Promise<ProductPaginatedResponseDto> {
    const result = await this.productsService.findAll(query);

    return ApiResponseDto.success(
      'Products retrieved successfully',
      result.data.map((product) => new ProductEntity(product)),
      result.meta,
    );
  }

  @AllowAnonymous()
  @Get('seller/:sellerId/slug/:slug')
  @ApiOperation({ summary: 'Get a product by seller ID and slug' })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
    type: ProductResponseDto,
  })
  async findBySlug(
    @Param() params: SellerIdAndProductSlugParamDto,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.findBySlug(
      params.sellerId,
      params.slug,
    );

    return ApiResponseDto.success(
      'Product retrieved successfully',
      new ProductEntity(product),
    );
  }

  @AllowAnonymous()
  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
    type: ProductResponseDto,
  })
  async findOne(
    @Param() params: ProductIdParamDto,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.findOne(params.id);

    return ApiResponseDto.success(
      'Product retrieved successfully',
      new ProductEntity(product),
    );
  }

  @Roles(['SELLER'])
  @Put(':id')
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiOperation({ summary: 'Update a product (Owner only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateProductSwaggerDto })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    type: ProductResponseDto,
  })
  async update(
    @Session() session: UserSession,
    @Param() params: ProductIdParamDto,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.update(
      params.id,
      session.user.id,
      updateProductDto,
      files,
    );

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return ApiResponseDto.success(
      'Product updated successfully',
      new ProductEntity(product),
    );
  }

  @Roles(['SELLER'])
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a product (Owner only)' })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Product deleted successfully' },
        data: { type: 'null', nullable: true },
      },
    },
  })
  async delete(
    @Session() session: UserSession,
    @Param() params: ProductIdParamDto,
  ): Promise<ApiResponseDto> {
    const result = await this.productsService.delete(
      params.id,
      session.user.id,
    );

    return ApiResponseDto.deleted(result.message, null);
  }

  @Roles(['SELLER'])
  @Delete(':id/images')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove specific images from a product (Owner only)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        imageIds: {
          type: 'array',
          items: { type: 'string' },
          example: ['clxyz123-image-id-1', 'clxyz123-image-id-2'],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Images removed successfully',
    type: ProductResponseDto,
  })
  async removeImages(
    @Session() session: { user: { id: string } },
    @Param() params: ProductIdParamDto,
    @Body('imageIds') imageIds: string[],
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.removeImages(
      params.id,
      session.user.id,
      imageIds,
    );

    return ApiResponseDto.success(
      'Images removed successfully',
      new ProductEntity(product!),
    );
  }
}
