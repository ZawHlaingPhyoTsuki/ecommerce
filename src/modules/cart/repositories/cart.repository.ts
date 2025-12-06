import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class CartRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get cart include object for queries
   */
  private getCartInclude() {
    return {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              stock: true,
              isAvailable: true,
              images: {
                select: {
                  url: true,
                  order: true,
                },
                orderBy: { order: 'asc' },
                take: 1,
              },
            },
          },
        },
        orderBy: {
          product: {
            name: 'asc',
          },
        },
      },
    } satisfies Prisma.CartInclude;
  }

  /**
   * Find or create cart for user
   */
  async findOrCreateCart(userId: string) {
    return this.prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: this.getCartInclude(),
    });
  }

  /**
   * Get cart by user ID
   */
  async findByUserId(userId: string) {
    return this.prisma.cart.findUnique({
      where: { userId },
      include: this.getCartInclude(),
    });
  }

  /**
   * Add item to cart or update quantity if exists
   */
  async addItem(userId: string, productId: string, quantity: number) {
    return this.prisma.$transaction(async (tx) => {
      // Find or create cart
      const cart = await tx.cart.upsert({
        where: { userId },
        update: {},
        create: { userId },
      });

      // Add/Update item
      await tx.cartItem.upsert({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId,
          },
        },
        update: {
          quantity: {
            increment: quantity,
          },
        },
        create: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });

      // Return updated cart
      return tx.cart.findUnique({
        where: { userId },
        include: this.getCartInclude(),
      });
    });
  }

  /**
   * Update cart item quantity
   */
  async updateItemQuantity(itemId: string, quantity: number) {
    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  }

  /**
   * Remove item from cart
   */
  async removeItem(itemId: string) {
    return this.prisma.cartItem.delete({
      where: { id: itemId },
    });
  }

  /**
   * Clear all items from cart
   */
  async clearCart(userId: string) {
    const cart = await this.findByUserId(userId);

    if (cart) {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    return this.findOrCreateCart(userId);
  }

  /**
   * Get cart item by ID
   */
  async findCartItem(itemId: string) {
    return this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: {
          select: {
            userId: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            stock: true,
            isAvailable: true,
          },
        },
      },
    });
  }

  /**
   * Get product stock and availability
   */
  async getProductInfo(productId: string) {
    return this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        stock: true,
        isAvailable: true,
      },
    });
  }
}
