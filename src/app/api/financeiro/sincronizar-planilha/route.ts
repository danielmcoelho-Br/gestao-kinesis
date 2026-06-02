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
        },
        OR: [
          { ownerId: null },
          { ownerId: { not: 'DELETED' } }
        ]
      },
      orderBy: {
        date: 'asc'
      }
    });

    const patterns = buildHistoricalPatterns();

    // Map and enrich transactions for BB (no overrides)
    let cpflCountBB = 0;
    const enrichedBB = transactions.map(t => {
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

      let catLower = (t.category || '').toLowerCase();
      const specificCategories = [
        'secretaria', 'kinesis', 'pro_earning', 'partner_adj', 'fundo',
        'cpfl_sala_01', 'cpfl_sala_02', 'cpfl_sala_03', 'cpfl_sala_04', 'cpfl_sala_05', 'cpfl_sala_06',
        'outros'
      ];

      if (!favorecido && catLower === 'fundo') {
        favorecido = 'FUNDO';
      }
      if (favorecido === 'FUNDO') {
        catLower = 'fundo';
      }

      if (!specificCategories.includes(catLower)) {
        if (amountValue < 0) {
          const isPartner = 
            norm.includes('ALEXANDRE') || 
            norm.includes('STUART') || 
            norm.includes('DANIEL') || 
            norm.includes('PAULA');

          if (isPartner) {
            catLower = 'partner_adj';
          } else {
            catLower = 'geral';

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
              cpflCountBB++;
              if (cpflCountBB === 1) {
                catLower = 'geral';
              } else if (cpflCountBB === 2) {
                catLower = 'cpfl_sala_01';
              } else if (cpflCountBB === 3) {
                catLower = 'cpfl_sala_03';
              } else if (cpflCountBB === 4) {
                catLower = 'cpfl_sala_02';
              } else if (cpflCountBB === 5) {
                catLower = 'cpfl_sala_04';
              } else if (cpflCountBB === 6) {
                catLower = 'cpfl_sala_05';
              } else if (cpflCountBB === 7) {
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

    // Map and enrich transactions for Fin26 (with overrides)
    let cpflCountFin26 = 0;
    const enrichedFin26 = transactions.map(t => {
      const descToUse = t.clinicDesc ?? t.description;
      const amountToUse = t.clinicAmount ?? t.amount;
      const catToUse = t.clinicCat ?? t.category;

      const match = descToUse.match(/\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i);
      let favorecido = match ? match[1].toUpperCase() : '';

      if (!favorecido) {
        const amountSign = t.type === 'INCOME' ? amountToUse : -amountToUse;
        const matched = matchTransaction(descToUse, amountSign, patterns);
        if (matched) {
          favorecido = matched.toUpperCase();
        }
      }

      if (!favorecido && t.type === 'INCOME') {
        const catUpper = (catToUse || '').toUpperCase();
        if (["KINESIS", "DANIEL", "STUART", "PAULA", "PILATES", "FUNDO"].includes(catUpper)) {
          favorecido = catUpper;
        }
      }

      const cleanDesc = descToUse.replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '').trim();
      const norm = cleanDesc.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const amountValue = t.type === 'INCOME' ? amountToUse : -amountToUse;

      let catLower = (catToUse || '').toLowerCase();
      const specificCategories = [
        'secretaria', 'kinesis', 'pro_earning', 'partner_adj', 'fundo',
        'cpfl_sala_01', 'cpfl_sala_02', 'cpfl_sala_03', 'cpfl_sala_04', 'cpfl_sala_05', 'cpfl_sala_06',
        'outros'
      ];

      if (!favorecido && catLower === 'fundo') {
        favorecido = 'FUNDO';
      }
      if (favorecido === 'FUNDO') {
        catLower = 'fundo';
      }

      if (!specificCategories.includes(catLower)) {
        if (amountValue < 0) {
          const isPartner = 
            norm.includes('ALEXANDRE') || 
            norm.includes('STUART') || 
            norm.includes('DANIEL') || 
            norm.includes('PAULA');

          if (isPartner) {
            catLower = 'partner_adj';
          } else {
            catLower = 'geral';

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
              cpflCountFin26++;
              if (cpflCountFin26 === 1) {
                catLower = 'geral';
              } else if (cpflCountFin26 === 2) {
                catLower = 'cpfl_sala_01';
              } else if (cpflCountFin26 === 3) {
                catLower = 'cpfl_sala_03';
              } else if (cpflCountFin26 === 4) {
                catLower = 'cpfl_sala_02';
              } else if (cpflCountFin26 === 5) {
                catLower = 'cpfl_sala_04';
              } else if (cpflCountFin26 === 6) {
                catLower = 'cpfl_sala_05';
              } else if (cpflCountFin26 === 7) {
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
      const sortFn = (a: any, b: any) => {
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
      };

      enrichedBB.sort(sortFn);
      enrichedFin26.sort(sortFn);
    }

    // 1. Physical Write to Gestão Conta BB.xlsx
    // (Only write actual bank movement transactions, excluding internal CPFL, professional earnings, partner adjustments)
    const bankTransactions = enrichedBB.filter(e => !e.isExtra);
    const successBB = await writeToGestaoBB(`${month}${year}`, bankTransactions);

    // 2. Physical Write to Financeiro 26.xlsx
    const successFin26 = await writeToFinanceiro26(month, enrichedFin26);

    if (!successBB || !successFin26) {
      throw new Error("Falha ao gravar nas planilhas físicas.");
    }

    return NextResponse.json({
      success: true,
      message: `Planilhas atualizadas com sucesso! Sincronizados ${bankTransactions.length} lançamentos de fluxo e ${enrichedFin26.length} totais.`
    });

  } catch (error: any) {
    console.error("Error in synchronizing spreadsheets:", error);
    return NextResponse.json({ error: error.message || 'Erro ao sincronizar planilhas.' }, { status: 500 });
  }
}
