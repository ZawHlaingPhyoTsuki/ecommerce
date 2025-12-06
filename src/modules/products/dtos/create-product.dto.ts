import { ApiProperty } from "@nestjs/swagger";
import {
	IsString,
	IsNumber,
	IsOptional,
	IsInt,
	Min,
	Length,
	IsBoolean,
	IsUUID,
} from "class-validator";
import { Type } from "class-transformer";

/**
 * Create product DTO
 */
export class CreateProductDto {
	@ApiProperty({
		description: "Product name",
		example: "Wireless Bluetooth Headphones",
	})
	@IsString()
	@Length(3, 200)
	name: string;

	@ApiProperty({
		description: "Product description",
		example: "High-quality wireless headphones with noise cancellation",
		required: false,
	})
	@IsOptional()
	@IsString()
	@Length(3, 2000)
	description?: string;

	@ApiProperty({
		description: "Product price",
		example: 99.99,
	})
	@Type(() => Number)
	@IsNumber(
		{ maxDecimalPlaces: 2 },
		{
			message:
				"Price must be a number with up to 2 decimal places (e.g., 99.99)",
		},
	)
	@Min(0.01)
	price: number;

	@ApiProperty({
		description: "Product stock quantity",
		example: 100,
		default: 0,
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0)
	stock?: number;

	@ApiProperty({
		description: "Whether the product is available for purchase",
		example: true,
		default: true,
	})
	@IsOptional()
	@IsBoolean()
	isAvailable?: boolean;

	@ApiProperty({
		description: "Category ID",
		example: "550e8400-e29b-41d4-a716-446655440000",
	})
	@IsString()
	@IsUUID()
	categoryId: string;
}
