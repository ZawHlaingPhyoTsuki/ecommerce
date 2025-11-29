import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { UserService } from '../services/user.service';
import { RequestSellerRoleDto } from '../dto/request-seller-role.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserEntity } from '../entities/user.entity';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponseMessage } from 'src/common/decorators/api-response-message.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Post('me/request-seller')
  @HttpCode(HttpStatus.OK)
  @ApiResponseMessage('Request submitted successfully')
  @ApiOperation({
    summary: 'Request seller role',
    description:
      'Submit a request to become a seller. Requires admin approval.',
  })
  @ApiResponse({
    status: 200,
    description: 'Request submitted successfully',
    type: UserEntity,
  })
  @ApiResponse({
    status: 409,
    description: 'User is already a seller or has pending request',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async requestSellerRole(
    @Session() session: UserSession,
    @Body() requestSellerRoleDto: RequestSellerRoleDto,
  ) {
    const user = await this.userService.requestSellerRole(
      session.user.id,
      requestSellerRoleDto,
    );

    return new UserEntity(user);
  }

  @Get('me')
  @ApiResponseMessage('User profile retrieved successfully')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getMyProfile(@Session() session: UserSession) {
    const user = await this.userService.getUserProfile(session.user.id);
    return new UserEntity(user);
  }

  @Patch('me')
  @ApiResponseMessage('User updated successfully')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async updateUser(
    @Body() updateUserDto: UpdateUserDto,
    @Session() session: UserSession,
  ) {
    const user = await this.userService.updateUser(
      session.user.id,
      updateUserDto,
    );
    return new UserEntity(user);
  }
}
