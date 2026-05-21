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
  return String(txt).toUpperCase().trim();
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
  let valorCol = -1;
  let docCol = -1;

  // 1. Dynamically scan for the header row (Banco do Brasil uses Data, Histórico, Valor, etc.)
  for (let r = 0; r < Math.min(rows.length, 30); r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const val = normalizeText(row[c]);
      if (val.includes('DATA')) dataCol = c;
      if (val.includes('HISTORICO') || val.includes('DESCRICAO')) descCol = c;
      if (val.includes('VALOR')) valorCol = c;
      if (val.includes('DOCUMENTO') || val.includes('NUMERO')) docCol = c;
    }
    // If we found the critical 3 columns, this is the header row!
    if (dataCol !== -1 && descCol !== -1 && valorCol !== -1) {
      headerIdx = r;
      break;
    }
  }

  // If not found via headers, assume basic 3-column structure (0=Data, 1=Desc, 2=Valor) fallback
  if (headerIdx === -1) {
    dataCol = 0;
    descCol = 1;
    valorCol = 2;
    headerIdx = 0; // Start parsing from row 0
  }

  // 2. Process rows below the header
  const dataRows = rows.slice(headerIdx + 1);
  
  dataRows.forEach((row, index) => {
    const rawDate = row[dataCol];
    const rawDesc = row[descCol];
    const rawValor = row[valorCol];
    const rawDoc = docCol !== -1 ? row[docCol] : '';

    if (!rawDate || !rawDesc || rawValor === '') return; // Skip empty lines

    // Parse Value safely (handles string format "1.500,00" or numbers directly)
    let amount = 0;
    if (typeof rawValor === 'number') {
      amount = rawValor;
    } else {
      // Remove thousand separators (dots), replace decimal comma with dot
      const cleanVal = String(rawValor)
        .replace(/\./g, '')
        .replace(',', '.')
        .replace(/[^\d.-]/g, ''); // Keep only digits, dots, minuses
      amount = parseFloat(cleanVal);
    }

    if (isNaN(amount) || amount === 0) return; // Skip zero transactions or non-numeric items

    // Handle Excel serial dates vs. standard dates "DD/MM/YYYY"
    let dateStr = '';
    if (typeof rawDate === 'number') {
      // Excel date serial conversion
      const dateObj = XLSX.utils.format_cell({ t: 'n', v: rawDate, z: 'yyyy-mm-dd' });
      // If built-in formatter works, great, otherwise calculate manually
      const date = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
      dateStr = date.toISOString().split('T')[0];
    } else {
      const str = String(rawDate).trim();
      // Match standard format DD/MM/YYYY or DD/MM/YY
      const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
      if (match) {
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        let year = match[3];
        if (year.length === 2) year = '20' + year; // Convert YY to YYYY
        dateStr = `${year}-${month}-${day}`;
      } else {
        // Try parsing directly as standard JavaScript date
        const tryDate = new Date(str);
        if (!isNaN(tryDate.getTime())) {
          dateStr = tryDate.toISOString().split('T')[0];
        } else {
          dateStr = new Date().toISOString().split('T')[0]; // Fallback to today if invalid
        }
      }
    }

    const description = String(rawDesc).trim();
    const document = String(rawDoc).trim();

    // Skip common Excel total rows that aren't real transactions
    const upperDesc = description.toUpperCase();
    if (upperDesc.includes('SALDO') || upperDesc.includes('TOTAL') || upperDesc.includes('RESUMO')) return;

    transactions.push({
      id: `tx_${Date.now()}_${index}`,
      date: dateStr,
      description,
      amount,
      document
    });
  });

  return transactions;
}
