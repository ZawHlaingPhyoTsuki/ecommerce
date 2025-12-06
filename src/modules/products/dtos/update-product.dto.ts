import { ApiPropertyOptional } from "@nestjs/swagger";
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
 * Update product DTO
 */
export class UpdateProductDto {
	@ApiPropertyOptional({
		description: "Product name",
		example: "Wireless Bluetooth Headphones Pro",
	})
	@IsOptional()
	@IsString()
	@Length(3, 200)
	name?: string;

	@ApiPropertyOptional({
		description: "Product description",
		example: "Premium wireless headphones with advanced noise cancellation",
	})
	@IsOptional()
	@IsString()
	@Length(10, 2000)
	description?: string;

	@ApiPropertyOptional({
		description: "Product price",
		example: 129.99,
	})
	@IsOptional()
	@Type(() => Number)
	@IsNumber({ maxDecimalPlaces: 2 })
	@Min(0.01)
	price?: number;

	@ApiPropertyOptional({
		description: "Product stock quantity",
		example: 150,
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0)
	stock?: number;

	@ApiPropertyOptional({
		description: "Whether the product is available for purchase",
		example: true,
	})
	@IsOptional()
	@IsBoolean()
	isAvailable?: boolean;

	@ApiPropertyOptional({
		description: "Category ID",
		example: "clxyz123-category-id",
	})
	@IsOptional()
	@IsString()
	@IsUUID()
	categoryId?: string;
}
