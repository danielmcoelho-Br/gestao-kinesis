import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

export interface FinalTransaction {
  date: string;
  description: string;
  amount: number;
  favorecido: string;
  costCategory?: string; // for Financeiro 26
  customKey?: string;
}

export async function writeToGestaoBB(
  monthYear: string, // e.g., "Maio26"
  transactions: FinalTransaction[],
  saldoAnterior?: number
): Promise<boolean> {
  const filePath = path.join(process.cwd(), 'Gestão Conta BB.xlsx');
  if (!fs.existsSync(filePath)) {
    console.error("Gestão Conta BB.xlsx file not found.");
    return false;
  }

  const fileBuffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

  // 1. Fetch Previous Month's Balance for Rollover
  let lastMonthBalance = saldoAnterior || 0;
  let lastFundoBalance = 0;
  if (workbook.SheetNames.length > 0) {
    let lastSheetName = '';
    for (const name of workbook.SheetNames) {
      if (name !== monthYear) {
        lastSheetName = name;
        break;
      }
    }

    if (lastSheetName) {
      const lastSheet = workbook.Sheets[lastSheetName];
      const lastRows = XLSX.utils.sheet_to_json(lastSheet, { header: 1, defval: '' }) as any[][];
      
      // Find "Saldo Atual" on the right side
      if (!saldoAnterior) {
        for (let r = 0; r < Math.min(lastRows.length, 15); r++) {
          const row = lastRows[r];
          for (let c = 0; c < row.length; c++) {
            if (String(row[c]).toUpperCase().includes('SALDO ATUAL') && row[c+1] !== undefined) {
              lastMonthBalance = parseFloat(String(row[c+1]).replace(/[^\d.-]/g, '')) || 0;
              break;
            }
          }
          if (lastMonthBalance !== 0) break;
        }
      }

      // Find "Fundo Kinesis" on the right side
      for (let r = 0; r < Math.min(lastRows.length, 15); r++) {
        const row = lastRows[r];
        for (let c = 0; c < row.length; c++) {
          if (String(row[c]).toUpperCase().includes('FUNDO KINESIS') && row[c+1] !== undefined) {
            lastFundoBalance = parseFloat(String(row[c+1]).replace(/[^\d.-]/g, '')) || 0;
            break;
          }
        }
        if (lastFundoBalance !== 0) break;
      }
    }
  }

  if (!lastFundoBalance) {
    lastFundoBalance = 1846.29; // Fixed baseline fallback if not found
  }

  // 2. Construct 2D array for the New Sheet
  const sheetData: any[][] = [];

  // Header Row
  sheetData[0] = ["Data", "Nome do Depositante", "Valor Transação", "Responsável Financeiro", "Saldo Mês Anterior", lastMonthBalance];

  // Fill transactions
  transactions.forEach((t, idx) => {
    let formattedDate = "";
    if (t.date) {
      if (t.date.includes('-')) {
        formattedDate = t.date.split('-').reverse().join('/');
      } else {
        formattedDate = t.date;
      }
    }
    sheetData[idx + 1] = [
      formattedDate,
      t.description || '',
      t.amount,
      t.favorecido || ''
    ];
  });

  // Calculate Aggregated Balances for Dashboard
  const totals = {
    Kinesis: 0,
    Pilates: 0,
    Daniel: 0,
    Stuart: 0,
    Paula: 0,
    Fundo: 0
  };

  transactions.forEach(t => {
    const fav = (t.favorecido || '').toUpperCase();
    if (fav.includes('KINESIS')) totals.Kinesis += t.amount;
    else if (fav.includes('PILATES')) totals.Pilates += t.amount;
    else if (fav.includes('DANIEL')) totals.Daniel += t.amount;
    else if (fav.includes('STUART')) totals.Stuart += t.amount;
    else if (fav.includes('PAULA')) totals.Paula += t.amount;
    else if (fav.includes('FUNDO')) totals.Fundo += t.amount;
  });

  const totalIncomeExpenses = transactions.reduce((acc, t) => acc + t.amount, 0);
  const currentBalance = lastMonthBalance + totalIncomeExpenses;

  // 3. Populate the Right-side Summary Grid (Columns E-G)
  // Row indices for summary:
  sheetData[2] = sheetData[2] || ["", "", ""];
  sheetData[2][4] = "Saldo Atual";
  sheetData[2][5] = currentBalance;

  sheetData[5] = sheetData[5] || ["", "", ""];
  sheetData[5][4] = "Crédito Kinesis";
  sheetData[5][5] = totals.Kinesis;

  sheetData[6] = sheetData[6] || ["", "", ""];
  sheetData[6][4] = "Crédito Pilates";
  sheetData[6][5] = totals.Pilates;

  // Check if there is already a rollover transaction for Fundo in the list
  const hasFundoRollover = transactions.some(t => {
    const fav = (t.favorecido || '').toUpperCase();
    const desc = (t.description || '').toUpperCase();
    return fav.includes('FUNDO') && desc.includes('SALDO');
  });

  const finalFundoBalance = hasFundoRollover ? totals.Fundo : (lastFundoBalance + totals.Fundo);

  sheetData[7] = sheetData[7] || ["", "", ""];
  sheetData[7][4] = "Fundo Kinesis";
  sheetData[7][5] = finalFundoBalance;

  sheetData[10] = sheetData[10] || ["", "", ""];
  sheetData[10][4] = "Crédito Daniel";
  sheetData[10][5] = totals.Daniel;

  sheetData[11] = sheetData[11] || ["", "", ""];
  sheetData[11][4] = "Crédito Stuart";
  sheetData[11][5] = totals.Stuart;

  sheetData[12] = sheetData[12] || ["", "", ""];
  sheetData[12][4] = "Crédito Paula";
  sheetData[12][5] = totals.Paula;

  // 4. Write sheet to workbook (Insert it at the very beginning so it is the first tab)
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  
  // If sheet already exists (re-run), delete old one first
  if (workbook.SheetNames.includes(monthYear)) {
    delete workbook.Sheets[monthYear];
    const idx = workbook.SheetNames.indexOf(monthYear);
    workbook.SheetNames.splice(idx, 1);
  }

  // Add sheet at position 0
  workbook.SheetNames.unshift(monthYear);
  workbook.Sheets[monthYear] = ws;

  const outBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  fs.writeFileSync(filePath, outBuffer);
  return true;
}

