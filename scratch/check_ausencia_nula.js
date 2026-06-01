const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const sessions = await prisma.session.findMany({
    where: {
      status: { contains: 'Ausência Nula', mode: 'insensitive' }
    },
    include: {
      professional: true
    }
  });

  console.log(`=== Sessions with Ausência Nula status (Count: ${sessions.length}) ===`);
  sessions.forEach(s => {
    console.log(`Date: ${s.date.toISOString().split('T')[0]}, Prof: ${s.professional.name}, Value: ${s.value}, clinicPercentage: ${s.clinicPercentage}, serviceType: ${s.serviceType}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
