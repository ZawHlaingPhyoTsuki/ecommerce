import { Controller, Get, Param, Patch } from '@nestjs/common';
import { UserService } from '../services/user.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserEntity } from '../entities/user.entity';

import { ApiResponseMessage } from 'src/common/decorators/api-response-message.decorator';

@ApiTags('Admin Users')
@ApiBearerAuth()
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly userService: UserService) {}

  @Patch(':userId/approve-seller')
  @ApiResponseMessage('Seller approved successfully')
  @ApiOperation({ summary: 'Approve seller application' })
  @ApiResponse({
    status: 200,
    description: 'Seller approved successfully',
    type: UserEntity,
  })
  async approveSeller(@Param('userId') userId: string) {
    const user = await this.userService.approveSeller(userId);
    return new UserEntity(user);
  }

  @Patch(':userId/reject-seller')
  @ApiResponseMessage('Seller rejected successfully')
  @ApiOperation({ summary: 'Reject seller application' })
  @ApiResponse({
    status: 200,
    description: 'Seller rejected successfully',
    type: UserEntity,
  })
  async rejectSeller(@Param('userId') userId: string) {
    const user = await this.userService.rejectSeller(userId);
    return new UserEntity(user);
  }

  @Get('/seller-applications')
  @ApiResponseMessage('Pending seller applications retrieved successfully')
  @ApiOperation({ summary: 'Get pending seller applications' })
  @ApiResponse({
    status: 200,
    description: 'Pending seller applications retrieved successfully',
    type: [UserEntity],
  })
  async getPendingSellerApplications() {
    const users = await this.userService.getPendingSellerApplications();
    return users.map((user) => new UserEntity(user));
  }
}
