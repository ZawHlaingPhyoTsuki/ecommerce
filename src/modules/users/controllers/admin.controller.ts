import { Controller, Get, Param, Post } from '@nestjs/common';
import { UserService } from '../services/user.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '@thallesp/nestjs-better-auth';
import { UserIdParamDto, UsersResponseDto, UserResponseDto } from '../dtos';
import { ApiResponseDto } from 'src/common/dtos/api-response.dto';

@ApiTags('Admin Users')
@ApiBearerAuth()
@Controller('admin/users')
@Roles(['ADMIN'])
export class AdminUsersController {
  constructor(private readonly userService: UserService) {}

  @Post(':userId/approve-seller')
  @ApiOperation({ summary: 'Approve seller application' })
  @ApiResponse({
    status: 200,
    description: 'Seller approved successfully',
    type: UserResponseDto,
  })
  async approveSeller(
    @Param() params: UserIdParamDto,
  ): Promise<UserResponseDto> {
    const user = await this.userService.approveSeller(params.userId);
    return ApiResponseDto.success('Seller approved successfully', user);
  }

  @Post(':userId/reject-seller')
  @ApiOperation({ summary: 'Reject seller application' })
  @ApiResponse({
    status: 200,
    description: 'Seller rejected successfully',
    type: UserResponseDto,
  })
  async rejectSeller(
    @Param() params: UserIdParamDto,
  ): Promise<UserResponseDto> {
    const user = await this.userService.rejectSeller(params.userId);
    return ApiResponseDto.success('Seller rejected successfully', user);
  }

  @Get('/seller-applications')
  @ApiOperation({ summary: 'Get pending seller applications' })
  @ApiResponse({
    status: 200,
    description: 'Pending seller applications retrieved successfully',
    type: UsersResponseDto,
  })
  async getPendingSellerApplications(): Promise<UsersResponseDto> {
    const users = await this.userService.getPendingSellerApplications();
    return ApiResponseDto.success(
      'Pending seller applications retrieved successfully',
      users,
    );
  }
}
