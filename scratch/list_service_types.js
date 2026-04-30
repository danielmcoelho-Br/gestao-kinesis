const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const types = await prisma.session.groupBy({
    by: ['serviceType'],
    _count: {
      serviceType: true
    }
  });
  console.log(JSON.stringify(types, null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
