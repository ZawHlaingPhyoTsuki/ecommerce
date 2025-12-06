import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
	ApiResponseDto,
	PaginatedResponseDto,
	PaginationMeta,
} from "src/common/dtos/api-response.dto";

/**
 * Product image DTO
 */
export class ProductImageDto {
	@ApiProperty({
		description: "Image ID",
		example: "550e8400-e29b-41d4-a716-446655440000",
	})
	id: string;

	@ApiProperty({
		description: "Product ID",
		example: "550e8400-e29b-41d4-a716-446655440000",
	})
	productId: string;

	@ApiProperty({
		description: "Image URL",
		example: "https://res.cloudinary.com/.../product-1.jpg",
	})
	url: string;

	@ApiProperty({
		description: "Display order",
		example: 0,
	})
	order: number;

	@ApiProperty({
		description: "When the image was uploaded",
	})
	createdAt: Date;
}

/**
 * Product DTO
 */
export class ProductDto {
	@ApiProperty({
		description: "Unique identifier of the product",
		example: "550e8400-e29b-41d4-a716-446655440000",
	})
	id: string;

	@ApiProperty({
		description: "Product name",
		example: "Wireless Bluetooth Headphones",
	})
	name: string;

	@ApiProperty({
		description: "URL-friendly slug",
		example: "wireless-bluetooth-headphones",
	})
	slug: string;

	@ApiProperty({
		description: "Product description",
		type: String,
		nullable: true,
		example: "High-quality wireless headphones with noise cancellation",
	})
	description: string | null;

	@ApiProperty({
		description: "Product price",
		type: Number,
		example: 99.99,
	})
	price: number;

	@ApiPropertyOptional({
		description: "Product images",
		type: [ProductImageDto],
	})
	images?: ProductImageDto[];

	@ApiProperty({
		description: "Product stock quantity",
		example: 100,
	})
	stock: number;

	@ApiProperty({
		description: "Whether the product is available for purchase",
		example: true,
	})
	isAvailable: boolean;

	@ApiProperty({
		description: "Product rating (0-5)",
		type: Number,
		example: 4.5,
	})
	rating: number;

	@ApiProperty({
		description: "Number of ratings",
		example: 42,
	})
	ratingCount: number;

	@ApiProperty({
		description: "Category ID",
		example: "550e8400-e29b-41d4-a716-446655440000",
	})
	categoryId: string;

	@ApiPropertyOptional({
		description: "Category details",
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
			slug: { type: "string" },
		},
	})
	category?: {
		id: string;
		name: string;
		slug: string;
	};

	@ApiProperty({
		description: "Seller ID",
		example: "550e8400-e29b-41d4-a716-446655440000",
	})
	sellerId: string;

	@ApiPropertyOptional({
		description: "Seller details",
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
			businessName: { type: "string", nullable: true },
		},
	})
	seller?: {
		id: string;
		name: string;
		businessName: string | null;
	};

	@ApiPropertyOptional({
		description: "Product counts",
		type: "object",
		properties: {
			images: { type: "integer" },
			ratings: { type: "integer" },
			cartItems: { type: "integer" },
			orderItems: { type: "integer" },
		},
	})
	_count?: {
		images: number;
		ratings: number;
		cartItems: number;
		orderItems: number;
	};

	@ApiProperty({
		description: "When the product was created",
	})
	createdAt: Date;

	@ApiProperty({
		description: "When the product was last updated",
	})
	updatedAt: Date;
}

/**
 * Product response DTO for Swagger
 */
export class ProductResponseDto extends ApiResponseDto<ProductDto> {
	@ApiProperty({ example: 200 })
	declare statusCode: number;

	@ApiProperty({ example: "Product retrieved successfully" })
	declare message: string;

	@ApiProperty({ type: ProductDto })
	declare data: ProductDto;
}

/**
 * Paginated product response DTO for Swagger
 */
export class ProductPaginatedResponseDto extends PaginatedResponseDto<
	ProductDto[]
> {
	@ApiProperty({ example: 200 })
	declare statusCode: number;

	@ApiProperty({ example: "Products retrieved successfully" })
	declare message: string;

	@ApiProperty({ type: [ProductDto] })
	declare data: ProductDto[];

	@ApiProperty({ type: PaginationMeta })
	declare meta: PaginationMeta;
}
