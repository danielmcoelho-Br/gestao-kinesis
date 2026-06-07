import { prisma } from '@/lib/prisma';

/**
 * Calculates how much each professional generated in clinic comissão (revenue) for the selected month
 * (excluding Pilates sessions and Ausência Nula status) and records it as a transaction of category `PRO_EARNING`
 * in the database.
 * 
 * @param year Reference year (e.g. 2026)
 * @param month Reference month (0-indexed, e.g. 2 for March)
 */
export async function syncProfessionalGains(year: number, month: number) {
  const startDate = new Date(Date.UTC(year, month, 1, 3, 0, 0));
  const endDate = new Date(Date.UTC(year, month + 1, 1, 2, 59, 59, 999));

  // Fetch all sessions in the period
  const sessions = await prisma.session.findMany({
    where: {
      date: { gte: startDate, lte: endDate }
    },
    include: {
      professional: true
    }
  });

  // Map professional name in DB to Ganhos Profissionais key
  const profMapping: { [key: string]: string } = {
    "julia faya": "Julia",
    "julia fayao": "Julia",
    "guilherme heck bonagamba": "Gambá",
    "gamba": "Gambá",
    "newton miachiro": "Newton",
    "cristiana alves ferreira amato": "Cris",
    "cris": "Cris",
    "joao pedro": "João",
    "joão pedro": "João",
    "joao pedro passos facioli": "João",
    "joão pedro passos facioli": "João"
  };

  const gains: { [key: string]: number } = {
    "Julia": 0,
    "Gambá": 0,
    "Newton": 0,
    "Cris": 0,
    "João": 0,
    "Ausência Nula": 0,
    "Julia (Pilates)": 0,
    "Ausência Nula (Pilates)": 0,
    "Imposto (Pilates)": 0
  };

  sessions.forEach(s => {
    // 1. Check status
    const status = (s.status || "").toLowerCase();
    const isAusenciaNula = status.includes("ausência nula");

    // 2. Check if it's Pilates
    const isPilates = (s.serviceType || "").toLowerCase().includes('pilates');

    let matchedKey = "";
    if (isPilates) {
      if (isAusenciaNula) {
        matchedKey = "Ausência Nula (Pilates)";
      } else {
        const normName = s.professional.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        if (normName.includes("julia") || normName.includes("júlia")) matchedKey = "Julia (Pilates)";
      }
    } else {
      if (isAusenciaNula) {
        matchedKey = "Ausência Nula";
      } else {
        const normName = s.professional.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        for (const [key, value] of Object.entries(profMapping)) {
          if (normName.includes(key)) {
            matchedKey = value;
            break;
          }
        }
      }
    }

    if (matchedKey && gains[matchedKey] !== undefined) {
      gains[matchedKey] += s.value * s.clinicPercentage;
    }
  });

  // Now, upsert the PRO_EARNING transactions in the DB for each professional
  for (const [profLabel, amount] of Object.entries(gains)) {
    // Find existing transaction in DB
    const existing = await prisma.transaction.findFirst({
      where: {
        category: 'PRO_EARNING',
        description: profLabel,
        date: { gte: startDate, lte: endDate }
      }
    });

    if (existing) {
      if (existing.ownerId === 'DELETED') continue;

      if (amount === 0) {
        // If amount is 0, set it to 0
        await prisma.transaction.update({
          where: { id: existing.id },
          data: { amount: 0 }
        });
      } else if (existing.amount !== amount) {
        await prisma.transaction.update({
          where: { id: existing.id },
          data: { amount }
        });
      }
    } else if (amount > 0) {
      // Create new transaction
      await prisma.transaction.create({
        data: {
          type: 'INCOME',
          description: profLabel,
          amount: amount,
          date: startDate,
          category: 'PRO_EARNING',
          bank: 'BANCO DO BRASIL',
          ownerId: null
        }
      });
    }
  }
}
