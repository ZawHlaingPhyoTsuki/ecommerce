import { Injectable } from '@nestjs/common';
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
                orderBy: { order: 'asc' as const },
                take: 1,
              },
            },
          },
        },
        orderBy: {
          product: {
            name: 'asc' as const,
          },
        },
      },
    };
  }

  /**
   * Find or create cart for user
   */
  async findOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: this.getCartInclude(),
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: this.getCartInclude(),
      });
    }

    return cart;
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
    const cart = await this.findOrCreateCart(userId);

    // Check if item already exists in cart
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
        },
      });
    } else {
      // Create new cart item
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    // Return updated cart
    return this.findByUserId(userId);
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

    return this.findByUserId(userId);
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
   * Check if product exists
   */
  async productExists(productId: string): Promise<boolean> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    return !!product;
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
