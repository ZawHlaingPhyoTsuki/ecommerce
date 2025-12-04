import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './lib/auth';
import { PrismaModule } from './modules/prisma/prisma.module';
import { PrismaService } from './modules/prisma/prisma.service';
import { UserModule } from './modules/users/user.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TestModule } from './modules/test/test.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule.forRootAsync({
      useFactory: (prisma: PrismaService) => {
        return {
          auth: auth(prisma),
          // disableGlobalAuthGuard: true, // doesn't work correctly, use AllowAnonymous
          disableTrustedOriginsCors: true,
        };
      },
      inject: [PrismaService],
    }),
    PrismaModule,
    UserModule,
    CloudinaryModule,
    TestModule,
    CategoriesModule,
    ProductsModule,
  ],
  controllers: [AppController],
  providers: [
    // {
    //   provide: APP_GUARD,
    //   useFactory: (reflector: Reflector) => new RolesGuard(reflector),
    //   inject: [Reflector],
    // },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
