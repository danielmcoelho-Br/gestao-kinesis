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

  const txs = await prisma.transaction.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  console.log("March 2026 transactions with 'fundo' in description, category or favored:");
  txs.forEach(t => {
    const desc = t.description.toUpperCase();
    const cat = t.category ? t.category.toUpperCase() : '';
    if (desc.includes('FUNDO') || cat.includes('FUNDO')) {
      console.log(`- ID: ${t.id}, Date: ${t.date.toISOString().split('T')[0]}, Desc: "${t.description}", Amount: ${t.amount}, Type: ${t.type}, Cat: ${t.category}, Bank: ${t.bank}`);
    }
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
