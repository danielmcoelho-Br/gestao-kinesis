const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    let val = parts.slice(1).join('=').trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    env[key] = val;
    process.env[key] = val;
  }
});

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const startDate = new Date("2026-03-01T00:00:00.000Z");
  const endDate = new Date("2026-03-31T23:59:59.999Z");

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

  console.log(`Loaded ${transactions.length} transactions.`);

  let cpflCount = 0;
  const mapped = transactions.map(t => {
    const cleanDesc = t.description.replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '').trim();
    const norm = cleanDesc.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const amount = t.type === 'INCOME' ? t.amount : -t.amount;
    
    // Categorize
    let costCategory = t.category.toLowerCase();
    
    // If it is 'despesa' or 'recebimento' or empty, let's categorize it
    if (costCategory === 'despesa' || costCategory === 'recebimento' || costCategory === 'geral') {
      if (amount < 0) {
        // Check partner
        const isPartner = 
          norm.includes('ALEXANDRE DE ALMEIDA') || 
          norm.includes('STUART') || 
          norm.includes('DANIEL MARTINS COELHO') || 
          (norm.includes('PAULA') && (norm.includes('TRANSF') || norm.includes('PIX')));
          
        if (isPartner) {
          costCategory = 'partner_adj'; // or partner transfer
        } else {
          costCategory = 'geral'; // fallback
          
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
    }

    return {
      desc: cleanDesc,
      amount: amount,
      origCat: t.category,
      mappedCat: costCategory
    };
  });

  const expenses = mapped.filter(x => x.amount < 0);
  console.log("Mapped Expenses:");
  console.log(JSON.stringify(expenses, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