function getSheetLabelAndCategory(desc: string, currentCategory: string): { label: string; category: string } {
  const norm = desc.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (norm.includes('IMOBILIARIA') || norm.includes('FORTES GUIMARAES') || norm.includes('ALUGUEL')) {
    return { label: 'Aluguel + IPTU', category: 'geral' };
  }
  if (norm.includes('LBRK') || norm.includes('CONTABILIDADE') || norm.includes('CONTADOR')) {
    return { label: 'Contador', category: 'kinesis' };
  }
  if (norm.includes('ARTEMIDAS') || norm.includes('SISTEMA')) {
    return { label: 'Sistema', category: 'kinesis' };
  }
  if (norm.includes('TARIFA') || norm.includes('CESTA') || norm.includes('PACOTE DE SERVICOS') || norm.includes('TAR. AGRUPADAS')) {
    return { label: 'Taxa Banco', category: 'kinesis' };
  }
  if (norm.includes('LETICIA')) {
    return { label: 'Leticia ', category: 'secretaria' }; // Note trailing space
  }
  if (norm.includes('SIND EMPREG') || norm.includes('SINDICATO')) {
    return { label: 'Sindicato', category: 'secretaria' };
  }
  if (norm.includes('CENTRO ELETRONICO') || norm.includes('SETRON')) {
    return { label: 'Setron', category: 'geral' };
  }
  if (norm.includes('SAERP') || norm.includes('AGUA')) {
    return { label: 'SAERP', category: 'geral' };
  }
  if (norm.includes('CLARO')) {
    return { label: 'Claro', category: 'geral' };
  }
  if (norm.includes('PARTIC')) {
    return { label: 'Partic', category: 'geral' };
  }
  if (norm.includes('BONCAFE') || norm.includes('CAFE')) {
    return { label: 'Café', category: 'geral' };
  }
  if (norm.includes('BRUNO REIS DE FARIA')) {
    return { label: 'ar condicionado', category: 'geral' };
  }
  if (norm.includes('ALICE MARTINS FERREIRA')) {
    return { label: 'Nina', category: 'geral' };
  }
  if (norm.includes('SILVANA RIBEIRO SOARES')) {
    return { label: 'Guarda', category: 'geral' };
  }
  if (norm.includes('CPFL') || norm.includes('PAULISTA DE FORC')) {
    if (currentCategory === 'geral') {
      return { label: 'CPFL ADM', category: 'geral' };
    }
  }
  if (norm.includes('SIMPLES NACIONAL')) {
    return { label: 'Simples Nacional', category: 'geral' };
  }
  if (norm.includes('DARF') || norm.includes('SIMPLES')) {
    return { label: 'Imposto', category: 'geral' };
  }

  return { label: desc, category: currentCategory };
}

