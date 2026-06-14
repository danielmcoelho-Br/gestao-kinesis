import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
import { buildHistoricalPatterns, matchTransaction } from "@/lib/finance/pattern-matcher";
import { syncProfessionalGains } from "@/lib/finance/professional-gains";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startMonth = parseInt(searchParams.get("startMonth") || searchParams.get("month") || "0");
    const startYear = parseInt(searchParams.get("startYear") || searchParams.get("year") || "2026");

    // Recalculate and update professional gains (excluding Pilates)
    if (startYear > 2026 || (startYear === 2026 && startMonth > 2)) {
      await syncProfessionalGains(startYear, startMonth);
    }
    const endMonth = parseInt(searchParams.get("endMonth") || startMonth.toString());
    const endYear = parseInt(searchParams.get("endYear") || startYear.toString());

    const startDate = new Date(Date.UTC(startYear, startMonth, 1, 3, 0, 0));
    const endDate = new Date(Date.UTC(endYear, endMonth + 1, 1, 2, 59, 59, 999));

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

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);

    const pastIncomes = await prisma.transaction.findMany({
      where: {
        type: 'INCOME',
        date: { gte: sixMonthsAgo }
      },
      select: { description: true, category: true }
    });

    const patterns = { ...buildHistoricalPatterns() };

    const normalizeTextForLearning = (txt: any): string => {
      if (!txt) return '';
      return String(txt)
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    pastIncomes.forEach(inc => {
      const cleanDesc = inc.description.replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '').trim();
      const normDesc = normalizeTextForLearning(cleanDesc);
      if (normDesc.length > 3 && inc.category) {
        const catUpper = inc.category.toUpperCase();
        if (["KINESIS", "DANIEL", "STUART", "PAULA", "PILATES", "FUNDO"].includes(catUpper)) {
          patterns[normDesc] = {
            favorecido: catUpper,
            frequency: 1,
            lastSeenSheet: 'Database'
          };
        }
      }
    });

    let cpflCount = 0;
    const enriched = transactions.map(t => {
      // 1. Try to extract from suffix in description
      const match = t.description.match(/\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i);
      let favorecido = match ? match[1].toUpperCase() : '';

      // 2. Try to match using historical patterns
      if (!favorecido) {
        const amountSign = t.type === 'INCOME' ? t.amount : -t.amount;
        const matched = matchTransaction(t.description, amountSign, patterns);
        if (matched) {
          favorecido = matched.toUpperCase();
        }
      }

      // 3. Fallback for income category
      if (!favorecido && t.type === 'INCOME') {
        const catUpper = (t.category || '').toUpperCase();
        if (["KINESIS", "DANIEL", "STUART", "PAULA", "PILATES", "FUNDO"].includes(catUpper)) {
          favorecido = catUpper;
        }
      }

      // Calculate clinicFavorecido using overrides if present
      const descFin26 = t.clinicDesc ?? t.description;
      const matchFin26 = descFin26.match(/\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i);
      let clinicFavorecido = matchFin26 ? matchFin26[1].toUpperCase() : '';

      if (!clinicFavorecido) {
        const amountSign = t.type === 'INCOME' ? (t.clinicAmount ?? t.amount) : -(t.clinicAmount ?? t.amount);
        const matched = matchTransaction(descFin26, amountSign, patterns);
        if (matched) {
          clinicFavorecido = matched.toUpperCase();
        }
      }

      if (!clinicFavorecido && t.type === 'INCOME') {
        const catUpper = ((t.clinicCat ?? t.category) || '').toUpperCase();
        if (["KINESIS", "DANIEL", "STUART", "PAULA", "PILATES", "FUNDO"].includes(catUpper)) {
          clinicFavorecido = catUpper;
        }
      }

      // 4. Enrich/classify category dynamically if it is generic ('Despesa', 'Recebimento', etc.)
      const cleanDesc = t.description.replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '').trim();
      const norm = cleanDesc.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const amountValue = t.type === 'INCOME' ? t.amount : -t.amount;

      let catLower = (t.category || '').toLowerCase();
      const specificCategories = [
        'secretaria', 'kinesis', 'pro_earning', 'partner_adj', 'fundo',
        'cpfl_sala_01', 'cpfl_sala_02', 'cpfl_sala_03', 'cpfl_sala_04', 'cpfl_sala_05', 'cpfl_sala_06',
        'outros', 'hidden'
      ];

      // Align 'fundo' category and payee
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

      const finalCategory = catLower.toUpperCase();

      return {
        ...t,
        category: finalCategory,
        favorecido: favorecido || '',
        clinicFavorecido: clinicFavorecido || ''
      };
    });

    return NextResponse.json(enriched);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
