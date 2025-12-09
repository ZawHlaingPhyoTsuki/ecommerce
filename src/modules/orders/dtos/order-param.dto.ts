import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class OrderParamDto {
	@ApiProperty({
		description: "Order ID",
		example: "550e8400-e29b-41d4-a716-446655440000",
	})
	@IsString()
	@IsNotEmpty()
	id: string;
}
