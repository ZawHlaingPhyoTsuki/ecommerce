import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User name',
    example: 'Maxx',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'User image',
    example: 'https://example.com/image.jpg',
  })
  @IsOptional()
  @IsUrl()
  @IsString()
  image?: string;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+1234567890',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'User address',
    example: '123 Main St, City, Country',
  })
  @IsOptional()
  @IsString()
  address?: string;
}
