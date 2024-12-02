
// import prisma from '../app/lib/db-utils';

// async function main() {
//   try {
//     // Test connection first
//     await prisma.$connect();
//     console.log('Connected to database');

//     // Create initial admin user
//     const adminUser = await prisma.user.upsert({
//       where: { email: 'admin@example.com' },
//       update: {},
//       create: {
//         id: 'auth0|admin',
//         email: 'admin@example.com',
//         name: 'Admin User',
//         roleType: 'ADMIN'
//       }
//     });
//     console.log('Created admin user:', adminUser);

//     // Create sample crops
//     const wheat = await prisma.crop.create({
//       data: {
//         userId: adminUser.id,
//         cropName: 'Wheat',
//         cropType: 'Cereal',
//         cropVariety: 'Winter Wheat',
//         nitrogenDemand: 180,
//         nitrogenSupply: 40,
//         ItShouldNotBeRepeatedForXYears: 2,
//         details: {
//           create: [
//             { value: 'aphids', detailType: 'PEST' },
//             { value: 'rust', detailType: 'DISEASE' },
//             { value: 'nitrogen', detailType: 'FERTILIZER' }
//           ]
//         }
//       }
//     });
//     console.log('Created sample crop:', wheat);

//   } catch (error) {
//     console.error('Database initialization failed:', error);
//     throw error;
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// main().catch(console.error);