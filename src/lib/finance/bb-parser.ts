import * as XLSX from 'xlsx';

export interface RawTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  document: string;
}

function normalizeText(txt: any): string {
  if (!txt) return '';
  return String(txt)
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .trim();
}

export function parseBBStatement(fileBuffer: Buffer, filename: string): RawTransaction[] {
  let workbook: XLSX.WorkBook;
  
  try {
    workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  } catch (error) {
    console.error("Failed to parse file as XLSX workbook:", error);
    throw new Error("O arquivo enviado não é uma planilha Excel válida.");
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Convert to 2D Array for deep structural scanning
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
  
  const transactions: RawTransaction[] = [];
  
  let headerIdx = -1;
  let dataCol = -1;
  let descCol = -1;
  let detalhesCol = -1;
  let valorCol = -1;
  let docCol = -1;
  let tipoCol = -1;

  // 1. Dynamically scan for the header row
  for (let r = 0; r < Math.min(rows.length, 30); r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const val = normalizeText(row[c]);
      if (val.includes('DATA')) dataCol = c;
      if (val.includes('HISTORICO') || val.includes('DESCRICAO') || val.includes('LANCAMENTO') || val.includes('FINALIDADE')) descCol = c;
      if (val.includes('DETALHE')) detalhesCol = c;
      if (val.includes('VALOR')) valorCol = c;
      if (val.includes('DOCUMENTO') || val.includes('NUMERO')) docCol = c;
      if (val.includes('TIPO')) tipoCol = c;
    }
    // If we found the critical columns, this is the header row!
    if (dataCol !== -1 && (descCol !== -1 || detalhesCol !== -1) && valorCol !== -1) {
      headerIdx = r;
      break;
    }
  }

  // If not found via headers, assume basic fallback
  if (headerIdx === -1) {
    dataCol = 0;
    descCol = 1;
    valorCol = 2;
    headerIdx = 0;
  }

  // 2. Process rows below the header
  const dataRows = rows.slice(headerIdx + 1);
  
  dataRows.forEach((row, index) => {
    const rawDate = row[dataCol];
    const rawDesc = descCol !== -1 ? row[descCol] : '';
    const rawDetalhes = detalhesCol !== -1 ? row[detalhesCol] : '';
    const rawValor = row[valorCol];
    const rawDoc = docCol !== -1 ? row[docCol] : '';

    if (!rawDate || (!rawDesc && !rawDetalhes) || rawValor === '') return;

    const descUpper = String(rawDesc || '').toUpperCase();
    const detailsUpper = String(rawDetalhes || '').toUpperCase();

    if (descUpper.includes('SALDO') || descUpper.includes('TOTAL') || descUpper.includes('RESUMO') ||
        detailsUpper.includes('SALDO') || detailsUpper.includes('TOTAL') || detailsUpper.includes('RESUMO')) {
      return; // Skip balances/totals rows immediately
    }

    // Parse Value safely
    let amount = 0;
    let isNegative = false;

    if (typeof rawValor === 'number') {
      amount = Math.abs(rawValor);
      isNegative = rawValor < 0;
    } else {
      const strVal = String(rawValor).trim();
      const isCredit = strVal.endsWith("C") || strVal.endsWith("c");
      const isDebit = strVal.endsWith("D") || strVal.endsWith("d");
      
      let cleaned = strVal.replace(/[^\d\.,-]/g, "");
      if (cleaned.includes(",") && cleaned.includes(".")) {
        cleaned = cleaned.replace(/\./g, "").replace(",", ".");
      } else if (cleaned.includes(",")) {
        cleaned = cleaned.replace(",", ".");
      }
      
      let num = parseFloat(cleaned);
      if (isNaN(num)) num = 0;
      
      amount = Math.abs(num);
      isNegative = num < 0 || isDebit;
      if (isCredit) isNegative = false;
    }

    if (amount === 0) return;
    const finalAmount = isNegative ? -amount : amount;

    // Handle Excel serial dates vs. standard dates "DD/MM/YYYY"
    let dateStr = '';
    if (typeof rawDate === 'number') {
      const date = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
      dateStr = date.toISOString().split('T')[0];
    } else {
      const str = String(rawDate).trim();
      const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
      if (match) {
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        let year = match[3];
        if (year.length === 2) year = '20' + year;
        dateStr = `${year}-${month}-${day}`;
      } else {
        const tryDate = new Date(str);
        if (!isNaN(tryDate.getTime())) {
          dateStr = tryDate.toISOString().split('T')[0];
        } else {
          dateStr = new Date().toISOString().split('T')[0];
        }
      }
    }

    // Extract cleaned name from Detalhes if present
    let description = "";
    if (rawDetalhes && String(rawDetalhes).trim() !== "") {
      let cleaned = String(rawDetalhes)
        .replace(/^\d{2}\/\d{2}\s+\d{2}:\d{2}\s+/, "") 
        .replace(/^\d+\s+/, "") 
        .trim();
      if (cleaned) {
        description = cleaned;
      } else {
        description = String(rawDetalhes).trim();
      }
    }

    if (!description) {
      description = String(rawDesc || "").trim();
    }

    const document = String(rawDoc).trim();

    // Skip common Excel total rows
    const upperDesc = description.toUpperCase();
    if (upperDesc.includes('SALDO') || upperDesc.includes('TOTAL') || upperDesc.includes('RESUMO')) return;

    transactions.push({
      id: `tx_${Date.now()}_${index}`,
      date: dateStr,
      description,
      amount: finalAmount,
      document
    });
  });

  return transactions;
}
