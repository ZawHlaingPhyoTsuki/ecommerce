import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { OrderStatus } from "generated/prisma/client";

export class UpdateOrderStatusDto {
	@ApiProperty({
		enum: OrderStatus,
		example: OrderStatus.CONFIRMED,
		description: "New status for the order",
	})
	@IsEnum(OrderStatus)
	status: OrderStatus;
}

export class CancelOrderDto {
	@ApiProperty({
		description: "Reason for cancellation (optional)",
		required: false,
	})
	@IsOptional()
	@IsString()
	reason?: string;
}
