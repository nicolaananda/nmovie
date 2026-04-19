const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultPlans = [
  { name: 'Trial 1 Day', durationDays: 1, price: 0, features: ['Full access', '24 hours'], isActive: true },
  { name: '3 Days', durationDays: 3, price: 0, features: ['Full access', '3 days'], isActive: true },
  { name: '1 Week', durationDays: 7, price: 0, features: ['Full access', '7 days'], isActive: true },
  { name: '1 Month', durationDays: 30, price: 0, features: ['Full access', '30 days'], isActive: true },
];

async function main() {
  for (const plan of defaultPlans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: { durationDays: plan.durationDays, features: plan.features },
      create: plan,
    });
  }
  console.log('Default subscription plans seeded');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
