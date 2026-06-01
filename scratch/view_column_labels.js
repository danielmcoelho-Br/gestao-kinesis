const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = path.join(__dirname, '..', 'Financeiro 26.xlsx');
if (!fs.existsSync(filePath)) {
  console.log("File not found");
  process.exit(0);
}
const workbook = XLSX.read(fs.readFileSync(filePath), { type: 'buffer' });
const sheet = workbook.Sheets['Março'];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

console.log("=== Column M (12) and N (13) ===");
rows.forEach((row, idx) => {
  const colM = row[12];
  const colN = row[13];
  if (colM || colN) {
    console.log(`Row ${idx + 1}: ${colM || 'EMPTY'} = ${colN || 'EMPTY'}`);
  }
});
