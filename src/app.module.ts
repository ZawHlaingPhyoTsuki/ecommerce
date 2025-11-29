import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './lib/auth';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';
import { UserModule } from './modules/users/user.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';

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
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
