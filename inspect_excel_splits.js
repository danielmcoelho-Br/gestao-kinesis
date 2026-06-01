const XLSX = require("xlsx");
const path = require("path");

function inspectSheet(ws, name) {
  console.log(`\n==================================`);
  console.log(`SHEET: ${name}`);
  console.log(`==================================`);
  const cols = ['M', 'N', 'Q', 'R', 'U', 'V'];
  for (let r = 1; r <= 38; r++) {
    let rowStr = `Row ${r}: `;
    let hasData = false;
    cols.forEach(col => {
      const cellRef = `${col}${r}`;
      const cell = ws[cellRef];
      if (cell) {
        rowStr += `${col}=${cell.v}${cell.f ? ' (f: ' + cell.f + ')' : ''} | `;
        hasData = true;
      }
    });
    if (hasData) {
      console.log(rowStr);
    }
  }
}

try {
  const filePath = path.join(__dirname, "Financeiro 26.xlsx");
  const workbook = XLSX.readFile(filePath);
  ['Janeiro', 'Fevereiro', 'Março'].forEach(name => {
    inspectSheet(workbook.Sheets[name], name);
  });
} catch (err) {
  console.error("Error:", err);
}
