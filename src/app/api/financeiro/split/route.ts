import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isDateLocked } from '@/lib/finance/lock-check';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transactionId, amount1, amount2 } = body;

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

    const val1 = parseFloat(amount1);
    const val2 = parseFloat(amount2);

    if (isNaN(val1) || isNaN(val2) || val1 <= 0 || val2 <= 0) {
      return NextResponse.json({ error: 'Valores de divisão inválidos.' }, { status: 400 });
    }

    // Validate that the sum of split amounts equals the original transaction amount (allowing 0.02 margin for rounding)
    if (Math.abs((val1 + val2) - tx.amount) > 0.02) {
      return NextResponse.json({ error: 'A soma dos valores da divisão deve ser igual ao valor original da transação.' }, { status: 400 });
    }

    // Clean original payee and existing split notes from description
    const cleanDesc = tx.description.replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '')
                                    .replace(/\s*\(Orig:.*?\)/i, '')
                                    .replace(/\s*\(Rateio.*?\)/i, '')
                                    .trim();
    
    const originalTotalFormatted = tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const desc1 = `${cleanDesc} (Orig: R$ ${originalTotalFormatted})`;
    const desc2 = `${cleanDesc} (Rateio - Orig: R$ ${originalTotalFormatted})`;

    // 1. Update original transaction with part 1
    const updatedOriginal = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        amount: val1,
        description: desc1
      }
    });

    // 2. Create the split transaction with part 2
    const cloned = await prisma.transaction.create({
      data: {
        date: tx.date,
        description: desc2,
        amount: val2,
        type: tx.type,
        category: tx.type === 'INCOME' ? 'RECEBIMENTO' : tx.category,
        bank: tx.bank,
        ownerId: tx.ownerId
      }
    });

    return NextResponse.json({ 
      success: true, 
      original: updatedOriginal, 
      clone: cloned 
    });
  } catch (error: any) {
    console.error("Error splitting transaction:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
