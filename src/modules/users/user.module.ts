import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { UsersController } from './controllers/user.controller';
import { AdminUsersController } from './controllers/admin.controller';
import { UserRepository } from './repositories/user.repository';

@Module({
  controllers: [UsersController, AdminUsersController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}
