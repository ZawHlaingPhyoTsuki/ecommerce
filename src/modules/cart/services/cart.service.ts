import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CartRepository } from '../repositories/cart.repository';
import { AddToCartDto, UpdateCartItemDto, CartDto } from '../dtos';

// Infer types from repository return types
type CartWithItems = NonNullable<
  Awaited<ReturnType<CartRepository['findOrCreateCart']>>
>;
type CartItemWithProduct = CartWithItems['items'][number];

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(private readonly cartRepository: CartRepository) {}

  /**
   * Convert Prisma Decimal to number
   */
  private convertDecimal(value: any): number {
    if (typeof value === 'object' && value !== null && 'toNumber' in value) {
      return value.toNumber();
    }
    return Number(value || 0);
  }

  /**
   * Transform cart data and calculate totals
   */
  private transformCart(cart: CartWithItems): CartDto {
    const items =
      cart.items?.map((item: CartItemWithProduct) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          price: this.convertDecimal(item.product.price),
          stock: item.product.stock,
          isAvailable: item.product.isAvailable,
          images: item.product.images || [],
        },
      })) || [];

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = Number(
      items
        .reduce((sum, item) => {
          const price = item.product.price || 0;
          return sum + price * item.quantity;
        }, 0)
        .toFixed(2),
    );

    return {
      id: cart.id,
      userId: cart.userId,
      items,
      totalItems,
      totalPrice,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  /**
   * Get user's cart
   */
  async getCart(userId: string): Promise<CartDto> {
    this.logger.log(`Fetching cart for user: ${userId}`);

    const cart = await this.cartRepository.findOrCreateCart(userId);
    return this.transformCart(cart);
  }

  /**
   * Add item to cart
   */
  async addItem(userId: string, dto: AddToCartDto): Promise<CartDto> {
    this.logger.log(
      `Adding product ${dto.productId} to cart for user: ${userId}`,
    );

    // Check if product exists
    const product = await this.cartRepository.getProductInfo(dto.productId);
    if (!product) {
      throw new NotFoundException(
        `Product with ID "${dto.productId}" not found`,
      );
    }

    // Check if product is available
    if (!product.isAvailable) {
      throw new BadRequestException(
        `Product "${product.name}" is not available`,
      );
    }

    // Check if enough stock
    if (product.stock < (dto.quantity || 1)) {
      throw new BadRequestException(
        `Insufficient stock for product "${product.name}". Available: ${product.stock}`,
      );
    }

    const cart = await this.cartRepository.addItem(
      userId,
      dto.productId,
      dto.quantity || 1,
    );

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    this.logger.log(`Item added to cart successfully`);
    return this.transformCart(cart);
  }

  /**
   * Update cart item quantity
   */
  async updateItemQuantity(
    userId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartDto> {
    this.logger.log(`Updating cart item ${itemId} quantity to ${dto.quantity}`);

    // Get cart item
    const cartItem = await this.cartRepository.findCartItem(itemId);
    if (!cartItem) {
      throw new NotFoundException(`Cart item with ID "${itemId}" not found`);
    }

    // Check if item belongs to user's cart
    if (cartItem.cart.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to modify this cart item',
      );
    }

    // Check if product has enough stock
    if (cartItem.product && cartItem.product.stock < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock for product "${cartItem.product.name}". Available: ${cartItem.product.stock}`,
      );
    }

    // Check if product is still available
    if (cartItem.product && !cartItem.product.isAvailable) {
      throw new BadRequestException(
        `Product "${cartItem.product.name}" is no longer available`,
      );
    }

    await this.cartRepository.updateItemQuantity(itemId, dto.quantity);

    // Return updated cart
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    this.logger.log(`Cart item quantity updated successfully`);
    return this.transformCart(cart);
  }

  /**
   * Remove item from cart
   */
  async removeItem(userId: string, itemId: string): Promise<CartDto> {
    this.logger.log(`Removing cart item ${itemId}`);

    // Get cart item
    const cartItem = await this.cartRepository.findCartItem(itemId);
    if (!cartItem) {
      throw new NotFoundException(`Cart item with ID "${itemId}" not found`);
    }

    // Check if item belongs to user's cart
    if (cartItem.cart.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to modify this cart item',
      );
    }

    await this.cartRepository.removeItem(itemId);

    // Return updated cart
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    this.logger.log(`Cart item removed successfully`);
    return this.transformCart(cart);
  }

  /**
   * Clear cart
   */
  async clearCart(userId: string): Promise<CartDto> {
    this.logger.log(`Clearing cart for user: ${userId}`);

    const cart = await this.cartRepository.clearCart(userId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    this.logger.log(`Cart cleared successfully`);
    return this.transformCart(cart);
  }
}
