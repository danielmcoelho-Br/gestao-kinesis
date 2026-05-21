import { NextRequest, NextResponse } from 'next/server';
import { parseBBStatement } from '@/lib/finance/bb-parser';
import { buildHistoricalPatterns, matchTransaction } from '@/lib/finance/pattern-matcher';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    // 1. Read file into buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 2. Parse BB Statement
    const rawTransactions = parseBBStatement(buffer, file.name);

    // 3. Build historical patterns for auto-allocation suggestions
    const patterns = buildHistoricalPatterns();

    // 4. Correlate each transaction with pattern suggestions
    const enrichedTransactions = rawTransactions.map(tx => {
      const suggestedFav = matchTransaction(tx.description, tx.amount, patterns);
      
      // Standardize cost blocks for UI mapping if it is negative
      let costCategory = undefined;
      if (tx.amount < 0) {
        costCategory = 'geral'; // Default expense fallback
        const upperDesc = tx.description.toUpperCase();
        if (upperDesc.includes('LETICIA') || upperDesc.includes('DARF') || upperDesc.includes('FGTS')) {
          costCategory = 'secretaria';
        } else if (upperDesc.includes('CONTADOR') || upperDesc.includes('SISTEMA') || upperDesc.includes('TARIFA')) {
          costCategory = 'kinesis';
        }
      }

      return {
        id: tx.id,
        date: tx.date,
        description: tx.description,
        amount: tx.amount,
        document: tx.document,
        suggestedFavorecido: suggestedFav,
        selectedFavorecido: suggestedFav || '', // Front-end bound
        costCategory: costCategory,
        isMatched: !!suggestedFav // Visual hint flag
      };
    });

    return NextResponse.json({
      success: true,
      transactionsCount: enrichedTransactions.length,
      transactions: enrichedTransactions
    });

  } catch (error: any) {
    console.error("Error in API financeiro/conciliador:", error);
    return NextResponse.json({ 
      error: error.message || 'Erro interno ao processar o extrato.' 
    }, { status: 500 });
  }
}
