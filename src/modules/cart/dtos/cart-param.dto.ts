import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

/**
 * Cart item ID parameter DTO
 */
export class CartItemIdParamDto {
	@ApiProperty({
		description: "Cart item ID",
		example: "550e8400-e29b-41d4-a716-446655440000",
	})
	@IsUUID()
	itemId: string;
}
