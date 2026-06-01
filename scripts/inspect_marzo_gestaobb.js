const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'Gestão Conta BB.xlsx');
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets['Março26'];

if (!sheet) {
  console.error("Sheet Março26 not found in Gestão Conta BB.xlsx");
  process.exit(1);
}

const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
console.log("=== INSPECTING Março26 SHEET ===");
data.forEach((row, idx) => {
  const rowStr = JSON.stringify(row);
  if (rowStr.toLowerCase().includes('guilherme') || rowStr.toLowerCase().includes('pilates')) {
    console.log(`[Row ${idx + 1}]:`, rowStr);
  }
});
