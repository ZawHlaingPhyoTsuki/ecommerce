import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin, openAPI } from 'better-auth/plugins';
import { PrismaClient } from 'generated/prisma/client';
import { USER_ROLE } from 'src/common/constants/role';
import { PrismaService } from 'src/modules/prisma/prisma.service';

export const auth = (prisma: PrismaService) => {
  return betterAuth({
    database: prismaAdapter(prisma as PrismaClient, {
      provider: 'postgresql',
    }),
    emailAndPassword: {
      enabled: true,
    },
    advanced: {
      disableOriginCheck: process.env.NODE_ENV === 'development',
      database: {
        generateId: (options) => {
          if (options.model === 'user' || options.model === 'users') {
            return false; // Let PostgreSQL serial generate it
          }
          return crypto.randomUUID(); // UUIDs for session, account, verification
        },
      },
    },
    plugins: [
      openAPI(),
      admin({
        defaultRole: USER_ROLE.BUYER,
        adminRoles: [USER_ROLE.ADMIN],
      }),
    ],
  });
};
