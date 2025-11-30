import { Module } from '@nestjs/common';
import { TestController } from './test.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [TestController],
})
export class TestModule {}
