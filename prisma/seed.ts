import { PrismaService } from 'src/modules/prisma/prisma.service';
import { auth } from 'src/lib/auth';
import { USER_ROLE } from 'src/common/constants/role';

const prismaService = new PrismaService();

async function main() {
  console.log(`Start seeding ...`);

  const authInstance = auth(prismaService);

  if (process.env.NODE_ENV !== 'production') {
    // Clear existing data in non-production only
    await prismaService.user.deleteMany();
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error('Missing SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD env vars');
  }

  const result = await authInstance.api.signUpEmail({
    body: {
      email: adminEmail,
      password: adminPassword,
      name: 'Administrator',
    },
  });

  if (!result.user) {
    throw new Error('Failed to create user');
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

  console.log('Admin user created and assigned ADMIN role!');
  console.log(`Email: ${result.user.email}`);
  console.log('Password: (taken from SEED_ADMIN_PASSWORD env var)');
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
