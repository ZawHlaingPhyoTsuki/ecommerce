import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsUUID } from "class-validator";

export class CategoryIdParamDto {
	@ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
	@IsUUID("4")
	id: string;
}

export class CategorySlugParamDto {
	@ApiProperty({ example: "electronics" })
	@IsString()
	slug: string;
}
