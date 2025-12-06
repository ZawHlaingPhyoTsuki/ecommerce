import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
	ApiResponseDto,
	PaginatedResponseDto,
	PaginationMeta,
} from "src/common/dtos/api-response.dto";

/**
 * Category DTO
 */
export class CategoryDto {
	@ApiProperty({
		description: "Unique identifier of the category",
		example: "550e8400-e29b-41d4-a716-446655440000",
	})
	id: string;

	@ApiProperty({
		description: "Name of the category",
		example: "Electronics",
	})
	name: string;

	@ApiProperty({
		description: "URL-friendly slug",
		example: "electronics",
	})
	slug: string;

	@ApiProperty({
		description: "URL of the category image (Cloudinary)",
		type: String,
		nullable: true,
		example: "https://res.cloudinary.com/.../category-image.jpg",
	})
	image: string | null;

	@ApiPropertyOptional({
		description: "Number of products in this category",
		type: "object",
		properties: {
			products: {
				type: "integer",
				example: 42,
			},
		},
	})
	_count?: {
		products: number;
	};

	@ApiProperty({
		description: "When the category was created",
	})
	createdAt: Date;

	@ApiProperty({
		description: "When the category was last updated",
	})
	updatedAt: Date;
}

/**
 * Category response DTO for Swagger
 */
export class CategoryResponseDto extends ApiResponseDto<CategoryDto> {
	@ApiProperty({ example: 200 })
	declare statusCode: number;

	@ApiProperty({ example: "Category retrieved successfully" })
	declare message: string;

	@ApiProperty({ type: CategoryDto })
	declare data: CategoryDto;
}

/**
 * Categories list response DTO for Swagger
 */
export class CategoriesResponseDto extends PaginatedResponseDto<CategoryDto[]> {
	@ApiProperty({ example: 200 })
	declare statusCode: number;

	@ApiProperty({ example: "Categories retrieved successfully" })
	declare message: string;

	@ApiProperty({ type: [CategoryDto] })
	declare data: CategoryDto[];

	@ApiProperty({ type: PaginationMeta })
	declare meta: PaginationMeta;
}
