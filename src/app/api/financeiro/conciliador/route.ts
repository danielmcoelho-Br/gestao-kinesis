import { NextRequest, NextResponse } from 'next/server';
import { parseBBStatement } from '@/lib/finance/bb-parser';
import { buildHistoricalPatterns, matchTransaction } from '@/lib/finance/pattern-matcher';
import { prisma } from '@/lib/prisma';

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

    if (rawTransactions.length === 0) {
      return NextResponse.json({
        success: true,
        transactionsCount: 0,
        transactions: [],
        saldoAnterior
      });
    }

    // 3. Build historical patterns for auto-allocation suggestions
    const patterns = buildHistoricalPatterns();

    // -- NEW INTELLIGENCE LOGIC: Fetch Data from DB --
    let minDate = new Date();
    let maxDate = new Date('2000-01-01');
    rawTransactions.forEach(t => {
      const d = new Date(t.date);
      if (d < minDate) minDate = d;
      if (d > maxDate) maxDate = d;
    });

    const startDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const endDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);

    const sessions = await prisma.session.findMany({
      where: {
        date: { gte: startDate, lte: endDate }
      },
      include: {
        professional: true
      }
    });

    const normalizeName = (name: string) => {
      if (!name) return '';
      return name.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    };

    const patientMap = new Map<string, { professionals: Set<string>, hasPilates: boolean }>();
    sessions.forEach(s => {
      const normName = normalizeName(s.patientName);
      if (!patientMap.has(normName)) {
        patientMap.set(normName, { professionals: new Set(), hasPilates: false });
      }
      const entry = patientMap.get(normName)!;
      if (s.professional?.name) entry.professionals.add(s.professional.name);
      if (s.serviceType?.toUpperCase().includes('PILATES')) {
        entry.hasPilates = true;
      }
    });

    const pastIncomes = await prisma.transaction.findMany({
      where: { type: 'INCOME' },
      select: { description: true, category: true },
      orderBy: { date: 'asc' }
    });
    
    const historyMap = new Map<string, string>();
    pastIncomes.forEach(inc => {
      const normDesc = normalizeName(inc.description);
      if (normDesc.length > 3) {
        historyMap.set(normDesc, inc.category);
      }
    });

    const sortedPatientNames = Array.from(patientMap.keys()).sort((a, b) => b.length - a.length);

    let cpflCount = 0;

    // 4. Correlate each transaction with pattern suggestions
    const enrichedTransactions = rawTransactions.map(tx => {
      let suggestedFav = matchTransaction(tx.description, tx.amount, patterns);
      let costCategory = undefined;
      let selectedFavorecido = suggestedFav || '';
      
      const normDesc = normalizeName(tx.description);

      if (tx.amount >= 0) {
        // Income Logic
        let matchedPatientEntry: { professionals: Set<string>, hasPilates: boolean } | null = null;
        
        for (const pName of sortedPatientNames) {
          // Remove short first names to avoid false positive matches in PIX texts
          if (pName.length > 4 && normDesc.includes(pName)) {
            matchedPatientEntry = patientMap.get(pName)!;
            break;
          }
        }

        if (matchedPatientEntry) {
          const profs = matchedPatientEntry.professionals;
          const hasDaniel = Array.from(profs).some(p => p.toUpperCase().includes('DANIEL'));
          const hasStuart = Array.from(profs).some(p => p.toUpperCase().includes('ALEXANDRE') || p.toUpperCase().includes('STUART'));
          const hasPaula = Array.from(profs).some(p => p.toUpperCase().includes('PAULA'));
          
          let ownersCount = 0;
          let assignedOwner = "";
          
          if (hasDaniel) { ownersCount++; assignedOwner = "Daniel"; }
          if (hasStuart) { ownersCount++; assignedOwner = "Stuart"; }
          if (hasPaula) { ownersCount++; assignedOwner = "Paula"; }
          if (matchedPatientEntry.hasPilates) { ownersCount++; assignedOwner = "Pilates"; }

          if (ownersCount === 1) {
            selectedFavorecido = assignedOwner;
          } else if (ownersCount > 1) {
            selectedFavorecido = ""; // Conflict -> Leave blank for manual
          } else {
            selectedFavorecido = "Kinesis"; // Other clinic staff
          }
        } else {
          // Attempt 2: Historical Database Fallback
          const pastMatchKey = Array.from(historyMap.keys()).find(k => k.length > 5 && normDesc.includes(k));
          if (pastMatchKey) {
            selectedFavorecido = historyMap.get(pastMatchKey)!;
          } else if (!selectedFavorecido) {
            selectedFavorecido = "";
          }
        }
      } else {
        // Expense Logic
        const isPartner = 
          normDesc.includes('ALEXANDRE') || 
          normDesc.includes('STUART') || 
          normDesc.includes('DANIEL') || 
          normDesc.includes('PAULA');

        if (isPartner) {
          costCategory = undefined;
          if (normDesc.includes('ALEXANDRE') || normDesc.includes('STUART')) {
            selectedFavorecido = 'Stuart';
          } else if (normDesc.includes('DANIEL')) {
            selectedFavorecido = 'Daniel';
          } else if (normDesc.includes('PAULA')) {
            selectedFavorecido = 'Paula';
          }
        } else {
          selectedFavorecido = 'Kinesis'; 
          costCategory = 'geral'; 

          if (normDesc.includes('IMOBILIARIA') || normDesc.includes('FORTES GUIMARAES') || normDesc.includes('ALUGUEL')) {
            costCategory = 'geral';
          } else if (normDesc.includes('LBRK') || normDesc.includes('CONTABILIDADE') || normDesc.includes('CONTADOR')) {
            costCategory = 'kinesis';
          } else if (normDesc.includes('ARTEMIDAS') || normDesc.includes('SISTEMA')) {
            costCategory = 'kinesis';
          } else if (normDesc.includes('TARIFA') || normDesc.includes('CESTA') || normDesc.includes('PACOTE DE SERVICOS') || normDesc.includes('TAR. AGRUPADAS')) {
            costCategory = 'kinesis';
          } else if (normDesc.includes('LETICIA')) {
            costCategory = 'secretaria';
          } else if (normDesc.includes('SIND EMPREG') || normDesc.includes('SINDICATO')) {
            costCategory = 'secretaria';
          } else if (normDesc.includes('CENTRO ELETRONICO') || normDesc.includes('SETRON')) {
            costCategory = 'geral';
          } else if (normDesc.includes('SAERP') || normDesc.includes('AGUA')) {
            costCategory = 'geral';
          } else if (normDesc.includes('CLARO')) {
            costCategory = 'geral';
          } else if (normDesc.includes('PARTIC')) {
            costCategory = 'geral';
          } else if (normDesc.includes('BONCAFE') || normDesc.includes('CAFE')) {
            costCategory = 'geral';
          } else if (normDesc.includes('BRUNO REIS DE FARIA')) {
            costCategory = 'geral';
          } else if (normDesc.includes('ALICE MARTINS FERREIRA')) {
            costCategory = 'geral';
          } else if (normDesc.includes('SILVANA RIBEIRO SOARES')) {
            costCategory = 'geral';
          } else if (normDesc.includes('CPFL') || normDesc.includes('PAULISTA DE FORC')) {
            cpflCount++;
            if (cpflCount === 1) {
              costCategory = 'geral';
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
        selectedFavorecido: selectedFavorecido, 
        costCategory: costCategory,
        isMatched: !!selectedFavorecido 
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
