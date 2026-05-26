import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

export interface FinalTransaction {
  date: string;
  description: string;
  amount: number;
  favorecido: string;
  costCategory?: 'geral' | 'secretaria' | 'kinesis'; // for Financeiro 26
}

export async function writeToGestaoBB(
  monthYear: string, // e.g., "Maio26"
  transactions: FinalTransaction[]
): Promise<boolean> {
  const filePath = path.join(process.cwd(), 'Gestão Conta BB.xlsx');
  if (!fs.existsSync(filePath)) {
    console.error("Gestão Conta BB.xlsx file not found.");
    return false;
  }

  const fileBuffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

  // 1. Fetch Previous Month's Balance for Rollover
  let lastMonthBalance = 0;
  if (workbook.SheetNames.length > 0) {
    const lastSheetName = workbook.SheetNames[0]; // Newest sheet
    const lastSheet = workbook.Sheets[lastSheetName];
    const lastRows = XLSX.utils.sheet_to_json(lastSheet, { header: 1, defval: '' }) as any[][];
    
    // Find "Saldo Atual" on the right side
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

  // 2. Construct 2D array for the New Sheet
  const sheetData: any[][] = [];

  // Header Row
  sheetData[0] = ["Valor Transação", "Favorecido", "Finalidade", "", "Saldo Mês Anterior", lastMonthBalance];

  // Fill transactions
  transactions.forEach((t, idx) => {
    sheetData[idx + 1] = [
      t.amount,
      t.favorecido || '',
      t.description || ''
    ];
  });

  // Calculate Aggregated Balances for Dashboard
  const totals = {
    Kinesis: 0,
    Pilates: 0,
    Daniel: 0,
    Stuart: 0,
    Paula: 0,
    Curso: 0
  };

  transactions.forEach(t => {
    const fav = (t.favorecido || '').toUpperCase();
    if (fav.includes('KINESIS')) totals.Kinesis += t.amount;
    else if (fav.includes('PILATES')) totals.Pilates += t.amount;
    else if (fav.includes('DANIEL')) totals.Daniel += t.amount;
    else if (fav.includes('STUART')) totals.Stuart += t.amount;
    else if (fav.includes('PAULA')) totals.Paula += t.amount;
    else if (fav.includes('CURSO')) totals.Curso += t.amount;
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

  sheetData[7] = sheetData[7] || ["", "", ""];
  sheetData[7][4] = "Fundo Kinesis";
  sheetData[7][5] = 1846.29; // Fixed historic baseline value seen in Abril26

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
  
  let ws = workbook.Sheets[targetSheetName];
  
  // If month sheet doesn't exist, clone the "Padrão" sheet template
  if (!ws) {
    const templateWs = workbook.Sheets['Padrão'];
    if (!templateWs) {
      console.error("Padrão template sheet not found in Financeiro 26.");
      return false;
    }
    // Create deep copy of template
    const templateData = XLSX.utils.sheet_to_json(templateWs, { header: 1, defval: '' }) as any[][];
    ws = XLSX.utils.aoa_to_sheet(templateData);
    workbook.SheetNames.push(targetSheetName);
    workbook.Sheets[targetSheetName] = ws;
  }

  // Convert to 2D Array
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];

  // Extract only negative expenses categorized under Kinesis
  const costs = transactions.filter(t => t.amount < 0 && (t.favorecido || '').toUpperCase() === 'KINESIS');

  costs.forEach(c => {
    const val = Math.abs(c.amount);
    const desc = c.description;
    const category = c.costCategory || 'geral';

    // Column anchors (0-indexed):
    // Geral: Desc (col 0/A), Val (col 1/B), PagoPor (col 2/C)
    // Secretaria: Desc (col 4/E), Val (col 5/F), PagoPor (col 6/G)
    // Kinesis: Desc (col 8/I), Val (col 9/J), PagoPor (col 10/K)
    let startCol = 0;
    if (category === 'secretaria') startCol = 4;
    if (category === 'kinesis') startCol = 8;

    // Find the "TOTAL" row inside the rows to insert BEFORE it, starting scanning from row 2 (data start)
    let insertRow = -1;
    for (let r = 2; r < rows.length; r++) {
      const cellLabel = String(rows[r][startCol]).toUpperCase();
      if (cellLabel.includes('TOTAL') || cellLabel === '') {
        insertRow = r;
        break;
      }
    }

    if (insertRow !== -1) {
      // If we hit a completely empty row instead of TOTAL, use it!
      if (String(rows[insertRow][startCol]) === '') {
        rows[insertRow][startCol] = desc;
        rows[insertRow][startCol + 1] = val;
        rows[insertRow][startCol + 2] = '';
      } else {
        // We hit the "TOTAL" row! We must SHIFT and INSERT a new row right above it.
        const newRow = new Array(rows[0].length).fill('');
        newRow[startCol] = desc;
        newRow[startCol + 1] = val;
        newRow[startCol + 2] = '';
        
        rows.splice(insertRow, 0, newRow);
      }
    }
  });

  // Recompute the TOTALS row at the bottom of each block for absolute safety
  let totalRowIdx = -1;
  for (let r = rows.length - 1; r >= 0; r--) {
    if (String(rows[r][0]).toUpperCase().includes('TOTAL')) {
      totalRowIdx = r;
      break;
    }
  }

  if (totalRowIdx !== -1) {
    // Recalculate Block 1 Total
    let sum1 = 0;
    for (let r = 2; r < totalRowIdx; r++) {
      sum1 += parseFloat(String(rows[r][1])) || 0;
    }
    rows[totalRowIdx][1] = sum1;

    // Recalculate Block 2 Total
    let sum2 = 0;
    for (let r = 2; r < totalRowIdx; r++) {
      sum2 += parseFloat(String(rows[r][5])) || 0;
    }
    rows[totalRowIdx][5] = sum2;

    // Recalculate Block 3 Total
    let sum3 = 0;
    for (let r = 2; r < totalRowIdx; r++) {
      sum3 += parseFloat(String(rows[r][9])) || 0;
    }
    rows[totalRowIdx][9] = sum3;
  }

  // Write modified 2D array back to the worksheet
  const finalWs = XLSX.utils.aoa_to_sheet(rows);
  workbook.Sheets[targetSheetName] = finalWs;

  const outBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  fs.writeFileSync(filePath, outBuffer);
  return true;
}
