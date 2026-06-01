import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transactionId, description, amount, category, bank, favorecido } = body;

    if (!transactionId) {
      return NextResponse.json({ error: 'ID da transação não fornecido.' }, { status: 400 });
    }

    const tx = await prisma.transaction.findUnique({
      where: { id: transactionId }
    });

    if (!tx) {
      return NextResponse.json({ error: 'Transação não encontrada.' }, { status: 404 });
    }

    const updateData: any = {};

    let currentFav = tx.description.match(/\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i)?.[1] || '';
    if (favorecido !== undefined) {
      currentFav = favorecido ? favorecido.trim().toUpperCase() : '';
    }

    if (description !== undefined) {
      const cleanDesc = description.replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '').trim();
      updateData.description = currentFav ? `${cleanDesc} (${currentFav})` : cleanDesc;
    } else if (favorecido !== undefined) {
      const cleanDesc = tx.description.replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '').trim();
      updateData.description = currentFav ? `${cleanDesc} (${currentFav})` : cleanDesc;
    }

    if (amount !== undefined) {
      updateData.amount = Math.abs(parseFloat(amount) || 0);
    }

    if (category !== undefined) {
      updateData.category = category.toUpperCase();
    }

    if (bank !== undefined) {
      updateData.bank = bank;
    }

    if (tx.type === 'INCOME' && currentFav) {
      updateData.category = currentFav;
    }

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: updateData
    });

    return NextResponse.json({ success: true, transaction: updated });
  } catch (error: any) {
    console.error("Error updating transaction:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
