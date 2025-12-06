import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsString, ArrayNotEmpty } from "class-validator";

export class RemoveImagesDto {
	@ApiProperty({
		description: "IDs of images to remove from the product",
		type: [String],
		example: [
			"550e8400-e29b-41d4-a716-446655440000",
			"550e8400-e29b-41d4-a716-446655440000",
		],
	})
	@IsArray()
	@ArrayNotEmpty()
	@IsString({ each: true })
	imageIds: string[];
}
