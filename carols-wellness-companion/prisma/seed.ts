import { seedDemoData } from '../src/lib/demo';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Seeding demo data for Carol…');
  await seedDemoData();
  console.log('✓ Demo data seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
