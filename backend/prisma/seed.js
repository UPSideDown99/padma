// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const adminPass = await bcrypt.hash('admin123', 10);
  const userPass = await bcrypt.hash('user123', 10);

  await prisma.user.createMany({
    data: [
      { name: 'Admin', email: 'admin@padma.test', password: adminPass, role: 'admin' },
      { name: 'User', email: 'user@padma.test', password: userPass, role: 'user' }
    ]
  });

  await prisma.vehicle.createMany({
    data: [
      { name: 'Toyota Avanza', plate: 'B-1234-AA', type: 'biasa', pricePerKm: 2.5 },
      { name: 'Mercedes S-Class', plate: 'B-9876-XX', type: 'mewah', pricePerKm: 12.0 }
    ]
  });

  console.log('Seed selesai');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
