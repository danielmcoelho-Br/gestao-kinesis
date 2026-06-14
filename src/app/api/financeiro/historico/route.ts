import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runFinancialCalculations } from "@/lib/finance/calculations";

export const dynamic = 'force-dynamic';

const monthsPt = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let year = parseInt(searchParams.get("year") || "2026");

    if (isNaN(year)) {
      return NextResponse.json({ error: "Ano inválido." }, { status: 400 });
    }

    if (year < 100) {
      year = 2000 + year;
    }

    // 1. Fetch locks for the given year
    const locks = await prisma.monthLock.findMany({
      where: { year }
    });
    const lockMap = new Map(locks.map((l: any) => [l.month, l.locked]));

    // 2. Fetch all transactions for the entire year
    const startDate = new Date(Date.UTC(year, 0, 1, 3, 0, 0));
    const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        },
        OR: [
          { ownerId: null },
          { ownerId: { not: 'DELETED' } }
        ]
      },
      orderBy: {
        date: 'asc'
      }
    });

    // 3. Process each month
    const historyData = monthsPt.map((monthName, monthIndex) => {
      // Filter transactions for this specific month (using UTC boundary)
      const monthTransactions = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getUTCFullYear() === year && d.getUTCMonth() === monthIndex;
      });

      const calc = runFinancialCalculations(monthTransactions, monthIndex, year);
      const isLocked = lockMap.get(monthIndex) || false;

      return {
        month: monthIndex,
        monthName,
        isLocked,
        faturamentoFisio: calc.totalArrecadado,
        lucroFisio: calc.saldoFinal,
        faturamentoPilates: calc.juliaPilates + calc.ausenciaPilates,
        lucroPilates: calc.saldoFinalPilates,
        danielShare: calc.danielShare,
        stuartShare: calc.stuartShare,
        paulaShare: calc.paulaShare,
        totalGeral: calc.totalGeral,
        totalSecretaria: calc.totalSecretaria,
        totalKinesis: calc.totalKinesis,
        cpflSum: calc.cpflSum,
        fundoVal: calc.fundoVal
      };
    });

    return NextResponse.json({ year, history: historyData });
  } catch (error: any) {
    console.error("[HISTORICO_GET] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
