import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: pool });

async function main() {
  console.log(`Start seeding ...`);

  // Clear existing data
  await prisma.test.deleteMany();

  // Seed data
  await prisma.test.createMany({
    data: [
      {
        name: 'Test 1',
      },
      {
        name: 'Test 2',
      },
    ],
  });
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
