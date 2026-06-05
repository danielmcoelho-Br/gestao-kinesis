import { prisma } from './src/lib/prisma';
async function run() {
  const res = await prisma.transaction.updateMany({
    where: { category: 'PRO_EARNING', ownerId: 'DELETED' },
    data: { ownerId: null }
  });
  console.log('Restored: ', res.count);
}
run();
