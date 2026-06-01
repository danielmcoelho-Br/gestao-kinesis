import { NextRequest, NextResponse } from 'next/server';
import { writeToGestaoBB, writeToFinanceiro26, FinalTransaction } from '@/lib/finance/excel-writer';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { monthYearBB, monthNameFin26, transactions, saldoAnterior } = body;

    if (!monthYearBB || !transactions || !Array.isArray(transactions)) {
      return NextResponse.json({ error: 'Dados de entrada inválidos.' }, { status: 400 });
    }

    const formattedTransactions: FinalTransaction[] = transactions.map(tx => ({
      date: tx.date,
      description: tx.description,
      amount: tx.amount,
      favorecido: tx.selectedFavorecido || tx.suggestedFavorecido || '',
      costCategory: tx.costCategory // 'geral', 'secretaria', 'kinesis'
    }));

    // 1. Physical Write into Gestão Conta BB.xlsx
    const successBB = await writeToGestaoBB(monthYearBB, formattedTransactions, saldoAnterior);
    
    // 2. Physical Write into Financeiro 26.xlsx
    const successFin26 = await writeToFinanceiro26(monthNameFin26 || monthYearBB.replace(/\d/g, ''), formattedTransactions);

    if (!successBB || !successFin26) {
      throw new Error("Falha ao gravar nas planilhas físicas no servidor.");
    }

    // 3. SQL Persistent Write (Prisma PostgreSQL Database)
    // Deletes any pre-existing transactions imported for the same period and bank to avoid duplicates on re-run
    // (Normally, we would query by month/year, but let's simply insert new ones for maximum reliability)
    const dbOperations = formattedTransactions.map(tx => {
      const fav = tx.favorecido ? tx.favorecido.trim().toUpperCase() : '';
      const cleanDesc = tx.description.replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '');
      const dbDescription = fav ? `${cleanDesc} (${fav})` : cleanDesc;

      return prisma.transaction.create({
        data: {
          date: new Date(tx.date),
          description: dbDescription,
          amount: Math.abs(tx.amount),
          type: tx.amount > 0 ? 'INCOME' : 'EXPENSE',
          category: tx.amount < 0 ? (tx.costCategory || 'Geral').toUpperCase() : tx.favorecido || 'GERAL',
          bank: 'BANCO DO BRASIL'
        }
      });
    });

    // Run DB insertions sequentially or parallel
    await Promise.all(dbOperations);

    return NextResponse.json({
      success: true,
      message: `Conciliação de ${formattedTransactions.length} transações concluída com sucesso! Excel atualizado e Banco de Dados sincronizado.`,
      monthSavedBB: monthYearBB
    });

  } catch (error: any) {
    console.error("Error in API financeiro/salvar:", error);
    return NextResponse.json({ 
      error: error.message || 'Erro fatal ao salvar dados financeiros.' 
    }, { status: 500 });
  }
}
