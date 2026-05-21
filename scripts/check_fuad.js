require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const patients = await prisma.patient.findMany({
    where: { name: { contains: 'FUAD', mode: 'insensitive' } },
    include: { assessments: true }
  });
  console.log('RESULT_START');
  console.log(JSON.stringify(patients, null, 2));
  console.log('RESULT_END');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
