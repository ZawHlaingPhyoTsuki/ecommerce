import { ApiProperty } from "@nestjs/swagger";
import { OrderStatus } from "generated/prisma/client";
import { ApiResponseDto } from "src/common/dtos/api-response.dto";

export class OrderItemDto {
	@ApiProperty({ description: "Order Item ID" })
	id: string;

	@ApiProperty({ description: "Order ID" })
	orderId: string;

	@ApiProperty({ description: "Product ID", required: false })
	productId: string | null;

	@ApiProperty({ description: "Product Name Snapshot" })
	productNameSnapShot: string;

	@ApiProperty({ description: "Quantity" })
	quantity: number;

	@ApiProperty({ description: "Price at time of purchase" })
	price: number;
}

export class OrderDto {
	@ApiProperty({ description: "Order ID" })
	id: string;

	@ApiProperty({ description: "Total amount" })
	totalAmount: number;

	@ApiProperty({ enum: OrderStatus, description: "Order status" })
	status: OrderStatus;

	@ApiProperty({ description: "Shipping address" })
	shippingAddress: string;

	@ApiProperty({ description: "Phone number" })
	phone: string;

	@ApiProperty({ description: "Buyer ID", required: false })
	buyerId: string | null;

	@ApiProperty({ description: "Seller ID", required: false })
	sellerId: string | null;

	@ApiProperty({ description: "Created at" })
	createdAt: Date;

	@ApiProperty({ description: "Updated at" })
	updatedAt: Date;

	@ApiProperty({ type: [OrderItemDto], description: "Order Items" })
	items: OrderItemDto[];
}

export class OrderResponseDto extends ApiResponseDto<OrderDto> {
	@ApiProperty({ type: OrderDto })
	declare data: OrderDto;

	@ApiProperty({ example: 200 })
	declare statusCode: number;

	@ApiProperty({ example: "Order retrieved successfully" })
	declare message: string;
}

export class OrdersResponseDto extends ApiResponseDto<OrderDto[]> {
	@ApiProperty({ type: [OrderDto] })
	declare data: OrderDto[];

	@ApiProperty({ example: 200 })
	declare statusCode: number;

	@ApiProperty({ example: "Orders retrieved successfully" })
	declare message: string;
}

export class CreateOrderResponseDto extends ApiResponseDto<OrderDto[]> {
	@ApiProperty({ type: [OrderDto] })
	declare data: OrderDto[];

	@ApiProperty({ example: 201 })
	declare statusCode: number;

	@ApiProperty({ example: "Order(s) created successfully" })
	declare message: string;
}
