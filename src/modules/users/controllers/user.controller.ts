import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
} from '@nestjs/common';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { UserService } from '../services/user.service';
import { UpdateUserDto, RequestSellerRoleDto, UserResponseDto } from '../dtos';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponseDto } from 'src/common/dtos/api-response.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Post('me/request-seller')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request seller role',
    description:
      'Submit a request to become a seller. Requires admin approval.',
  })
  @ApiResponse({
    status: 200,
    description: 'Request submitted successfully',
    type: UserResponseDto,
  })
  async requestSellerRole(
    @Session() session: UserSession,
    @Body() requestSellerRoleDto: RequestSellerRoleDto,
  ): Promise<UserResponseDto> {
    const user = await this.userService.requestSellerRole(
      session.user.id,
      requestSellerRoleDto,
    );

    return ApiResponseDto.success('Request submitted successfully', user);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  async getMyProfile(
    @Session() session: UserSession,
  ): Promise<UserResponseDto> {
    const user = await this.userService.getUserProfile(session.user.id);
    return ApiResponseDto.success('User profile retrieved successfully', user);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  async updateUser(
    @Body() updateUserDto: UpdateUserDto,
    @Session() session: UserSession,
  ): Promise<UserResponseDto> {
    const user = await this.userService.updateUser(
      session.user.id,
      updateUserDto,
    );
    return ApiResponseDto.success('User updated successfully', user);
  }
}
