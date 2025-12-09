import { Injectable, NotFoundException } from "@nestjs/common";
import { Order, OrderStatus, Prisma } from "generated/prisma/client";
import { PrismaService } from "src/modules/prisma/prisma.service";
import { CreateOrderDto } from "../dtos";

@Injectable()
export class OrdersRepository {
	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Get include object for order queries
	 */
	private getOrderInclude() {
		return {
			items: true,
			buyer: {
				select: {
					id: true,
					name: true,
					email: true,
					phone: true,
				},
			},
			seller: {
				select: {
					id: true,
					name: true,
					email: true,
					businessName: true,
				},
			},
		};
	}

	/**
	 * Create order(s) from cart items
	 */
	async create(buyerId: string, dto: CreateOrderDto) {
		const { items: orderedItems, shippingAddress, phone } = dto;

		// Fetch all products to validate and get prices/seller
		const productIds = orderedItems.map((i) => i.productId);
		const products = await this.prisma.product.findMany({
			where: {
				id: { in: productIds },
				isAvailable: true,
			},
			include: {
				seller: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});

		if (products.length !== orderedItems.length) {
			throw new NotFoundException("One or more products not found");
		}

		// Group items by seller
		const itemsBySeller = new Map<
			string,
			{
				sellerId: string;
				sellerName: string;
				items: { product: (typeof products)[0]; quantity: number }[];
			}
		>();

		// --- Loop start --- //
		// Group ordered items by seller and perform stock validation
		for (const orderedItem of orderedItems) {
			const product = products.find((p) => p.id === orderedItem.productId);
			if (!product) {
				throw new NotFoundException(
					`Product ${orderedItem.productId} not found`,
				);
			}

			// Check stock
			if (product.stock < orderedItem.quantity) {
				throw new NotFoundException(
					`Insufficient stock for product ${product.name}`,
				);
			}

			if (!itemsBySeller.has(product.sellerId)) {
				itemsBySeller.set(product.sellerId, {
					sellerId: product.sellerId,
					sellerName: product.seller.name,
					items: [],
				});
			}
			itemsBySeller.get(product.sellerId)?.items.push({
				product: product,
				quantity: orderedItem.quantity,
			});
		}
		// --- Loop end --- //

		// Create transaction
		return this.prisma.$transaction(async (tx) => {
			const orders: Order[] = [];

			for (const sellerData of itemsBySeller.values()) {
				// Calculate total for this seller's order
				const totalAmount = sellerData.items.reduce(
					(sum, item) => sum.add(item.product.price.mul(item.quantity)),
					new Prisma.Decimal(0),
				);

				// Create Order
				const order = await tx.order.create({
					data: {
						buyerId,
						sellerId: sellerData.sellerId,
						shippingAddress,
						phone,
						totalAmount,
						status: "PENDING",
						items: {
							create: sellerData.items.map((item) => ({
								productId: item.product.id,
								quantity: item.quantity,
								price: item.product.price,
								productNameSnapShot: item.product.name,
							})),
						},
					},
					include: {
						items: true,
					},
				});

				// Decrement stock
				for (const item of sellerData.items) {
					await tx.product.update({
						where: { id: item.product.id },
						data: { stock: { decrement: item.quantity } },
					});
				}

				orders.push(order);
			}

			return orders;
		});
	}

	/**
	 * Find all orders for a buyer
	 */
	async findAllByBuyer(buyerId: string) {
		return this.prisma.order.findMany({
			where: { buyerId },
			include: this.getOrderInclude(),
			orderBy: { createdAt: "desc" },
		});
	}

	/**
	 * Find all orders for a seller
	 */
	async findAllBySeller(sellerId: string) {
		return this.prisma.order.findMany({
			where: { sellerId },
			include: this.getOrderInclude(),
			orderBy: { createdAt: "desc" },
		});
	}

	/**
	 * Find a single order by ID
	 */
	async findOne(id: string) {
		const order = await this.prisma.order.findUnique({
			where: { id },
			include: this.getOrderInclude(),
		});

		if (!order) {
			throw new NotFoundException(`Order with ID "${id}" not found`);
		}

		return order;
	}

	/**
	 * Update order status
	 */
	async updateStatus(id: string, status: OrderStatus, sellerId?: string) {
		const where = sellerId ? { id, sellerId } : { id };

		return this.prisma.order.update({
			where,
			data: { status },
			include: this.getOrderInclude(),
		});
	}

	/**
	 * Cancel an order
	 */
	async cancel(id: string, userId: string) {
		const order = await this.prisma.order.findUnique({
			where: { id },
			include: { items: true },
		});

		if (!order) {
			throw new NotFoundException(`Order with ID "${id}" not found`);
		}

		// Check if user is authorized (buyer or seller)
		if (order.buyerId !== userId && order.sellerId !== userId) {
			throw new NotFoundException("Order not found");
		}

		// Only allow cancellation if order is PENDING or CONFIRMED
		if (!["PENDING", "CONFIRMED"].includes(order.status)) {
			throw new NotFoundException(
				`Cannot cancel order with status: ${order.status}`,
			);
		}

		return this.prisma.$transaction(async (tx) => {
			// Restore stock for each item
			for (const item of order.items) {
				if (item.productId) {
					await tx.product.update({
						where: { id: item.productId },
						data: { stock: { increment: item.quantity } },
					});
				}
			}

			// Update order status
			return tx.order.update({
				where: { id },
				data: { status: "CANCELLED" },
				include: this.getOrderInclude(),
			});
		});
	}
}
