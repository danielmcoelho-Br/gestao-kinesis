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
    const { transactions: rawTransactions, saldoAnterior } = await parseBBStatement(buffer, file.name);

    // 3. Build historical patterns for auto-allocation suggestions
    const patterns = buildHistoricalPatterns();

    let cpflCount = 0;

    // 4. Correlate each transaction with pattern suggestions
    const enrichedTransactions = rawTransactions.map(tx => {
      const suggestedFav = matchTransaction(tx.description, tx.amount, patterns);
      
      // Standardize cost blocks for UI mapping if it is negative
      let costCategory = undefined;
      let selectedFavorecido = suggestedFav || '';

      if (tx.amount < 0) {
        const norm = tx.description.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        // Check if it's a partner transfer
        const isPartner = 
          norm.includes('ALEXANDRE') || 
          norm.includes('STUART') || 
          norm.includes('DANIEL') || 
          norm.includes('PAULA');

        if (isPartner) {
          costCategory = undefined;
          if (norm.includes('ALEXANDRE') || norm.includes('STUART')) {
            selectedFavorecido = 'Stuart';
          } else if (norm.includes('DANIEL')) {
            selectedFavorecido = 'Daniel';
          } else if (norm.includes('PAULA')) {
            selectedFavorecido = 'Paula';
          }
        } else {
          // Clinic cost
          selectedFavorecido = 'Kinesis'; // Default clinic costs to Kinesis
          costCategory = 'geral'; // Default expense fallback

          if (norm.includes('IMOBILIARIA') || norm.includes('FORTES GUIMARAES') || norm.includes('ALUGUEL')) {
            costCategory = 'geral';
          } else if (norm.includes('LBRK') || norm.includes('CONTABILIDADE') || norm.includes('CONTADOR')) {
            costCategory = 'kinesis';
          } else if (norm.includes('ARTEMIDAS') || norm.includes('SISTEMA')) {
            costCategory = 'kinesis';
          } else if (norm.includes('TARIFA') || norm.includes('CESTA') || norm.includes('PACOTE DE SERVICOS') || norm.includes('TAR. AGRUPADAS')) {
            costCategory = 'kinesis';
          } else if (norm.includes('LETICIA')) {
            costCategory = 'secretaria';
          } else if (norm.includes('SIND EMPREG') || norm.includes('SINDICATO')) {
            costCategory = 'secretaria';
          } else if (norm.includes('CENTRO ELETRONICO') || norm.includes('SETRON')) {
            costCategory = 'geral';
          } else if (norm.includes('SAERP') || norm.includes('AGUA')) {
            costCategory = 'geral';
          } else if (norm.includes('CLARO')) {
            costCategory = 'geral';
          } else if (norm.includes('PARTIC')) {
            costCategory = 'geral';
          } else if (norm.includes('BONCAFE') || norm.includes('CAFE')) {
            costCategory = 'geral';
          } else if (norm.includes('BRUNO REIS DE FARIA')) {
            costCategory = 'geral';
          } else if (norm.includes('ALICE MARTINS FERREIRA')) {
            costCategory = 'geral';
          } else if (norm.includes('SILVANA RIBEIRO SOARES')) {
            costCategory = 'geral';
          } else if (norm.includes('CPFL') || norm.includes('PAULISTA DE FORC')) {
            cpflCount++;
            if (cpflCount === 1) {
              costCategory = 'geral'; // CPFL ADM
            } else if (cpflCount === 2) {
              costCategory = 'cpfl_sala_01';
            } else if (cpflCount === 3) {
              costCategory = 'cpfl_sala_03';
            } else if (cpflCount === 4) {
              costCategory = 'cpfl_sala_02';
            } else if (cpflCount === 5) {
              costCategory = 'cpfl_sala_04';
            } else if (cpflCount === 6) {
              costCategory = 'cpfl_sala_05';
            } else if (cpflCount === 7) {
              costCategory = 'cpfl_sala_06';
            }
          }
        }
      }

      return {
        id: tx.id,
        date: tx.date,
        description: tx.description,
        amount: tx.amount,
        document: tx.document,
        suggestedFavorecido: selectedFavorecido,
        selectedFavorecido: selectedFavorecido, // Front-end bound
        costCategory: costCategory,
        isMatched: !!selectedFavorecido // Visual hint flag
      };
    });

    return NextResponse.json({
      success: true,
      transactionsCount: enrichedTransactions.length,
      transactions: enrichedTransactions,
      saldoAnterior
    });

  } catch (error: any) {
    console.error("Error in API financeiro/conciliador:", error);
    return NextResponse.json({ 
      error: error.message || 'Erro interno ao processar o extrato.' 
    }, { status: 500 });
  }
}
