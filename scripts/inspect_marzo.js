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
console.log(`=== INSPECTING SHEET ${sheetName} ===`);
data.forEach((row, idx) => {
  // Let's print rows that have some value in columns A-K
  const hasValue = row.slice(0, 12).some(cell => String(cell).trim() !== '' && String(cell).trim() !== '0');
  const rowDesc = String(row[0] || row[4] || row[8] || '').trim();
  
  if (hasValue || idx < 3 || rowDesc.includes('TOTAL')) {
    console.log(`[Row ${idx + 1}]:`, JSON.stringify(row.slice(0, 20).map(cell => String(cell).trim())));
  }
});
