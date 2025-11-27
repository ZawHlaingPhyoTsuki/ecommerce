import { Controller, Get, Logger } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Home')
@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly prismaService: PrismaService) {}

  @Get('/hello')
  @ApiResponse({ status: 200, description: 'Hello World' })
  getHello(): string {
    this.logger.log('Request to /hello');

    return 'Hello World!';
  }
}
