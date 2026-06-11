import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isDateLocked } from '@/lib/finance/lock-check';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transactionId, favorecido } = body;

    if (!transactionId) {
      return NextResponse.json({ error: 'ID da transação não fornecido.' }, { status: 400 });
    }

    const tx = await prisma.transaction.findUnique({
      where: { id: transactionId }
    });

    if (!tx) {
      return NextResponse.json({ error: 'Transação não encontrada.' }, { status: 404 });
    }

    if (await isDateLocked(tx.date)) {
      return NextResponse.json({ error: 'Este período está fechado para edições.' }, { status: 400 });
    }

    const fav = favorecido ? favorecido.trim().toUpperCase() : '';
    
    // Clean current description of any trailing payee suffix (e.g. "Bruno Figueire (KINESIS)" -> "Bruno Figueire")
    const cleanDesc = tx.description.replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '').trim();
    const dbDescription = fav ? `${cleanDesc} (${fav})` : cleanDesc;

    // For incomes (entradas), we store the payee in the category column.
    // For expenses (saídas), the category represents the cost block (e.g., GERAL, SECRETARIA, KINESIS).
    let updatedCategory = tx.category;
    if (fav === 'FUNDO') {
      updatedCategory = 'FUNDO';
    } else if (tx.category === 'FUNDO' && fav !== 'FUNDO') {
      updatedCategory = tx.type === 'INCOME' ? 'RECEBIMENTO' : 'GERAL';
    } else if (tx.type === 'INCOME') {
      updatedCategory = fav || 'RECEBIMENTO';
    }

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        description: dbDescription,
        category: updatedCategory
      }
    });

    return NextResponse.json({ success: true, transaction: updated });
  } catch (error: any) {
    console.error("Error updating single transaction payee:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
