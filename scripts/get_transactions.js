require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const txs = await prisma.transaction.findMany({
    orderBy: { date: 'asc' }
  });
  console.log("TOTAL TRANSACTIONS:", txs.length);
  for (const t of txs) {
    const desc = t.description.toLowerCase();
    if (
      desc.includes('guilherme') || 
      desc.includes('pilates') || 
      desc.includes('saldo') ||
      desc.includes('fev')
    ) {
      console.log(JSON.stringify(t));
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => {
    prisma.$disconnect();
    pool.end();
  });
