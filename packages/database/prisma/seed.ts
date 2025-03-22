import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a test user
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      stripeId: 'stripe_test_id',
    },
  });

  // Create a validator
  const validator = await prisma.validator.create({
    data: {
      address: '7j5Cd7tcFQDEgYyAXfmdiSEjFFDPSTeudRnVG4iA8p3b',
    },
  });

  // Create some test monitors
  const monitor1 = await prisma.monitor.create({
    data: {
      url: 'https://google.com',
      userId: user.id,
    },
  });

//   const monitor2 = await prisma.monitor.create({
//     data: {
//       url: 'https://api2.example.com',
//       userId: user.id,
//     },
//   });

  // Create some test monitor results
//   await prisma.monitorResults.createMany({
//     data: [
//       {
//         monitorId: monitor1.id,
//         validatorId: validator.id,
//         status: 'online',
//         responseTime: 150.5,
//         result: true,
//       },
//       {
//         monitorId: monitor2.id,
//         validatorId: validator.id,
//         status: 'degraded',
//         responseTime: 350.2,
//         result: false,
//       },
//     ],
//   });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });