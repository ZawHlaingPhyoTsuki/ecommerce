import { PrismaService } from 'src/modules/prisma/prisma.service';
import { auth } from 'src/lib/auth';
import { USER_ROLE } from 'src/common/constants/role';

const prismaService = new PrismaService();

async function main() {
  console.log(`Start seeding ...`);

  const authInstance = auth(prismaService);

  // Clear existing data
  await prismaService.user.deleteMany();
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

  await prismaService.user.update({
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
    await prismaService.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prismaService.$disconnect();
    process.exit(1);
  });
