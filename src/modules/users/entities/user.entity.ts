import { ApiProperty } from '@nestjs/swagger';
import { User } from 'generated/prisma/client';
import { Exclude } from 'class-transformer';

export class UserEntity implements User {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User name' })
  name: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'Whether email is verified' })
  emailVerified: boolean;

  @ApiProperty({
    description: 'User profile image URL',
    nullable: true,
    type: String,
    example: 'https://example.com/avatar.jpg',
  })
  image: string | null;

  @Exclude()
  imagePublicId: string | null;

  @ApiProperty({
    description: 'Whether the user is banned',
    nullable: true,
    type: Boolean,
    example: false,
  })
  banned: boolean | null;

  @ApiProperty({
    description: 'Reason for the ban',
    nullable: true,
    type: String,
    example: null,
  })
  banReason: string | null;

  @ApiProperty({
    description: 'When the ban expires',
    nullable: true,
    type: Date,
    example: null,
  })
  banExpires: Date | null;

  @ApiProperty({ enum: ['BUYER', 'SELLER', 'ADMIN'], example: 'BUYER' })
  role: string;

  @ApiProperty({ description: 'Whether seller is approved', example: false })
  isSellerApproved: boolean;

  @ApiProperty({
    description: 'Seller biography',
    nullable: true,
    type: String,
    example: 'We sell high quality products.',
  })
  sellerBio: string | null;

  @ApiProperty({
    description: 'Business name',
    nullable: true,
    type: String,
    example: 'Acme Corp',
  })
  businessName: string | null;

  @ApiProperty({
    description: 'Business phone number',
    nullable: true,
    type: String,
    example: '+1234567890',
  })
  phone: string | null;

  @ApiProperty({
    description: 'Business address',
    nullable: true,
    type: String,
    example: '123 Market St',
  })
  address: string | null;

  @ApiProperty({
    description: 'Date when seller was approved',
    nullable: true,
    type: Date,
    example: null,
  })
  sellerApprovedAt: Date | null;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
