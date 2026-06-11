import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isDateLocked } from '@/lib/finance/lock-check';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transactionId } = body;

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

    if (tx?.category === 'PRO_EARNING') {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { ownerId: 'DELETED', amount: 0 }
      });
      return NextResponse.json({ success: true, message: 'Transação ocultada com sucesso.' });
    }

    await prisma.transaction.delete({
      where: { id: transactionId }
    });

    return NextResponse.json({ success: true, message: 'Transação excluída com sucesso.' });
  } catch (error: any) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
