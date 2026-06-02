const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDuplicates() {
  const txs = await prisma.transaction.findMany({
    orderBy: { date: 'asc' }
  });
  
  const map = new Map();
  let duplicates = 0;
  
  for (const t of txs) {
    const key = `${t.date.toISOString()}_${t.amount}_${t.description}`;
    if (map.has(key)) {
      duplicates++;
      // console.log("Duplicate found:", t.description, t.amount);
    } else {
      map.set(key, 1);
    }
  }
  console.log(`Total transactions: ${txs.length}`);
  console.log(`Exact duplicates found: ${duplicates}`);
}

checkDuplicates().catch(console.error).finally(() => prisma.$disconnect());
