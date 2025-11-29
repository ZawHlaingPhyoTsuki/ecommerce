import { Injectable } from '@nestjs/common';
import { USER_ROLE } from 'src/common/constants/role';
import { PrismaService } from 'src/prisma/prisma.service';
import { RequestSellerRoleDto } from '../dto/request-seller-role.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findById(id: string) {
    return this.prismaService.user.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: UpdateUserDto) {
    return this.prismaService.user.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.image && { image: data.image }),
        ...(data.phone && { phone: data.phone }),
        ...(data.address && { address: data.address }),
      },
    });
  }

  async updateSellerRequest(userId: string, data: RequestSellerRoleDto) {
    return this.prismaService.user.update({
      where: { id: userId },
      data: {
        sellerBio: data.bio,
        businessName: data.businessName,
        phone: data.phone,
        address: data.address,
        // Keep role as BUYER until approved
        role: USER_ROLE.BUYER,
        isSellerApproved: false,
        sellerApprovedAt: null,
      },
    });
  }

  async approveSeller(userId: string) {
    return this.prismaService.user.update({
      where: { id: userId },
      data: {
        role: USER_ROLE.SELLER,
        isSellerApproved: true,
        sellerApprovedAt: new Date(),
      },
    });
  }

  async rejectSeller(userId: string) {
    return this.prismaService.user.update({
      where: { id: userId },
      data: {
        role: USER_ROLE.BUYER,
        isSellerApproved: false,
        sellerApprovedAt: null,
      },
    });
  }

  async getPendingSellerApplications() {
    return this.prismaService.user.findMany({
      where: {
        role: USER_ROLE.BUYER,
        isSellerApproved: false,
      },
    });
  }
}
