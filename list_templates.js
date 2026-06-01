const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
require('dotenv').config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const templates = await prisma.assessmentTemplate.findMany();
    console.log("TEMPLATES FOUND IN DB:", templates.map(t => ({ id: t.id, title: t.title, segment: t.segment })));
  } catch (e) {
    console.error("Error querying templates:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
