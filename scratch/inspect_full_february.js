const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = path.join(__dirname, '..', 'Financeiro 26.xlsx');
if (!fs.existsSync(filePath)) {
  console.log("File not found");
  process.exit(0);
}
const workbook = XLSX.read(fs.readFileSync(filePath), { type: 'buffer' });
const sheet = workbook.Sheets['Fevereiro'];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

console.log("=== February Sheet Rows 1 to 50 ===");
rows.forEach((row, idx) => {
  if (idx < 50) {
    console.log(`Row ${idx + 1}: ${row.map((cell, colIdx) => `Col ${colIdx}: ${cell}`).join(' | ')}`);
  }
});
