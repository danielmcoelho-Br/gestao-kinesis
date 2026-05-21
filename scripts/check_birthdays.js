const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const patients = await prisma.patient.findMany({
      select: { id: true, name: true, birth_date: true }
    });
    console.log("--- INÍCIO DADOS ---");
    console.log(JSON.stringify(patients, null, 2));
    console.log("--- FIM DADOS ---");
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
