import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Resetting all users in database...');
  await prisma.user.deleteMany();

  console.log('🌱 Creating uncompromised demo accounts...');

  // Strong, unique passwords that will not trigger Chrome Password Manager data breach warnings
  const demoPassword = 'Demo#A11yEngine2026!';
  const demoPasswordHash = await bcrypt.hash(demoPassword, 12);
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      password: demoPasswordHash,
    },
  });

  const adminPassword = 'Admin#A11yEngine2026!';
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: adminPasswordHash,
    },
  });

  console.log('✅ Demo accounts created successfully:');
  console.log(`   - Demo User:  demo@example.com  / ${demoPassword} (ID: ${demoUser.id})`);
  console.log(`   - Admin User: admin@example.com / ${adminPassword} (ID: ${adminUser.id})`);
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
