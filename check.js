const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const transactions = await prisma.transaction.findMany({
    where: {
      amount: 0.01
    }
  });
  console.log(transactions.map(t => ({ id: t.id, desc: t.description, bank: t.bank, date: t.date })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
