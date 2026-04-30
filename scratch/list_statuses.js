const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const statuses = await prisma.session.groupBy({
    by: ['status'],
    _count: {
      status: true
    }
  });
  console.log(JSON.stringify(statuses, null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
