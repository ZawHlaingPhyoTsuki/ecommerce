import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { RequestSellerRoleDto } from '../dto/request-seller-role.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { USER_ROLE } from 'src/common/constants/role';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async requestSellerRole(
    userId: string,
    requestSellerRoleDto: RequestSellerRoleDto,
  ) {
    // Check if user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already a seller
    if (user.role === USER_ROLE.SELLER) {
      throw new ConflictException('User is already a seller');
    }

    // Check if user is not a buyer
    if (user.role !== USER_ROLE.BUYER) {
      throw new ConflictException('Only buyers can request seller role');
    }

    // Check if there's already a pending request
    if (user.sellerBio && user.sellerApplicationStatus === 'PENDING') {
      throw new ConflictException('There is already a pending request');
    }

    // Update user with seller request data
    return this.userRepository.updateSellerRequest(userId, {
      bio: requestSellerRoleDto.bio,
      businessName: requestSellerRoleDto.businessName,
      phone: requestSellerRoleDto.phone,
      address: requestSellerRoleDto.address,
    });
  }

  async getUserProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async approveSeller(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === USER_ROLE.SELLER) {
      throw new ConflictException('User is already a seller');
    }

    if (user.sellerApplicationStatus !== 'PENDING') {
      throw new ConflictException('No pending seller request found');
    }

    return this.userRepository.approveSeller(userId);
  }

  async rejectSeller(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === USER_ROLE.SELLER) {
      throw new ConflictException('User is already a seller');
    }

    if (user.sellerApplicationStatus !== 'PENDING') {
      throw new ConflictException('No pending seller request found');
    }

    return this.userRepository.rejectSeller(userId);
  }

  async getPendingSellerApplications() {
    return this.userRepository.getPendingSellerApplications();
  }

  async updateUser(userId: string, updateUserDto: UpdateUserDto) {
    // Check if at least one field is provided
    const hasUpdates = Object.values(updateUserDto).some(
      (val) => val !== undefined && val !== null,
    );

    if (!hasUpdates) {
      throw new BadRequestException('At least one field must be provided');
    }

    // Check if user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.userRepository.update(userId, updateUserDto);
  }
}
