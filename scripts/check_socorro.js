require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const patient = await prisma.patient.findFirst({
    where: { name: { contains: 'SOCORRO', mode: 'insensitive' } },
    include: { assessments: true }
  });
  
  if (!patient) {
      console.log("PATIENT_NOT_FOUND");
      return;
  }
  
  console.log("FOUND_PATIENT:", patient.name, "ID:", patient.id);
  console.log("NUM_ASSESSMENTS:", patient.assessments.length);
  patient.assessments.forEach(a => {
      console.log(`- ${a.assessment_type} created ${a.created_at}`);
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
