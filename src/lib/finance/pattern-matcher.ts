import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

export type PatternMap = {
  [cleanDescription: string]: {
    favorecido: string;
    frequency: number;
    lastSeenSheet: string;
  };
};

function normalizeText(txt: any): string {
  if (!txt) return '';
  return String(txt)
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^A-Z0-9\s]/g, '') // Keep only letters, numbers, spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
}

export function buildHistoricalPatterns(): PatternMap {
  const filePath = path.join(process.cwd(), 'Gestão Conta BB.xlsx');
  if (!fs.existsSync(filePath)) {
    console.error("Gestão Conta BB.xlsx not found in buildHistoricalPatterns.");
    return {};
  }

  const workbook = XLSX.readFile(filePath);
  const patternMap: PatternMap = {};

  // Processes sheets in reverse order (oldest to newest) so newer ones overwrite/update frequencies naturally
  const sheets = [...workbook.SheetNames].reverse();

  sheets.forEach(sheetName => {
    // Skip non-month sheets if any exist (e.g. configuration sheets, though all looked like months)
    if (sheetName.includes('Pós Acerto') && !sheetName.includes('25') && !sheetName.includes('26')) return;

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];

    if (rows.length < 2) return;

    // Locate header indices
    let valorIdx = -1;
    let favorecidoIdx = -1;
    let finalidadeIdx = -1;

    // Search row 1 and row 2 for headers
    const topRows = rows.slice(0, 3);
    for (let r = 0; r < topRows.length; r++) {
      const row = topRows[r];
      for (let c = 0; c < row.length; c++) {
        const cellVal = normalizeText(row[c]);
        if (cellVal.includes('VALOR TRANSACAO') || cellVal === 'VALOR') valorIdx = c;
        if (cellVal.includes('FAVORECIDO')) favorecidoIdx = c;
        if (cellVal.includes('FINALIDADE') || cellVal === 'DESCRICAO') finalidadeIdx = c;
      }
      if (favorecidoIdx !== -1 && finalidadeIdx !== -1) break;
    }

    // Fallback if not found explicitly (standard was columns 0, 1, 2 or 1, 2, 3)
    if (favorecidoIdx === -1 || finalidadeIdx === -1) {
      return; // Skip sheet if layout completely unrecognized
    }

    // Start reading data below the headers (usually row 2 or 3)
    const dataRows = rows.slice(2);
    dataRows.forEach(row => {
      const finalidadeVal = row[finalidadeIdx];
      const favorecidoVal = row[favorecidoIdx];
      
      if (!finalidadeVal || !favorecidoVal) return;

      const cleanDesc = normalizeText(finalidadeVal);
      const cleanFav = String(favorecidoVal).trim();

      // Skip calculations rows on the right by making sure favorecido matches one of the clinical categories
      const allowedFavs = ['DANIEL', 'STUART', 'PAULA', 'KINESIS', 'PILATES', 'CURSO'];
      const uppercaseFav = cleanFav.toUpperCase();
      
      if (!allowedFavs.includes(uppercaseFav)) return;

      // Format favorite consistently (First Cap)
      let formattedFav = uppercaseFav.charAt(0) + uppercaseFav.slice(1).toLowerCase();
      if (formattedFav === 'Kinesis') formattedFav = 'Kinesis'; // Capital K

      if (cleanDesc.length < 3) return; // Skip single letter descriptions

      // Accumulate patterns
      if (!patternMap[cleanDesc]) {
        patternMap[cleanDesc] = {
          favorecido: formattedFav,
          frequency: 1,
          lastSeenSheet: sheetName
        };
      } else {
        patternMap[cleanDesc].frequency += 1;
        patternMap[cleanDesc].favorecido = formattedFav; // Prefer most recent months
        patternMap[cleanDesc].lastSeenSheet = sheetName;
      }
    });
  });

  return patternMap;
}

export function matchTransaction(
  description: string,
  amount: number,
  patterns: PatternMap
): string | null {
  const cleanDesc = normalizeText(description);
  if (!cleanDesc) return null;

  // 1. Exact Match on normalized description
  if (patterns[cleanDesc]) {
    return patterns[cleanDesc].favorecido;
  }

  // 2. Expense rule: Negative transactions are generally 'Kinesis' costs
  if (amount < 0) {
    return 'Kinesis';
  }

  // 3. Partial/Fuzzy Match (If the description contains a known client name, or vice-versa)
  const descKeys = Object.keys(patterns);
  
  // Check if any historical client name is contained inside the incoming transaction description
  for (const key of descKeys) {
    // Minimum length of name to avoid false positive matches on words like "DE" or "DA"
    if (key.length > 5 && cleanDesc.includes(key)) {
      return patterns[key].favorecido;
    }
  }

  // No match found - UI must prompt for manual filling
  return null;
}
