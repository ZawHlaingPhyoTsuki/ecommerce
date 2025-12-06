import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class CreateCategorySwaggerDto {
	@ApiProperty({
		type: "string",
		format: "binary",
		description: "Category image",
	})
	image: unknown;

	@ApiProperty({ example: "Electronics", description: "Category name" })
	@IsString()
	@Length(2, 100)
	name: string;
}

export class UpdateCategorySwaggerDto {
	@ApiPropertyOptional({
		type: "string",
		format: "binary",
		description: "Category image",
	})
	image?: unknown;

	@ApiPropertyOptional({ example: "Electronics", description: "Category name" })
	@IsString()
	@Length(2, 100)
	name?: string;
}
