import { Type } from "class-transformer";
import {
	IsArray,
	IsInt,
	IsNotEmpty,
	IsString,
	Min,
	ValidateNested,
} from "class-validator";

export class CreateOrderItemDto {
	@IsString()
	@IsNotEmpty()
	productId: string;

	@IsInt()
	@Min(1)
	quantity: number;
}

export class CreateOrderDto {
	@IsString()
	@IsNotEmpty()
	shippingAddress: string;

	@IsString()
	@IsNotEmpty()
	phone: string;

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreateOrderItemDto)
	items: CreateOrderItemDto[];
}
