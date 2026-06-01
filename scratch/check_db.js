const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const professionals = await prisma.professional.findMany({
    include: { serviceRules: true }
  });
  console.log("=== Professionals ===");
  professionals.forEach(p => {
    console.log(`ID: ${p.id}, Name: ${p.name}, defaultPercentage: ${p.defaultPercentage}, role: ${p.role}`);
    if (p.serviceRules.length > 0) {
      console.log("  Service Rules:", p.serviceRules.map(r => `${r.serviceCode}: ${r.percentage}`));
    }
  });

  const sessions = await prisma.session.findMany({
    take: 5
  });
  console.log("\n=== Sessions Sample ===");
  sessions.forEach(s => {
    console.log(`ID: ${s.id}, profId: ${s.professionalId}, value: ${s.value}, clinicPercentage: ${s.clinicPercentage}, status: ${s.status}, serviceType: ${s.serviceType}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
