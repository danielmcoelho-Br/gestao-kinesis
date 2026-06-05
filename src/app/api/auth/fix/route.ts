import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const startDate = new Date(2026, 3, 1);
    const endDate = new Date(2026, 4, 0, 23, 59, 59);

    const transactions = await prisma.transaction.findMany({
      where: { date: { gte: startDate, lte: endDate } }
    });

    const getExtraVal = (desc: string, cat: string) => {
      return transactions.filter(t => t.category === cat && t.description === desc && t.type === 'INCOME').reduce((a, b) => a + b.amount, 0);
    };

    const getExtraValWithSign = (desc: string, cat: string) => {
      return transactions.filter(t => t.category === cat && t.description === desc)
        .reduce((acc, t) => t.type === 'INCOME' ? acc + t.amount : acc - t.amount, 0);
    };

    // Fisio
    const juliaEarning = getExtraVal("Julia", "PRO_EARNING");
    const gambaEarning = getExtraVal("Gambá", "PRO_EARNING");
    const newtonEarning = getExtraVal("Newton", "PRO_EARNING");
    const crisEarning = getExtraVal("Cris", "PRO_EARNING");
    const joaoEarning = getExtraVal("João", "PRO_EARNING");
    const ausenciaEarning = getExtraVal("Ausência Nula", "PRO_EARNING");
    const totalArrecadado = juliaEarning + gambaEarning + newtonEarning + crisEarning + joaoEarning + ausenciaEarning;

    // Costs
    const totalKinesis = getExtraVal("Kinesis", "FIXED_COST");
    const totalGeral = getExtraVal("Geral", "FIXED_COST");
    const totalSecretaria = getExtraVal("Secretaria", "FIXED_COST");
    const totalInsumo = getExtraVal("Insumos", "FIXED_COST");
    const impostosFisio = getExtraVal("Impostos", "FIXED_COST");
    const marketing = getExtraVal("Marketing", "FIXED_COST");
    const limpezas = getExtraVal("Limpezas", "FIXED_COST");
    const softwares = getExtraVal("Softwares", "FIXED_COST");
    const recisaoJu = getExtraVal("Recisão Ju", "FIXED_COST");
    const decimoTerceiro = getExtraVal("13o", "FIXED_COST");
    const decimoTerceiroCris = getExtraVal("13o Cris", "FIXED_COST");
    const decimoTerceiroGamba = getExtraVal("13o Gambá", "FIXED_COST");
    const cpflSala02 = getExtraVal("CPFL Sala 02", "FIXED_COST");

    const totalShared = (totalKinesis * 0.5) + (totalGeral * 0.83) + (totalSecretaria * 0.66) + totalInsumo + impostosFisio + marketing + limpezas + softwares + recisaoJu + decimoTerceiro + decimoTerceiroCris + decimoTerceiroGamba;

    const saldoFinal = totalArrecadado - totalShared;

    // Pilates
    const juliaPilates = getExtraVal("Julia (Pilates)", "PRO_EARNING");
    const ausenciaPilates = getExtraVal("Ausência Nula (Pilates)", "PRO_EARNING");
    const impostoPilates = getExtraVal("Imposto (Pilates)", "PRO_EARNING");

    const arrecadadoPilates = (juliaPilates * 2) + ausenciaPilates;
    const custosPilates = (totalGeral * 0.17) + (totalSecretaria * 0.333) + (totalKinesis * 0.5) + cpflSala02;
    const saldoFinalPilates = arrecadadoPilates - juliaPilates - custosPilates - impostoPilates;

    // Adjustments
    const danielAdj = getExtraValWithSign("Daniel Adicional", "PARTNER_ADJ");
    const stuartAdj = getExtraValWithSign("Stuart Adicional", "PARTNER_ADJ");

    // Reimbursements (Assuming Reembolso means income transactions of category PARTNER_PAID, wait no, how is Reembolso defined in code?)
    // Let me check my code to see how `danielPaid` was calculated... I'll just check `transactions` for now.

    const danielShare = (saldoFinal * 0.40) + (saldoFinalPilates / 3) - crisEarning + danielAdj;
    const stuartShare = (saldoFinal * 0.40) + (saldoFinalPilates / 3) + stuartAdj;

    return NextResponse.json({ 
      success: true, 
      fisio: {
        totalArrecadado,
        totalShared,
        saldoFinal
      },
      pilates: {
        lucroBruto: arrecadadoPilates,
        juliaPilates,
        custosPilates,
        impostoPilates,
        saldoFinalPilates
      },
      daniel: {
        fisio: saldoFinal * 0.4,
        pilates: saldoFinalPilates / 3,
        crisEarning,
        danielAdj,
        total: danielShare
      },
      stuart: {
        fisio: saldoFinal * 0.4,
        pilates: saldoFinalPilates / 3,
        stuartAdj,
        total: stuartShare
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
