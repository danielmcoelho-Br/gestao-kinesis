import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const txs = await prisma.transaction.findMany({
      where: {
        OR: [
          { clinicCat: 'OUTROS' },
          { category: 'OUTROS' }
        ]
      }
    });

    let count = 0;
    for (const tx of txs) {
      let newCat = 'GERAL';
      if (tx.description.toUpperCase().includes('CPFL')) {
        newCat = 'CPFL_SALA';
      }

      await prisma.transaction.update({
        where: { id: tx.id },
        data: {
          category: newCat,
          clinicCat: null,
          clinicDesc: null
        }
      });
      count++;
    }

    return NextResponse.json({ success: true, restored: count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
