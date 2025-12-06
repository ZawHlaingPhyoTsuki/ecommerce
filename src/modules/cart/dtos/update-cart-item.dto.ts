import { ApiProperty } from "@nestjs/swagger";
import { IsInt, Min } from "class-validator";
import { Type } from "class-transformer";

/**
 * Update cart item quantity DTO
 */
export class UpdateCartItemDto {
	@ApiProperty({
		description: "New quantity for the cart item",
		example: 3,
	})
	@Type(() => Number)
	@IsInt()
	@Min(1)
	quantity: number;
}
