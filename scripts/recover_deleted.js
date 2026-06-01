require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting recovery...");

  // 1. Recover Saldo Fev - Pilates
  // We check if it already exists to avoid duplicates
  const pilatesExist = await prisma.transaction.findFirst({
    where: {
      description: { startsWith: "Saldo Fev - Pilates" },
      date: {
        gte: new Date("2026-03-01T00:00:00.000Z"),
        lte: new Date("2026-03-01T23:59:59.000Z")
      }
    }
  });

  if (!pilatesExist) {
    const pilatesTx = await prisma.transaction.create({
      data: {
        type: "INCOME",
        description: "Saldo Fev - Pilates (PILATES)",
        amount: -11107.08, // Negative balance rollover
        date: new Date("2026-03-01T15:00:00.000Z"),
        category: "PILATES",
        bank: "Banco do Brasil"
      }
    });
    console.log("Recovered Pilates transaction:", JSON.stringify(pilatesTx));
  } else {
    console.log("Pilates transaction already exists:", JSON.stringify(pilatesExist));
  }

  // 2. Recover Guilherme Heck Bonagamba
  const guilhermeExist = await prisma.transaction.findFirst({
    where: {
      description: { startsWith: "GUILHERME HECK BONAGAMBA" },
      date: {
        gte: new Date("2026-03-13T00:00:00.000Z"),
        lte: new Date("2026-03-13T23:59:59.000Z")
      }
    }
  });

  if (!guilhermeExist) {
    const guilhermeTx = await prisma.transaction.create({
      data: {
        type: "EXPENSE",
        description: "GUILHERME HECK BONAGAMBA (KINESIS)",
        amount: 836.00,
        date: new Date("2026-03-13T15:00:00.000Z"),
        category: "GERAL",
        bank: "Banco do Brasil"
      }
    });
    console.log("Recovered Guilherme transaction:", JSON.stringify(guilhermeTx));
  } else {
    console.log("Guilherme transaction already exists:", JSON.stringify(guilhermeExist));
  }

  console.log("Recovery finished successfully!");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
