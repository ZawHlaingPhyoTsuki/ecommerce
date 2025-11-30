import { PrismaService } from 'src/modules/prisma/prisma.service';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { auth } from 'src/lib/auth';
import { USER_ROLE } from 'src/common/constants/role';

const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: pool });

const prismaService = new PrismaService();

async function main() {
  console.log(`Start seeding ...`);

  const authInstance = auth(prismaService);

  // Clear existing data
  await prisma.user.deleteMany();
  // Seed data
  const result = await authInstance.api.signUpEmail({
    body: {
      email: 'admin@example.com',
      password: 'admin123!',
      name: 'Administrator',
    },
  });

  if (!result.user) {
    console.error('Failed to create user');
    process.exit(1);
  }

  console.log('Created user:', result.user.email);

  await prisma.user.update({
    where: {
      id: result.user.id,
    },
    data: {
      role: USER_ROLE.ADMIN,
    },
  });

  console.log('Admin user created and verified!');
  console.log(`Email: admin@example.com`);
  console.log(`Password: admin123!`);
  console.log(`Role: ADMIN`);
  console.log(`Seeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
