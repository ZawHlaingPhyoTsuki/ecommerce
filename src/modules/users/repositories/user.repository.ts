import { Injectable } from '@nestjs/common';
import { USER_ROLE } from 'src/common/constants/role';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { UpdateUserDto, RequestSellerRoleDto } from '../dto';

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
        ...(data.name !== undefined && { name: data.name }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.address !== undefined && { address: data.address }),
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
        sellerApplicationStatus: 'PENDING',
        sellerApprovedAt: null,
      },
    });
  }

  async approveSeller(userId: string) {
    return this.prismaService.user.update({
      where: { id: userId },
      data: {
        role: USER_ROLE.SELLER,
        sellerApplicationStatus: 'APPROVED',
        sellerApprovedAt: new Date(),
      },
    });
  }

  async rejectSeller(userId: string) {
    return this.prismaService.user.update({
      where: { id: userId },
      data: {
        role: USER_ROLE.BUYER,
        sellerApplicationStatus: 'REJECTED',
        sellerApprovedAt: null,
        sellerBio: null,
        businessName: null,
        // phone: null,
        // address: null,
      },
    });
  }

  async getPendingSellerApplications() {
    return this.prismaService.user.findMany({
      where: {
        role: USER_ROLE.BUYER,
        sellerApplicationStatus: 'PENDING',
        sellerBio: { not: null },
      },
    });
  }
}
