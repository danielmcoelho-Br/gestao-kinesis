const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = path.join(__dirname, '..', 'Financeiro 26.xlsx');
if (!fs.existsSync(filePath)) {
  console.log("File not found");
  process.exit(0);
}
const workbook = XLSX.read(fs.readFileSync(filePath), { type: 'buffer' });
const sheetName = 'Março';
const sheet = workbook.Sheets[sheetName];
if (!sheet) {
  console.log("Sheet not found");
  process.exit(0);
}
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

// Find the lines containing Julia, Gambá, Newton, Cris, João
rows.forEach((row, idx) => {
  for (let c = 0; c < row.length; c++) {
    const val = String(row[c]).trim();
    if (['Julia', 'Gambá', 'Newton', 'Cris', 'João', 'Ausência Nula', 'Total Arrecadado', 'Saldo Final'].includes(val)) {
      console.log(`Line ${idx + 1}: ${row.map((cell, colIdx) => `Col ${colIdx}: ${cell}`).join(' | ')}`);
    }
  }
});
