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

export async function parseBBStatement(fileBuffer: Buffer, filename: string): Promise<{ transactions: RawTransaction[], saldoAnterior: number }> {
  const isPdf = filename.toLowerCase().endsWith('.pdf') || (fileBuffer.length > 4 && fileBuffer.readUInt32BE(0) === 0x25504446);
  
  if (isPdf) {
    return parseBBStatementPdf(fileBuffer);
  }

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
  let saldoAnterior = 0;
  
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
      if (val.includes('DATA') || val === 'DIA') dataCol = c;
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

    const descNorm = descUpper.replace(/\s+/g, '');
    const detailsNorm = detailsUpper.replace(/\s+/g, '');

    // Check if it's the previous month's balance rollover
    if (descNorm.includes('SALDOANTERIOR') || detailsNorm.includes('SALDOANTERIOR')) {
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
      saldoAnterior = isNegative ? -amount : amount;
      return; // Skip from regular transactions list
    }

    if (descNorm.includes('SALDO') || descNorm.includes('TOTAL') || descNorm.includes('RESUMO') ||
        detailsNorm.includes('SALDO') || detailsNorm.includes('TOTAL') || detailsNorm.includes('RESUMO')) {
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
    const normUpperDesc = upperDesc.replace(/\s+/g, '');
    if (normUpperDesc.includes('SALDO') || normUpperDesc.includes('TOTAL') || normUpperDesc.includes('RESUMO')) return;

    transactions.push({
      id: `tx_${Date.now()}_${index}`,
      date: dateStr,
      description,
      amount: finalAmount,
      document
    });
  });

  return { transactions, saldoAnterior };
}

async function parseBBStatementPdf(fileBuffer: Buffer): Promise<{ transactions: RawTransaction[], saldoAnterior: number }> {
  const { PDFParse } = require('pdf-parse');
  let text = '';
  try {
    const parser = new PDFParse(new Uint8Array(fileBuffer));
    const res = await parser.getText();
    text = res.text;
  } catch (err: any) {
    console.error("Failed to parse PDF:", err);
    throw new Error("Erro ao ler o arquivo PDF: " + err.message);
  }

  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const transactions: RawTransaction[] = [];
  let saldoAnterior = 0;
  
  let currentTx: any = null;
  let state = "LOOKING_FOR_TX";
  let descriptionLines: string[] = [];

  function cleanDescription(rawDesc: string) {
    if (!rawDesc) return "";
    let cleaned = String(rawDesc)
      .replace(/^\d{2}\/\d{2}\s+\d{2}:\d{2}\s+/, "") 
      .replace(/^\d+\s+/, "") 
      .trim();
    return cleaned;
  }

  function commitCurrentTx(index: number) {
    if (!currentTx) return;
    
    let fullDesc = descriptionLines.join(" ").trim();
    fullDesc = cleanDescription(fullDesc);
    
    if (!fullDesc) {
      fullDesc = "Transação sem descrição";
    }

    const normDesc = fullDesc.toUpperCase().replace(/\s+/g, "");

    if (normDesc.includes("SALDOANTERIOR")) {
      saldoAnterior = currentTx.type === 'EXPENSE' ? -currentTx.amount : currentTx.amount;
    } else if (normDesc.includes("SALDO") || normDesc.includes("TOTAL") || normDesc.includes("RESUMO")) {
      // Skip balance/totals rows completely
    } else {
      let dateStr = "";
      if (currentTx.date) {
        const match = currentTx.date.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
        if (match) {
          dateStr = `${match[3]}-${match[2]}-${match[1]}`;
        }
      }
      if (!dateStr) {
        dateStr = new Date().toISOString().split('T')[0];
      }

      transactions.push({
        id: `tx_pdf_${Date.now()}_${index}`,
        date: dateStr,
        description: fullDesc,
        amount: currentTx.amount,
        document: currentTx.document || ""
      });
    }
    currentTx = null;
    descriptionLines = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if it matches a single-line transaction:
    // e.g. "01/04/2026  14397  Pix - Recebido  555,00 (+)" or "01/04/2026 PIX - RECEBIDO 555,00 C"
    const singleLineMatch = line.match(/^(\d{2}\/\d{2}\/\d{4})\s+(.*?)\s+([\d\.,]+)\s+(\([+-]\)|[+-]|[CDcd])$/);
    if (singleLineMatch) {
      commitCurrentTx(i);

      const dateStr = singleLineMatch[1];
      const middle = singleLineMatch[2].trim();
      const rawAmountStr = singleLineMatch[3];
      const signRaw = singleLineMatch[4] || '';
      
      const amount = parseFloat(rawAmountStr.replace(/\./g, '').replace(',', '.'));
      const isNegative = signRaw.includes('-') || signRaw.toUpperCase() === 'D';
      const finalAmount = isNegative ? -amount : amount;

      // Extract document if it starts with numbers
      const middleParts = middle.split(/\s+/);
      let document = "";
      let description = middle;
      if (middleParts.length > 1 && /^\d+$/.test(middleParts[0])) {
        document = middleParts[0];
        description = middle.substring(document.length).trim();
      }

      currentTx = {
        amount: finalAmount,
        type: finalAmount >= 0 ? 'INCOME' : 'EXPENSE',
        date: dateStr,
        document,
        description: ""
      };
      descriptionLines.push(description);
      commitCurrentTx(i);
      state = "LOOKING_FOR_TX";
      continue;
    }

    const valMatch = line.match(/^([\d\.,]+)\s+\(([\+-])\)$/);
    
    if (valMatch) {
      commitCurrentTx(i);

      const rawAmountStr = valMatch[1];
      const sign = valMatch[2];
      const amount = parseFloat(rawAmountStr.replace(/\./g, '').replace(',', '.'));
      const finalAmount = sign === '-' ? -amount : amount;

      currentTx = {
        amount: finalAmount,
        type: sign === '+' ? 'INCOME' : 'EXPENSE',
        date: null,
        document: "",
        description: ""
      };
      state = "WAITING_FOR_DATE";
      continue;
    }

    if (state === "WAITING_FOR_DATE") {
      const dateMatch = line.match(/^(\d{2}\/\d{2}\/\d{4})/);
      if (dateMatch) {
        currentTx.date = dateMatch[1];
        
        const parts = line.split(/\s+/);
        if (parts.length >= 3) {
          currentTx.document = parts[2] || "";
        }

        const restOfLine = line.substring(dateMatch[1].length).trim();
        if (restOfLine && !/^\d+\s+\d+$/.test(restOfLine) && !/^\d+$/.test(restOfLine)) {
          descriptionLines.push(restOfLine);
        }
        state = "COLLECTING_DESC";
      }
      continue;
    }

    if (state === "COLLECTING_DESC") {
      if (line.includes("Extrato de Conta Corrente") || line.includes("Cliente CLE M") || line.includes("Agência:") || line.includes("Lançamentos") || line.includes("Dia Lote Documento") || line.startsWith("--") || line.includes("of")) {
        continue;
      }
      descriptionLines.push(line);
    }
  }

  commitCurrentTx(lines.length);

  return { transactions, saldoAnterior };
}
