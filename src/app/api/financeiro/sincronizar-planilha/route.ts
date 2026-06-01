import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeToGestaoBB, writeToFinanceiro26, FinalTransaction } from '@/lib/finance/excel-writer';
import { buildHistoricalPatterns, matchTransaction } from '@/lib/finance/pattern-matcher';
import { syncProfessionalGains } from '@/lib/finance/professional-gains';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { month, year, sortBy, sortOrder } = body; // e.g. "Maio", "26"

    if (!month || !year) {
      return NextResponse.json({ error: 'Mês e ano são obrigatórios.' }, { status: 400 });
    }

    const monthsPt = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const monthIndex = monthsPt.indexOf(month);
    if (monthIndex === -1) {
      return NextResponse.json({ error: 'Mês inválido.' }, { status: 400 });
    }

    const startYear = 2000 + parseInt(year);
    // Recalculate and update professional gains (excluding Pilates) before synchronizing
    await syncProfessionalGains(startYear, monthIndex);

    const startDate = new Date(startYear, monthIndex, 1);
    const endDate = new Date(startYear, monthIndex + 1, 0, 23, 59, 59);

    // Fetch all transactions for the selected month
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    const patterns = buildHistoricalPatterns();

    // Map and enrich transactions for Excel writing
    let cpflCount = 0;
    const enriched = transactions.map(t => {
      // Extract favorecido from description suffix or history patterns
      const match = t.description.match(/\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i);
      let favorecido = match ? match[1].toUpperCase() : '';

      if (!favorecido) {
        const amountSign = t.type === 'INCOME' ? t.amount : -t.amount;
        const matched = matchTransaction(t.description, amountSign, patterns);
        if (matched) {
          favorecido = matched.toUpperCase();
        }
      }

      if (!favorecido && t.type === 'INCOME') {
        const catUpper = (t.category || '').toUpperCase();
        if (["KINESIS", "DANIEL", "STUART", "PAULA", "PILATES", "FUNDO"].includes(catUpper)) {
          favorecido = catUpper;
        }
      }

      const cleanDesc = t.description.replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '').trim();
      const norm = cleanDesc.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const amountValue = t.type === 'INCOME' ? t.amount : -t.amount;

      // Determine costCategory
      let catLower = (t.category || '').toLowerCase();
      
      const specificCategories = [
        'secretaria', 'kinesis', 'pro_earning', 'partner_adj', 'fundo',
        'cpfl_sala_01', 'cpfl_sala_02', 'cpfl_sala_03', 'cpfl_sala_04', 'cpfl_sala_05', 'cpfl_sala_06'
      ];

      // Align 'fundo' category and payee
      if (!favorecido && catLower === 'fundo') {
        favorecido = 'FUNDO';
      }
      if (favorecido === 'FUNDO') {
        catLower = 'fundo';
      }

      // If category in DB is generic (like 'despesa', 'recebimento', 'geral', or empty), classify it
      if (!specificCategories.includes(catLower)) {
        if (amountValue < 0) {
          // Check if it's a partner transfer
          const isPartner = 
            norm.includes('ALEXANDRE') || 
            norm.includes('STUART') || 
            norm.includes('DANIEL') || 
            norm.includes('PAULA');

          if (isPartner) {
            catLower = 'partner_adj';
          } else {
            catLower = 'geral'; // default fallback for expense

            if (norm.includes('IMOBILIARIA') || norm.includes('FORTES GUIMARAES') || norm.includes('ALUGUEL')) {
              catLower = 'geral';
            } else if (norm.includes('LBRK') || norm.includes('CONTABILIDADE') || norm.includes('CONTADOR')) {
              catLower = 'kinesis';
            } else if (norm.includes('ARTEMIDAS') || norm.includes('SISTEMA')) {
              catLower = 'kinesis';
            } else if (norm.includes('TARIFA') || norm.includes('CESTA') || norm.includes('PACOTE DE SERVICOS') || norm.includes('TAR. AGRUPADAS')) {
              catLower = 'kinesis';
            } else if (norm.includes('LETICIA')) {
              catLower = 'secretaria';
            } else if (norm.includes('SIND EMPREG') || norm.includes('SINDICATO')) {
              catLower = 'secretaria';
            } else if (norm.includes('CENTRO ELETRONICO') || norm.includes('SETRON')) {
              catLower = 'geral';
            } else if (norm.includes('SAERP') || norm.includes('AGUA')) {
              catLower = 'geral';
            } else if (norm.includes('CLARO')) {
              catLower = 'geral';
            } else if (norm.includes('PARTIC')) {
              catLower = 'geral';
            } else if (norm.includes('BONCAFE') || norm.includes('CAFE')) {
              catLower = 'geral';
            } else if (norm.includes('BRUNO REIS DE FARIA')) {
              catLower = 'geral';
            } else if (norm.includes('ALICE MARTINS FERREIRA')) {
              catLower = 'geral';
            } else if (norm.includes('SILVANA RIBEIRO SOARES')) {
              catLower = 'geral';
            } else if (norm.includes('CPFL') || norm.includes('PAULISTA DE FORC')) {
              cpflCount++;
              if (cpflCount === 1) {
                catLower = 'geral'; // CPFL ADM
              } else if (cpflCount === 2) {
                catLower = 'cpfl_sala_01';
              } else if (cpflCount === 3) {
                catLower = 'cpfl_sala_03';
              } else if (cpflCount === 4) {
                catLower = 'cpfl_sala_02';
              } else if (cpflCount === 5) {
                catLower = 'cpfl_sala_04';
              } else if (cpflCount === 6) {
                catLower = 'cpfl_sala_05';
              } else if (cpflCount === 7) {
                catLower = 'cpfl_sala_06';
              }
            }
          }
        }
      }

      const isExtra = ['cpfl_sala', 'pro_earning', 'partner_adj'].includes(catLower);

      return {
        date: t.date.toISOString().split('T')[0],
        description: cleanDesc,
        amount: amountValue,
        favorecido: favorecido || '',
        costCategory: catLower as any,
        customKey: cleanDesc,
        isExtra
      };
    });

    // Sort transactions if sortBy is provided
    if (sortBy) {
      const order = sortOrder === 'desc' ? -1 : 1;
      enriched.sort((a: any, b: any) => {
        let valA: any = a[sortBy === 'favorecido' ? 'favorecido' : (sortBy === 'descrição' || sortBy === 'description') ? 'description' : sortBy === 'data' ? 'date' : sortBy === 'valor' ? 'amount' : sortBy] || '';
        let valB: any = b[sortBy === 'favorecido' ? 'favorecido' : (sortBy === 'descrição' || sortBy === 'description') ? 'description' : sortBy === 'data' ? 'date' : sortBy === 'valor' ? 'amount' : sortBy] || '';

        if (typeof valA === 'string') {
          valA = valA.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        }
        if (typeof valB === 'string') {
          valB = valB.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        }

        if (valA < valB) return -1 * order;
        if (valA > valB) return 1 * order;
        return 0;
      });
    }

    // 1. Physical Write to Gestão Conta BB.xlsx
    // (Only write actual bank movement transactions, excluding internal CPFL, professional earnings, partner adjustments)
    const bankTransactions = enriched.filter(e => !e.isExtra);
    const successBB = await writeToGestaoBB(`${month}${year}`, bankTransactions);

    // 2. Physical Write to Financeiro 26.xlsx
    const successFin26 = await writeToFinanceiro26(month, enriched);

    if (!successBB || !successFin26) {
      throw new Error("Falha ao gravar nas planilhas físicas.");
    }

    return NextResponse.json({
      success: true,
      message: `Planilhas atualizadas com sucesso! Sincronizados ${bankTransactions.length} lançamentos de fluxo e ${enriched.length} totais.`
    });

  } catch (error: any) {
    console.error("Error in synchronizing spreadsheets:", error);
    return NextResponse.json({ error: error.message || 'Erro ao sincronizar planilhas.' }, { status: 500 });
  }
}
