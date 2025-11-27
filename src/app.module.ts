import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './lib/auth';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';

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
          disableGlobalAuthGuard: true,
          disableTrustedOriginsCors: true,
        };
      },
      inject: [PrismaService],
    }),
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
