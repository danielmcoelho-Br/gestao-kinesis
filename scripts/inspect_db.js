const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    let val = parts.slice(1).join('=').trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    env[key] = val;
    process.env[key] = val;
  }
});

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const startDate = new Date("2026-03-01T00:00:00.000Z");
  const endDate = new Date("2026-03-31T23:59:59.999Z");

  const categories = await prisma.transaction.groupBy({
    by: ['category'],
    where: {
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    _count: true
  });
  console.log("Distinct categories for March 2026:", JSON.stringify(categories, null, 2));

  // Check some expenses specifically
  const expenses = await prisma.transaction.findMany({
    where: {
      type: 'EXPENSE',
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    take: 20
  });
  console.log("Expenses in March 2026:", JSON.stringify(expenses.map(e => ({ desc: e.description, cat: e.category, type: e.type, amount: e.amount })), null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
