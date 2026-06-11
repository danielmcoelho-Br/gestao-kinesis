import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isDateLocked } from '@/lib/finance/lock-check';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, description, amount, type, bank, category, favorecido } = body;

    if (!date || !description || amount === undefined || !type) {
      return NextResponse.json({ error: 'Dados obrigatórios ausentes (data, descrição, valor, tipo).' }, { status: 400 });
    }

    const parsedDate = new Date(date + 'T12:00:00');
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: 'Formato de data inválido (esperado YYYY-MM-DD).' }, { status: 400 });
    }

    if (await isDateLocked(parsedDate)) {
      return NextResponse.json({ error: 'Este período está fechado para edições e lançamentos.' }, { status: 400 });
    }

    const numericAmount = Math.abs(parseFloat(amount) || 0);
    if (numericAmount === 0) {
      return NextResponse.json({ error: 'O valor da transação deve ser maior que zero.' }, { status: 400 });
    }

    const fav = favorecido ? favorecido.trim().toUpperCase() : '';
    const cleanDesc = description.replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '').trim();
    const dbDescription = fav ? `${cleanDesc} (${fav})` : cleanDesc;

    // For incomes, category is the payee. For expenses, category is GERAL, SECRETARIA or KINESIS.
    let dbCategory = category || (type === 'INCOME' ? 'RECEBIMENTO' : 'GERAL');
    if (fav === 'FUNDO' || (category && category.toUpperCase() === 'FUNDO')) {
      dbCategory = 'FUNDO';
    } else if (type === 'INCOME' && fav) {
      dbCategory = fav;
    }

    const tx = await prisma.transaction.create({
      data: {
        date: new Date(date + 'T12:00:00'), // Keep static noon hour to prevent local date conversion offsets
        description: dbDescription,
        amount: numericAmount,
        type: type,
        category: dbCategory.toUpperCase(),
        bank: bank || 'BANCO DO BRASIL'
      }
    });

    return NextResponse.json({ success: true, transaction: tx });
  } catch (error: any) {
    console.error("Error creating manual transaction:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