export async function writeToFinanceiro26(
  monthName: string, // e.g., "Maio", "Junho"
  transactions: FinalTransaction[]
): Promise<boolean> {
  const filePath = path.join(process.cwd(), 'Financeiro 26.xlsx');
  if (!fs.existsSync(filePath)) {
    console.error("Financeiro 26.xlsx file not found.");
    return false;
  }

  // Load the workbook
  const fileBuffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

  // Capitalize month name to match sheet names e.g. "Maio"
  const targetSheetName = monthName.charAt(0).toUpperCase() + monthName.slice(1).toLowerCase();
  
  // Clone the 'Padrão' sheet template to ensure we write to a clean template and don't duplicate or leak old rows
  const templateWs = workbook.Sheets['Padrão'];
  if (!templateWs) {
    console.error("Padrão template sheet not found in Financeiro 26.");
    return false;
  }
  
  const templateData = XLSX.utils.sheet_to_json(templateWs, { header: 1, defval: '' }) as any[][];
  
  // If target sheet already exists, we will overwrite it with the fresh template
  if (workbook.SheetNames.includes(targetSheetName)) {
    delete workbook.Sheets[targetSheetName];
    const idx = workbook.SheetNames.indexOf(targetSheetName);
    workbook.SheetNames.splice(idx, 1);
  }
  
  // Add target sheet at its position or at the end
  workbook.SheetNames.push(targetSheetName);
  const ws = XLSX.utils.aoa_to_sheet(templateData);
  workbook.Sheets[targetSheetName] = ws;

  // Convert to 2D Array
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];

  // Helper function to find a row index dynamically by matching a label in a specific column
  const findRowIndexByLabel = (label: string, colIdx: number): number => {
    const normLabel = label.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (let r = 0; r < rows.length; r++) {
      const cellVal = String(rows[r][colIdx] || '').trim();
      const normCell = cellVal.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (normCell === normLabel) {
        return r;
      }
    }
    return -1;
  };
  // Filter transactions to clinic costs only, excluding partners and rollover balances
  const clinicCosts = transactions.filter(t => {
    const norm = t.description.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const isPartner = 
      norm.includes('ALEXANDRE') || 
      norm.includes('STUART') || 
      norm.includes('DANIEL') || 
      norm.includes('PAULA');
      
    if (isPartner) return false;
    if (norm.includes('SALDO')) return false;

    return t.costCategory === 'geral' || t.costCategory === 'secretaria' || t.costCategory === 'kinesis';
  });

  const cpflBills = transactions.filter(t => 
    t.costCategory === 'cpfl_sala' || 
    (t.costCategory && t.costCategory.startsWith('cpfl_sala_'))
  );
  const proEarnings = transactions.filter(t => t.costCategory === 'pro_earning');
  const partnerAdjs = transactions.filter(t => t.costCategory === 'partner_adj');

  // 1. Populate Clinic Costs in columns A-C, E-G, I-K
  clinicCosts.forEach(c => {
    const val = Math.abs(c.amount);
    const mapped = getSheetLabelAndCategory(c.description, c.costCategory || 'geral');
    const desc = mapped.label;
    const category = mapped.category;
    const payee = c.favorecido || '';

    let startCol = 0;
    if (category === 'secretaria') startCol = 4;
    if (category === 'kinesis') startCol = 8;

    // Search for a matching row description (case-insensitive, trimmed) in rows 2 to rows.length
    let matchIdx = -1;
    for (let r = 2; r < rows.length; r++) {
      const cellLabel = String(rows[r][startCol] || '').trim().toUpperCase();
      if (cellLabel === desc.trim().toUpperCase()) {
        matchIdx = r;
        break;
      }
      if (cellLabel.includes('TOTAL') || cellLabel === '') {
        // Stop matching on TOTAL or empty row (end of block)
        break;
      }
    }

    if (matchIdx !== -1) {
      // Update existing item
      rows[matchIdx][startCol + 1] = val;
      rows[matchIdx][startCol + 2] = payee;
    } else {
      // Find the first empty row or "TOTAL" row in that block to insert
      let insertRow = -1;
      for (let r = 2; r < rows.length; r++) {
        const cellLabel = String(rows[r][startCol] || '').toUpperCase();
        if (cellLabel.includes('TOTAL') || cellLabel === '') {
          insertRow = r;
          break;
        }
      }

      if (insertRow !== -1) {
        if (String(rows[insertRow][startCol] || '') === '') {
          rows[insertRow][startCol] = desc;
          rows[insertRow][startCol + 1] = val;
          rows[insertRow][startCol + 2] = payee;
        } else {
          // Insert new row before TOTAL
          const newRow = new Array(rows[0].length).fill('');
          newRow[startCol] = desc;
          newRow[startCol + 1] = val;
          newRow[startCol + 2] = payee;
          rows.splice(insertRow, 0, newRow);
        }
      }
    }
  });

  // 2. Write CPFL Room Bills dynamically based on their labels in columns M (12) and Q (16)
  cpflBills.forEach(b => {
    const category = b.costCategory || '';
    const val = Math.abs(b.amount);
    
    let label = '';
    let isSala02 = false;

    if (category === 'cpfl_sala_01') label = 'CPFL sala 01';
    else if (category === 'cpfl_sala_02') isSala02 = true;
    else if (category === 'cpfl_sala_03') label = 'CPFL sala 03';
    else if (category === 'cpfl_sala_04') label = 'CPFL sala 04';
    else if (category === 'cpfl_sala_05') label = 'CPFL sala 05';
    else if (category === 'cpfl_sala_06') label = 'CPFL sala 06';
    else {
      const key = (b.customKey || b.description || '').toLowerCase();
      if (key.includes('sala 01') || key.includes('sala1')) label = 'CPFL sala 01';
      else if (key.includes('sala 02') || key.includes('sala2')) isSala02 = true;
      else if (key.includes('sala 03') || key.includes('sala3')) label = 'CPFL sala 03';
      else if (key.includes('sala 04') || key.includes('sala4')) label = 'CPFL sala 04';
      else if (key.includes('sala 05') || key.includes('sala5')) label = 'CPFL sala 05';
      else if (key.includes('sala 06') || key.includes('sala6')) label = 'CPFL sala 06';
    }

    if (isSala02) {
      const rIdx = findRowIndexByLabel('CPFL sala 02', 16);
      if (rIdx !== -1) {
        const currentVal = parseFloat(String(rows[rIdx][17])) || 0;
        rows[rIdx][17] = currentVal + val;
      } else {
        console.warn('CPFL sala 02 label row not found in template.');
      }
    } else if (label) {
      const rIdx = findRowIndexByLabel(label, 12);
      if (rIdx !== -1) {
        const currentVal = parseFloat(String(rows[rIdx][13])) || 0;
        rows[rIdx][13] = currentVal + val;
      } else {
        console.warn(`${label} label row not found in template.`);
      }
    }
  });

  // 3. Write Professional Earnings dynamically based on their labels in column M (12)
  proEarnings.forEach(e => {
    const key = (e.customKey || e.description || '').toLowerCase();
    if (key.includes('pilates')) return; // EXCLUDE Pilates from Fisioterapia block!
    const val = Math.abs(e.amount);
    let label = '';
    if (key.includes('julia')) label = 'Julia';
    else if (key.includes('gamba') || key.includes('gambá')) label = 'Gambá';
    else if (key.includes('newton')) label = 'Newton';
    else if (key.includes('cris')) label = 'Cris';
    else if (key.includes('joao') || key.includes('joão')) label = 'João';
    else if (key.includes('ausencia') || key.includes('ausência')) label = 'Ausência Nula';

    if (label) {
      const rIdx = findRowIndexByLabel(label, 12);
      if (rIdx !== -1) {
        const currentVal = parseFloat(String(rows[rIdx][13])) || 0;
        rows[rIdx][13] = currentVal + val;
      } else {
        console.warn(`Professional earning label "${label}" row not found in spreadsheet.`);
      }
    }
  });

  // 4. Write Partner Adjustments dynamically based on their labels in Column A (0) to Column B (1)
  partnerAdjs.forEach(a => {
    const favUpper = (a.favorecido || '').toUpperCase();
    const key = (a.customKey || '').toLowerCase();
    const desc = (a.description || '').toLowerCase();
    const val = a.amount; // can be negative or positive
    
    let label = '';
    if (favUpper === 'DANIEL' || key.includes('daniel') || desc.includes('daniel')) {
      label = 'Daniel';
    } else if (favUpper === 'PAULA' || key.includes('paula') || desc.includes('paula')) {
      label = 'Paula';
    } else if (favUpper === 'STUART' || key.includes('stuart') || desc.includes('stuart') || key.includes('alexandre') || desc.includes('alexandre')) {
      label = 'Stuart';
    }

    if (label) {
      const rIdx = findRowIndexByLabel(label, 0);
      if (rIdx !== -1) {
        const currentVal = parseFloat(String(rows[rIdx][1])) || 0;
        rows[rIdx][1] = currentVal + val;
      } else {
        console.warn(`Partner adjustment label "${label}" row not found in spreadsheet.`);
      }
    }
  });

  // 5. Write Fundo transactions dynamically in Column N (13) based on label "Fundo" in Column M (12)
  const customFundoTransactions = transactions.filter(t => 
    t.costCategory === 'fundo' && 
    !t.description.toUpperCase().includes('SALDO')
  );

  if (customFundoTransactions.length > 0) {
    const rIdx = findRowIndexByLabel('Fundo', 12);
    if (rIdx !== -1) {
      const sumFundo = customFundoTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      rows[rIdx][13] = sumFundo;
    } else {
      console.warn('Fundo label row not found in template.');
    }
  }

  // 6. Recalculate TOTALS rows at the bottom of each cost block
  let totalRowIdx = -1;
  for (let r = rows.length - 1; r >= 0; r--) {
    if (String(rows[r][0] || '').toUpperCase().includes('TOTAL')) {
      totalRowIdx = r;
      break;
    }
  }

  if (totalRowIdx !== -1) {
    // Recalculate Block 1 Total (Geral)
    let sum1 = 0;
    for (let r = 2; r < totalRowIdx; r++) {
      sum1 += parseFloat(String(rows[r][1] || '0')) || 0;
    }
    rows[totalRowIdx][1] = sum1;

    // Recalculate Block 2 Total (Secretaria)
    let sum2 = 0;
    for (let r = 2; r < totalRowIdx; r++) {
      sum2 += parseFloat(String(rows[r][5] || '0')) || 0;
    }
    rows[totalRowIdx][5] = sum2;

    // Recalculate Block 3 Total (Kinesis)
    let sum3 = 0;
    for (let r = 2; r < totalRowIdx; r++) {
      sum3 += parseFloat(String(rows[r][9] || '0')) || 0;
    }
    rows[totalRowIdx][9] = sum3;

    // Recalculate Block 4 Total (Fisioterapia)
    let sum4 = 0;
    for (let r = 2; r < totalRowIdx; r++) {
      sum4 += parseFloat(String(rows[r][13] || '0')) || 0;
    }
    rows[totalRowIdx][13] = sum4;

    // Recalculate Block 5 Total (Pilates)
    let sum5 = 0;
    for (let r = 2; r < totalRowIdx; r++) {
      sum5 += parseFloat(String(rows[r][17] || '0')) || 0;
    }
    rows[totalRowIdx][17] = sum5;
  }

  // Recalculate Block 4 Professional Earnings, Total Arrecadado, Saldo Final and Partner Acertos
  const rJulia = findRowIndexByLabel('Julia', 12);
  const rGamba = findRowIndexByLabel('Gambá', 12);
  const rNewton = findRowIndexByLabel('Newton', 12);
  const rCris = findRowIndexByLabel('Cris', 12);
  const rJoao = findRowIndexByLabel('João', 12);
  const rAusencia = findRowIndexByLabel('Ausência Nula', 12);
  const rTotalArrecadado = findRowIndexByLabel('Total Arrecadado', 12);
  const rSaldoFinal = findRowIndexByLabel('Saldo Final', 12);
  const rAcertoDaniel = findRowIndexByLabel('Acerto Daniel', 12);
  const rAcertoStuart = findRowIndexByLabel('Acerto Stuart', 12);
  const rAcertoPaula = findRowIndexByLabel('Acerto Paula', 12);

  let totalArrecadado = 0;
  [rJulia, rGamba, rNewton, rCris, rJoao, rAusencia].forEach(rIdx => {
    if (rIdx !== -1) {
      totalArrecadado += parseFloat(String(rows[rIdx][13] || '0')) || 0;
    }
  });

  if (rTotalArrecadado !== -1) {
    rows[rTotalArrecadado][13] = totalArrecadado;
  }

  let sum4Val = 0;
  if (totalRowIdx !== -1) {
    sum4Val = parseFloat(String(rows[totalRowIdx][13] || '0')) || 0;
  }

  const saldoFinal = totalArrecadado - sum4Val;
  if (rSaldoFinal !== -1) {
    rows[rSaldoFinal][13] = saldoFinal;
  }

  if (rAcertoDaniel !== -1) rows[rAcertoDaniel][13] = saldoFinal * 0.4;
  if (rAcertoStuart !== -1) rows[rAcertoStuart][13] = saldoFinal * 0.4;
  if (rAcertoPaula !== -1) rows[rAcertoPaula][13] = saldoFinal * 0.2;

  // Recalculate Pilates Block in Column U/V
  const rArrecadadoU = findRowIndexByLabel('Arrecadado', 20);
  const rJuliaU = findRowIndexByLabel('Pag. Julia', 20);
  const rPaulaU = findRowIndexByLabel('Pag Paula', 20);
  const rCustosU = findRowIndexByLabel('Custos', 20);
  const rImpostoU = findRowIndexByLabel('Imposto', 20);
  const rAusenciaU = findRowIndexByLabel('Ausencia Nula', 20);
  const rTotalU = findRowIndexByLabel('TOTAL', 20);
  const rPorSocioU = findRowIndexByLabel('Por Sócio', 20);

  let sum5Val = 0;
  if (totalRowIdx !== -1) {
    sum5Val = parseFloat(String(rows[totalRowIdx][17] || '0')) || 0;
  }
  if (rCustosU !== -1) {
    rows[rCustosU][21] = sum5Val;
  }

  // Load Pilates parameters from proEarnings
  const juliaPilatesTx = proEarnings.find(e => {
    const key = (e.customKey || e.description || '').toLowerCase();
    return key.includes('julia') && key.includes('pilates');
  });
  const paulaPilatesTx = proEarnings.find(e => {
    const key = (e.customKey || e.description || '').toLowerCase();
    return key.includes('paula') && key.includes('pilates');
  });
  const ausenciaPilatesTx = proEarnings.find(e => {
    const key = (e.customKey || e.description || '').toLowerCase();
    return key.includes('ausencia') && key.includes('pilates');
  });
  const impostoPilatesTx = proEarnings.find(e => {
    const key = (e.customKey || e.description || '').toLowerCase();
    return key.includes('imposto') && key.includes('pilates');
  });

  let valJuliaU = juliaPilatesTx ? Math.abs(juliaPilatesTx.amount) : 0;
  if (!valJuliaU && rJuliaU !== -1) valJuliaU = parseFloat(String(rows[rJuliaU][21] || '0')) || 0;
  
  let valPaulaU = paulaPilatesTx ? Math.abs(paulaPilatesTx.amount) : 0;
  if (!valPaulaU && rPaulaU !== -1) valPaulaU = parseFloat(String(rows[rPaulaU][21] || '0')) || 0;
  
  let valAusenciaU = ausenciaPilatesTx ? Math.abs(ausenciaPilatesTx.amount) : 0;
  if (!valAusenciaU && rAusenciaU !== -1) valAusenciaU = parseFloat(String(rows[rAusenciaU][21] || '0')) || 0;

  let valImpostoU = impostoPilatesTx ? Math.abs(impostoPilatesTx.amount) : 0;
  if (!valImpostoU && rImpostoU !== -1) valImpostoU = parseFloat(String(rows[rImpostoU][21] || '0')) || 0;

  // Write values back to cells
  if (rJuliaU !== -1) rows[rJuliaU][21] = valJuliaU;
  if (rPaulaU !== -1) rows[rPaulaU][21] = valPaulaU;
  if (rAusenciaU !== -1) rows[rAusenciaU][21] = valAusenciaU;
  if (rImpostoU !== -1) rows[rImpostoU][21] = valImpostoU;
  
  const arrecadadoU = (valJuliaU * 2) + valPaulaU + valAusenciaU;
  if (rArrecadadoU !== -1) {
    rows[rArrecadadoU][21] = arrecadadoU;
  }

  const totalU = arrecadadoU - valJuliaU - valPaulaU - sum5Val - valImpostoU;
  if (rTotalU !== -1) {
    rows[rTotalU][21] = totalU;
  }

  if (rPorSocioU !== -1) {
    rows[rPorSocioU][21] = totalU / 3;
  }

  // Write modified 2D array back to the worksheet
  const finalWs = XLSX.utils.aoa_to_sheet(rows);
  workbook.Sheets[targetSheetName] = finalWs;

  const outBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  fs.writeFileSync(filePath, outBuffer);
  return true;
}
