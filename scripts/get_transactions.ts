import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.transaction.findMany({
    orderBy: { date: 'asc' }
  });
  console.log("TOTAL TRANSACTIONS:", txs.length);
  for (const t of txs) {
    if (t.description.toLowerCase().includes('guilherme') || t.description.toLowerCase().includes('pilates') || t.description.toLowerCase().includes('saldo')) {
      console.log(JSON.stringify(t));
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
