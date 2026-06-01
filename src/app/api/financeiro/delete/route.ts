import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transactionId } = body;

    if (!transactionId) {
      return NextResponse.json({ error: 'ID da transação não fornecido.' }, { status: 400 });
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
