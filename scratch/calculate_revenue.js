const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const month = 2; // March
  const year = 2026;
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);

  console.log(`Period: ${start.toISOString()} to ${end.toISOString()}`);

  const transactions = await prisma.transaction.findMany({
    where: {
      category: 'PRO_EARNING',
      date: { gte: start, lte: end }
    }
  });

  console.log("=== Existing PRO_EARNING Transactions ===");
  transactions.forEach(t => {
    console.log(`ID: ${t.id}, Description: ${t.description}, Amount: ${t.amount}, Date: ${t.date.toISOString().split('T')[0]}`);
  });

  const sessions = await prisma.session.findMany({
    where: {
      date: { gte: start, lte: end }
    },
    include: {
      professional: true
    }
  });

  console.log(`\n=== Sessions count: ${sessions.length} ===`);

  // Group sessions by professional name
  const profStats = {};
  sessions.forEach(s => {
    const profName = s.professional.name;
    const isPilates = s.serviceType.toLowerCase().includes('pilates');
    if (!profStats[profName]) {
      profStats[profName] = {
        totalSessions: 0,
        pilatesSessions: 0,
        nonPilatesSessions: 0,
        totalValue: 0,
        pilatesValue: 0,
        nonPilatesValue: 0,
        totalClinicProfit: 0,
        nonPilatesClinicProfit: 0,
        totalProfValue: 0,
        nonPilatesProfValue: 0
      };
    }

    const stats = profStats[profName];
    stats.totalSessions++;
    stats.totalValue += s.value;
    
    // In statsService.ts: clinicPart = value * clinicPercentage
    const clinicPart = s.value * s.clinicPercentage;
    const profPart = s.value - clinicPart;

    stats.totalClinicProfit += clinicPart;
    stats.totalProfValue += profPart;

    if (isPilates) {
      stats.pilatesSessions++;
      stats.pilatesValue += s.value;
    } else {
      stats.nonPilatesSessions++;
      stats.nonPilatesValue += s.value;
      stats.nonPilatesClinicProfit += clinicPart;
      stats.nonPilatesProfValue += profPart;
    }
  });

  console.log("\n=== Stats by Professional ===");
  for (const [name, stats] of Object.entries(profStats)) {
    console.log(`\nProfessional: ${name}`);
    console.log(`  Sessions: total=${stats.totalSessions}, non-Pilates=${stats.nonPilatesSessions}, Pilates=${stats.pilatesSessions}`);
    console.log(`  Total Gross Value: R$ ${stats.totalValue.toFixed(2)}`);
    console.log(`  Non-Pilates Gross Value: R$ ${stats.nonPilatesValue.toFixed(2)}`);
    console.log(`  Clinic Profit (clinicPercentage = ${name.includes('Joao') ? '0.55' : '0.5'}):`);
    console.log(`    Total Clinic Profit (s.value * s.clinicPercentage): R$ ${stats.totalClinicProfit.toFixed(2)}`);
    console.log(`    Non-Pilates Clinic Profit (s.value * s.clinicPercentage): R$ ${stats.nonPilatesClinicProfit.toFixed(2)}`);
    console.log(`    Total Professional Value (s.value * (1 - s.clinicPercentage)): R$ ${stats.totalProfValue.toFixed(2)}`);
    console.log(`    Non-Pilates Professional Value (s.value * (1 - s.clinicPercentage)): R$ ${stats.nonPilatesProfValue.toFixed(2)}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
