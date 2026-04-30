const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
  const start = new Date(2026, 2, 1);
  const end = new Date(2026, 3, 0, 23, 59, 59);

  const sessions = await prisma.session.findMany({
    where: { date: { gte: start, lte: end } }
  });

  const fisio = sessions.filter(s => {
    const type = s.serviceType.toLowerCase();
    return !type.includes("pilates");
  });

  const finalizedFisio = fisio.filter(s => s.status.toLowerCase().includes("finalizado"));
  const patients = new Set(finalizedFisio.map(s => s.patientName?.trim().toLowerCase()));
  const totalValue = finalizedFisio.reduce((acc, s) => acc + s.value, 0);

  console.log("--- DEBUG FISIOTERAPIA MARÇO ---");
  console.log("Total Sessões Fisio (Tudo):", fisio.length);
  console.log("Total Sessões Fisio (Finalizadas):", finalizedFisio.length);
  console.log("Pacientes Únicos (Fisio Finalizadas):", patients.size);
  console.log("Valor Total (Fisio Finalizadas):", totalValue);
  console.log("Ticket Médio (Valor / Qtd Finalizada):", totalValue / finalizedFisio.length);
  console.log("Média Sessões (Qtd Finalizada / Pacientes):", finalizedFisio.length / patients.size);
  
  // Mostrar alguns pacientes para ver se tem duplicidade
  const pList = Array.from(patients).sort();
  console.log("Amostra de pacientes (primeiros 5):", pList.slice(0, 5));
}

debug();
