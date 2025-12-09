import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
} from "@nestjs/common";
import { OrderStatus } from "generated/prisma/client";
import { CreateOrderDto } from "../dtos";
import { OrdersRepository } from "../repositories/orders.repository";
import { convertDecimal } from "src/common/utils/prisma.utils";

// Type inference from repository
type OrderWithRelations = NonNullable<
	Awaited<ReturnType<OrdersRepository["findOne"]>>
>;

@Injectable()
export class OrdersService {
	private readonly logger = new Logger(OrdersService.name);

	constructor(private readonly repository: OrdersRepository) {}

	/**
	 * Transform order data from Prisma to DTO
	 */
	private transformOrder(order: OrderWithRelations) {
		return {
			id: order.id,
			totalAmount: convertDecimal(order.totalAmount),
			status: order.status,
			shippingAddress: order.shippingAddress,
			phone: order.phone,
			buyerId: order.buyerId,
			sellerId: order.sellerId,
			items: order.items.map((item) => ({
				id: item.id,
				orderId: item.orderId,
				productId: item.productId,
				productNameSnapShot: item.productNameSnapShot,
				quantity: item.quantity,
				price: convertDecimal(item.price),
			})),
			buyer: order.buyer,
			seller: order.seller,
			createdAt: order.createdAt,
			updatedAt: order.updatedAt,
		};
	}

	/**
	 * Create new order(s) from cart items
	 */
	async create(userId: string, dto: CreateOrderDto) {
		this.logger.log(`Creating order(s) for user: ${userId}`);

		// Validate items
		if (!dto.items || dto.items.length === 0) {
			throw new BadRequestException("Order must contain at least one item");
		}

		try {
			const orders = await this.repository.create(userId, dto);

			this.logger.log(`Created ${orders.length} order(s) for user: ${userId}`);

			return orders.map((order) =>
				this.transformOrder(order as OrderWithRelations),
			);
		} catch (error) {
			this.logger.error("Failed to create order(s)", error);
			if (error instanceof NotFoundException) {
				throw error;
			}
			throw new BadRequestException(
				error instanceof Error ? error.message : "Failed to create order(s)",
			);
		}
	}

	/**
	 * Find all orders for current user as buyer
	 */
	async findAllMyOrders(userId: string) {
		this.logger.log(`Fetching orders for buyer: ${userId}`);

		const orders = await this.repository.findAllByBuyer(userId);

		return orders.map((order) => this.transformOrder(order));
	}

	/**
	 * Find all orders for current user as seller
	 */
	async findAllSellerOrders(sellerId: string) {
		this.logger.log(`Fetching orders for seller: ${sellerId}`);

		const orders = await this.repository.findAllBySeller(sellerId);

		return orders.map((order) => this.transformOrder(order));
	}

	/**
	 * Find a single order by ID
	 */
	async findOne(id: string, userId: string) {
		this.logger.log(`Fetching order: ${id}`);

		const order = await this.repository.findOne(id);

		// Ensure user is authorized (buyer or seller)
		if (order.buyerId !== userId && order.sellerId !== userId) {
			throw new NotFoundException(`Order with ID "${id}" not found`);
		}

		return this.transformOrder(order);
	}

	/**
	 * Update order status (for sellers)
	 */
	async updateStatus(id: string, sellerId: string, status: OrderStatus) {
		this.logger.log(`Updating order status: ${id} to ${status}`);

		try {
			const order = await this.repository.updateStatus(id, status, sellerId);
			return this.transformOrder(order);
		} catch (error) {
			this.logger.error(`Failed to update order status: ${id}`, error);
			throw new NotFoundException(`Order with ID "${id}" not found`);
		}
	}

	/**
	 * Cancel an order
	 */
	async cancel(id: string, userId: string) {
		this.logger.log(`Cancelling order: ${id}`);

		try {
			const order = await this.repository.cancel(id, userId);
			return this.transformOrder(order);
		} catch (error) {
			this.logger.error(`Failed to cancel order: ${id}`, error);
			if (error instanceof NotFoundException) {
				throw error;
			}
			throw new BadRequestException(
				error instanceof Error ? error.message : "Failed to cancel order",
			);
		}
	}
}
