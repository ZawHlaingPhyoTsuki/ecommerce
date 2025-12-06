import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CartService } from '../services/cart.service';
import {
  AddToCartDto,
  UpdateCartItemDto,
  CartItemIdParamDto,
  CartResponseDto,
} from '../dtos';
import { Roles, Session, UserSession } from '@thallesp/nestjs-better-auth';
import { ApiResponseDto } from 'src/common/dtos/api-response.dto';

@ApiTags('Cart')
@ApiBearerAuth()
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Roles(['BUYER'])
  @Get()
  @ApiOperation({
    summary: 'Get user cart',
    description:
      "Retrieves the current user's shopping cart with all items, product details, and calculated totals. Automatically creates a cart if one doesn't exist.",
  })
  @ApiResponse({
    status: 200,
    description: 'Cart retrieved successfully',
    type: CartResponseDto,
  })
  async getCart(@Session() session: UserSession): Promise<CartResponseDto> {
    const cart = await this.cartService.getCart(session.user.id);

    return ApiResponseDto.success('Cart retrieved successfully', cart);
  }

  @Roles(['BUYER'])
  @Post('items')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add item to cart',
    description:
      'Adds a product to the shopping cart. If the product already exists in the cart, the quantity will be incremented. Validates product availability and stock before adding.',
  })
  @ApiResponse({
    status: 200,
    description: 'Item added to cart successfully',
    type: CartResponseDto,
  })
  async addItem(
    @Session() session: UserSession,
    @Body() addToCartDto: AddToCartDto,
  ): Promise<CartResponseDto> {
    const cart = await this.cartService.addItem(session.user.id, addToCartDto);

    return ApiResponseDto.success('Item added to cart successfully', cart);
  }

  @Roles(['BUYER'])
  @Put('items/:itemId')
  @ApiOperation({
    summary: 'Update cart item quantity',
    description:
      'Updates the quantity of an existing cart item. Validates that the new quantity does not exceed available stock and that the product is still available.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cart item updated successfully',
    type: CartResponseDto,
  })
  async updateItemQuantity(
    @Session() session: UserSession,
    @Param() params: CartItemIdParamDto,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    const cart = await this.cartService.updateItemQuantity(
      session.user.id,
      params.itemId,
      updateCartItemDto,
    );

    return ApiResponseDto.success('Cart item updated successfully', cart);
  }

  @Roles(['BUYER'])
  @Delete('items/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove item from cart',
    description:
      'Removes a specific item from the shopping cart. The cart item must belong to the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Item removed from cart successfully',
    type: CartResponseDto,
  })
  async removeItem(
    @Session() session: UserSession,
    @Param() params: CartItemIdParamDto,
  ): Promise<CartResponseDto> {
    const cart = await this.cartService.removeItem(
      session.user.id,
      params.itemId,
    );

    return ApiResponseDto.success('Item removed from cart successfully', cart);
  }

  @Roles(['BUYER'])
  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clear cart',
    description:
      "Removes all items from the user's shopping cart. The cart itself remains but will be empty.",
  })
  @ApiResponse({
    status: 200,
    description: 'Cart cleared successfully',
    type: CartResponseDto,
  })
  async clearCart(@Session() session: UserSession): Promise<CartResponseDto> {
    const cart = await this.cartService.clearCart(session.user.id);

    return ApiResponseDto.success('Cart cleared successfully', cart);
  }
}
