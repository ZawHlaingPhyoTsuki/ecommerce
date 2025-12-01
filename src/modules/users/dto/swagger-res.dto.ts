import {
  ApiResponseDto,
  PaginationMeta,
} from 'src/common/dtos/api-response.dto';
import { UserEntity } from '../entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto extends ApiResponseDto<UserEntity> {
  @ApiProperty({ type: UserEntity })
  declare data: UserEntity;
}

export class UserPaginatedResponseDto extends ApiResponseDto<UserEntity[]> {
  @ApiProperty({ type: [UserEntity] })
  declare data: UserEntity[];

  @ApiProperty({ type: PaginationMeta })
  declare meta?: PaginationMeta;
}
