const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const month = 1; // February
  const year = 2026;
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);

  const sessions = await prisma.session.findMany({
    where: {
      date: { gte: start, lte: end }
    },
    include: {
      professional: true
    }
  });

  const stats = {};
  sessions.forEach(s => {
    const profName = s.professional.name;
    const isPilates = s.serviceType.toLowerCase().includes('pilates');
    if (isPilates) return; // skip Pilates

    if (!stats[profName]) {
      stats[profName] = {
        totalGross: 0,
        clinicProfit: 0, // s.value * clinicPercentage
        profValue: 0    // s.value * (1 - clinicPercentage)
      };
    }
    stats[profName].totalGross += s.value;
    stats[profName].clinicProfit += s.value * s.clinicPercentage;
    stats[profName].profValue += s.value * (1 - s.clinicPercentage);
  });

  console.log("=== February 2026 Calculated Values (Non-Pilates) ===");
  for (const [name, val] of Object.entries(stats)) {
    console.log(`\nProfessional: ${name}`);
    console.log(`  Gross: R$ ${val.totalGross.toFixed(2)}`);
    console.log(`  ClinicProfit (clinicPercentage): R$ ${val.clinicProfit.toFixed(2)}`);
    console.log(`  ProfValue (1 - clinicPercentage): R$ ${val.profValue.toFixed(2)}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
