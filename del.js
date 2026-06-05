const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.transaction.deleteMany({
    where: { bank: 'HIDDEN_ITEM' }
  });
  console.log('DELETED', result.count);
}
main().catch(console.error).finally(() => prisma.$disconnect());
