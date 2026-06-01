const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'Financeiro 26.xlsx');
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets['Padrão'];

const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
console.log("=== PADRÃO TEMPLATE ROWS ===");
data.forEach((row, idx) => {
  // Print every row with its index and non-empty cells
  const cells = row.map((c, i) => `${i}:${JSON.stringify(c)}`).filter((c, i) => row[i] !== '');
  console.log(`Row ${idx}:`, cells.join(' | '));
});
