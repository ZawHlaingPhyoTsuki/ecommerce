import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, Length, IsPhoneNumber } from 'class-validator';

export class RequestSellerRoleDto {
  @ApiProperty({
    description: 'Seller bio (20-500 characters)',
    minLength: 20,
    maxLength: 500,
    example:
      'I have been selling handmade crafts for 5 years with excellent customer reviews and fast shipping.',
  })
  @IsString()
  @Length(20, 500)
  bio: string;

  @ApiProperty({
    description: 'Business name (2-100 characters)',
    minLength: 2,
    maxLength: 100,
    example: 'Handmade Crafts Co.',
  })
  @IsString()
  @Length(2, 100)
  businessName: string;

  @ApiProperty({
    description: 'Phone number for business inquiries',
    example: '+1234567890',
  })
  @IsString()
  @IsPhoneNumber()
  phone: string;

  @ApiPropertyOptional({
    description: 'Business address (10-200 characters)',
    minLength: 10,
    maxLength: 200,
    example: '123 Business St, City, State 12345',
  })
  @IsOptional()
  @IsString()
  @Length(10, 200)
  address?: string;
}
