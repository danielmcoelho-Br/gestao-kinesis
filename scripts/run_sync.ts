import fs from 'fs';
import path from 'path';

// Parse .env BEFORE importing anything else so that process.env.DATABASE_URL is set
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let val = parts.slice(1).join('=').trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  });
}

// Dynamically import imports to prevent hoisting before environment variables are set
async function main() {
  const { prisma } = await import('../src/lib/prisma');
  const { writeToGestaoBB, writeToFinanceiro26 } = await import('../src/lib/finance/excel-writer');
  const { buildHistoricalPatterns, matchTransaction } = await import('../src/lib/finance/pattern-matcher');
  const { syncProfessionalGains } = await import('../src/lib/finance/professional-gains');

  const args = process.argv.slice(2);
  const sortBy = args.find(arg => arg.startsWith('--sortBy='))?.split('=')[1] || 'date';
  const sortOrder = args.find(arg => arg.startsWith('--sortOrder='))?.split('=')[1] || 'asc';

  const month = "Março";
  const year = "26";
  const monthIndex = 2; // March is index 2

  const startYear = 2000 + parseInt(year);

  console.log("Recalculating professional gains (excluding Pilates)...");
  await syncProfessionalGains(startYear, monthIndex);

  const startDate = new Date(startYear, monthIndex, 1);
  const endDate = new Date(startYear, monthIndex + 1, 0, 23, 59, 59);

  console.log(`Syncing period: ${startDate.toISOString()} to ${endDate.toISOString()}`);

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

  console.log(`Fetched ${transactions.length} transactions from DB.`);

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
      'cpfl_sala_01', 'cpfl_sala_02', 'cpfl_sala_03', 'cpfl_sala_04', 'cpfl_sala_05', 'cpfl_sala_06',
      'outros'
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

  console.log(`Mapped ${enriched.length} total and ${enriched.filter(e => !e.isExtra).length} bank transactions.`);

  // 1. Physical Write to Gestão Conta BB.xlsx
  const bankTransactions = enriched.filter(e => !e.isExtra);
  const successBB = await writeToGestaoBB(`${month}${year}`, bankTransactions);
  console.log(`Write to Gestão Conta BB.xlsx success: ${successBB}`);

  // 2. Physical Write to Financeiro 26.xlsx
  const successFin26 = await writeToFinanceiro26(month, enriched);
  console.log(`Write to Financeiro 26.xlsx success: ${successFin26}`);

  await prisma.$disconnect();
}

main().catch(e => console.error("Error running sync script:", e));
