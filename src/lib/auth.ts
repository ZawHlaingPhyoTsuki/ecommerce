import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { openAPI } from 'better-auth/plugins';
import { PrismaClient } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

export const auth = (prisma: PrismaService) => {
  return betterAuth({
    database: prismaAdapter(prisma as PrismaClient, {
      provider: 'postgresql',
    }),
    emailAndPassword: {
      enabled: true,
    },
    plugins: [openAPI()],
  });
};
