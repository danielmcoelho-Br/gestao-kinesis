const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let val = parts.slice(1).join('=').trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  });
}

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const txs = await prisma.transaction.findMany({
    where: {
      date: {
        gte: new Date(2026, 0, 1),
        lte: new Date(2026, 2, 31, 23, 59, 59)
      }
    }
  });
  console.log(`Total transactions found: ${txs.length}`);
  txs.forEach(t => {
    const desc = t.description.toUpperCase();
    const cat = t.category.toUpperCase();
    if (desc.includes("JULIA") || desc.includes("PAULA") || desc.includes("PILATES") || cat.includes("PILATES") || cat.includes("PRO_EARNING") || cat.includes("PARTNER") || desc.includes("AUSENCIA")) {
      console.log(`Date: ${t.date.toISOString().split('T')[0]}, Desc: ${t.description}, Amount: R$ ${t.amount}, Cat: ${t.category}, Bank: ${t.bank}`);
    }
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
