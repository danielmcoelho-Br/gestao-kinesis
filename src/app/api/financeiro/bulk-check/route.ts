import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isDateLocked } from '@/lib/finance/lock-check';

export async function POST(req: NextRequest) {
  try {
    const { transactionIds, isChecked } = await req.json();
    
    if (!Array.isArray(transactionIds)) {
      return NextResponse.json({ error: 'IDs inválidos.' }, { status: 400 });
    }

    const txs = await prisma.transaction.findMany({
      where: { id: { in: transactionIds } },
      select: { date: true }
    });

    for (const tx of txs) {
      if (await isDateLocked(tx.date)) {
        return NextResponse.json({ error: 'Um ou mais lançamentos selecionados pertencem a um período fechado.' }, { status: 400 });
      }
    }

    await prisma.transaction.updateMany({
      where: { id: { in: transactionIds } },
      data: { isChecked }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error bulk updating checkboxes:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
