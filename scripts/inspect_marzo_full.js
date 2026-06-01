const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'Financeiro 26.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = 'Março';
const sheet = workbook.Sheets[sheetName];

if (!sheet) {
  console.error(`Sheet ${sheetName} not found!`);
  process.exit(1);
}

const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
console.log(`=== SEARCHING IN SHEET ${sheetName} ===`);
data.forEach((row, idx) => {
  const rowStr = JSON.stringify(row);
  if (rowStr.toLowerCase().includes('pilates') || rowStr.toLowerCase().includes('guilherme')) {
    console.log(`[Row ${idx + 1}]:`, rowStr);
  }
});
