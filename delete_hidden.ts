import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.transaction.deleteMany({
    where: {
      bank: 'HIDDEN_ITEM'
    }
  });
  console.log(`Deleted ${result.count} hidden transactions.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
