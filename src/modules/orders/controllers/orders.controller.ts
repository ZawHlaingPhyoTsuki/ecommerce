import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Put,
	Delete,
	HttpCode,
	HttpStatus,
} from "@nestjs/common";
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from "@nestjs/swagger";
import { Roles, Session, UserSession } from "@thallesp/nestjs-better-auth";
import { ApiResponseDto } from "src/common/dtos/api-response.dto";
import { OrdersService } from "../services/orders.service";
import {
	CreateOrderDto,
	OrderParamDto,
	OrderResponseDto,
	OrdersResponseDto,
	CreateOrderResponseDto,
	UpdateOrderStatusDto,
	CancelOrderDto,
} from "../dtos";

@ApiTags("Orders")
@ApiBearerAuth()
@Controller("orders")
export class OrdersController {
	constructor(private readonly ordersService: OrdersService) {}

	@Roles(["BUYER"])
	@Post()
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({
		summary: "Create new order(s)",
		description:
			"Creates one or more orders based on the cart items. Items are grouped by seller, creating distinct orders for each seller.",
	})
	@ApiResponse({
		status: 201,
		description: "Order(s) created successfully",
		type: CreateOrderResponseDto,
	})
	async create(
		@Session() session: UserSession,
		@Body() createOrderDto: CreateOrderDto,
	): Promise<CreateOrderResponseDto> {
		const orders = await this.ordersService.create(
			session.user.id,
			createOrderDto,
		);
		return ApiResponseDto.created("Order(s) created successfully", orders);
	}

	@Roles(["BUYER"])
	@Get()
	@ApiOperation({
		summary: "Get my orders (as buyer)",
		description: "Retrieves all orders placed by the current user.",
	})
	@ApiResponse({
		status: 200,
		description: "Orders retrieved successfully",
		type: OrdersResponseDto,
	})
	async getMyOrders(
		@Session() session: UserSession,
	): Promise<OrdersResponseDto> {
		const orders = await this.ordersService.findAllMyOrders(session.user.id);
		return ApiResponseDto.success("Orders retrieved successfully", orders);
	}

	@Roles(["SELLER"])
	@Get("seller")
	@ApiOperation({
		summary: "Get my received orders (as seller)",
		description:
			"Retrieves all orders received by the current user as a seller.",
	})
	@ApiResponse({
		status: 200,
		description: "Seller orders retrieved successfully",
		type: OrdersResponseDto,
	})
	async getSellerOrders(
		@Session() session: UserSession,
	): Promise<OrdersResponseDto> {
		const orders = await this.ordersService.findAllSellerOrders(
			session.user.id,
		);
		return ApiResponseDto.success(
			"Seller orders retrieved successfully",
			orders,
		);
	}

	@Roles(["BUYER", "SELLER"])
	@Get(":id")
	@ApiOperation({
		summary: "Get order by ID",
		description:
			"Retrieves detailed information about a specific order. User must be the buyer or seller of the order.",
	})
	@ApiResponse({
		status: 200,
		description: "Order retrieved successfully",
		type: OrderResponseDto,
	})
	async getOrder(
		@Session() session: UserSession,
		@Param() params: OrderParamDto,
	): Promise<OrderResponseDto> {
		const order = await this.ordersService.findOne(params.id, session.user.id);
		return ApiResponseDto.success("Order retrieved successfully", order);
	}

	@Roles(["SELLER"])
	@Put(":id/status")
	@ApiOperation({
		summary: "Update order status (seller only)",
		description:
			"Update the status of an order (e.g., CONFIRMED, SHIPPED, DELIVERED).",
	})
	@ApiResponse({
		status: 200,
		description: "Order status updated successfully",
		type: OrderResponseDto,
	})
	async updateStatus(
		@Session() session: UserSession,
		@Param() params: OrderParamDto,
		@Body() updateDto: UpdateOrderStatusDto,
	): Promise<OrderResponseDto> {
		const order = await this.ordersService.updateStatus(
			params.id,
			session.user.id,
			updateDto.status,
		);
		return ApiResponseDto.success("Order status updated successfully", order);
	}

	@Roles(["BUYER", "SELLER"])
	@Delete(":id/cancel")
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: "Cancel an order",
		description:
			"Cancel an order (buyer or seller). Only PENDING or CONFIRMED orders can be cancelled.",
	})
	@ApiResponse({
		status: 200,
		description: "Order cancelled successfully",
		type: OrderResponseDto,
	})
	async cancelOrder(
		@Session() session: UserSession,
		@Param() params: OrderParamDto,
		@Body() _cancelDto: CancelOrderDto,
	): Promise<OrderResponseDto> {
		const order = await this.ordersService.cancel(params.id, session.user.id);
		return ApiResponseDto.success("Order cancelled successfully", order);
	}
}
