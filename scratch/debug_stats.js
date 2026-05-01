const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mock categorization and processing for a quick check
function categorizeService(serviceType) {
    const type = serviceType.toLowerCase().trim();
    if (type.includes("pilates")) return { category: "Pilates", isPilates: true };
    return { category: "Outros", isPilates: false };
}

function processSessions(sessions) {
    return { count: sessions.length, grossValue: sessions.reduce((acc, s) => acc + s.value, 0) };
}

async function main() {
  const month = 11; // Dezembro
  const year = 2025;
  const startOfTarget = new Date(year, month, 1);
  const endOfTarget = new Date(year, month + 1, 0, 23, 59, 59);
  
  console.log(`Checking range: ${startOfTarget.toISOString()} to ${endOfTarget.toISOString()}`);

  const currentSessions = await prisma.session.findMany({ 
    where: { date: { gte: startOfTarget, lte: endOfTarget } } 
  });
  
  console.log(`Sessions found: ${currentSessions.length}`);
  if (currentSessions.length > 0) {
      console.log('First session date:', currentSessions[0].date);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
