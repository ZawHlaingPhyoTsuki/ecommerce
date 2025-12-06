import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

/**
 * Create category DTO
 * @property {string} name - The name of the category
 */
export class CreateCategoryDto {
	@ApiProperty({ example: "Electronics" })
	@IsString()
	@Length(2, 100)
	name: string;
}
