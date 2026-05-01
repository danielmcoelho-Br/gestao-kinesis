const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const counts = await prisma.session.groupBy({
    by: ['date'],
    _count: true,
  });

  const yearCounts = {};
  counts.forEach(c => {
    const year = c.date.getFullYear();
    yearCounts[year] = (yearCounts[year] || 0) + c._count;
  });

  console.log('Session counts by year:');
  console.log(JSON.stringify(yearCounts, null, 2));

  const sample = await prisma.session.findFirst();
  console.log('Sample session:', JSON.stringify(sample, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
