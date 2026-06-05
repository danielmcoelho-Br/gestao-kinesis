const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(txs);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
