const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = path.join(__dirname, '..', 'Financeiro 26.xlsx');
if (!fs.existsSync(filePath)) {
  console.log("File not found");
  process.exit(0);
}
const workbook = XLSX.read(fs.readFileSync(filePath), { type: 'buffer' });

workbook.SheetNames.forEach(sheetName => {
  if (sheetName === 'Padrão') return;
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  console.log(`\n=== Sheet: ${sheetName} ===`);
  rows.forEach((row, idx) => {
    for (let c = 0; c < row.length; c++) {
      const val = String(row[c]).trim();
      if (['Julia', 'Gambá', 'Newton', 'Cris', 'João'].includes(val)) {
        if (row[c+1] !== '') {
          console.log(`Line ${idx + 1}: ${val} = ${row[c+1]}`);
        }
      }
    }
  });
});
