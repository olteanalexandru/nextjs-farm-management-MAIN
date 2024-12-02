import { PrismaClient } from '@prisma/client';

enum Role {
  ADMIN = 'ADMIN',
  USER = 'FARMER',
}
const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      id: 'auth0|admin',
      auth0Id: 'auth0|admin',
      email: 'admin@example.com',
      name: 'Admin User',
      roleType: Role.ADMIN,
    }
  });

  // Create sample crops
  const sampleCrops = [
    {
      cropName: 'Wheat',
      cropType: 'Cereal',
      cropVariety: 'Winter Wheat',
      nitrogenDemand: 180,
      nitrogenSupply: 40,
      ItShouldNotBeRepeatedForXYears: 2,
    },
    {
      cropName: 'Corn',
      cropType: 'Cereal',
      cropVariety: 'Sweet Corn',
      nitrogenDemand: 200,
      nitrogenSupply: 30,
      ItShouldNotBeRepeatedForXYears: 1,
    }
  ];

  for (const cropData of sampleCrops) {
    await prisma.crop.create({
      data: {
        ...cropData,
        userId: adminUser.id,
        plantingDate: new Date(),
        harvestingDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      }
    });
  }

  console.log('Seed data created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
// Run this script with `ts-node prisma/seed.ts`
// You can also use `ts-node-dev` instead of `ts-node` for hot reloading
