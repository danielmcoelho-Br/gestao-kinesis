const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const transactions = await prisma.transaction.findMany({
    where: {
      category: 'PRO_EARNING',
      description: { contains: 'Ausencia', mode: 'insensitive' }
    }
  });

  console.log(`=== PRO_EARNING with Ausência Nula (Count: ${transactions.length}) ===`);
  transactions.forEach(t => {
    console.log(`Date: ${t.date.toISOString().split('T')[0]}, Desc: ${t.description}, Amount: ${t.amount}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
