const XLSX = require("xlsx");
const path = require("path");

try {
  const filePath = path.join(__dirname, "Financeiro 26.xlsx");
  const workbook = XLSX.readFile(filePath);
  ['Janeiro', 'Fevereiro', 'Março'].forEach(name => {
    console.log(`\n=== Cells for ${name} ===`);
    const ws = workbook.Sheets[name];
    ['B23', 'C23', 'N32', 'N25', 'B24', 'C24', 'N34', 'B25', 'C25', 'N33', 'B13', 'V2', 'V3', 'V4', 'V5', 'V6', 'V19', 'V20'].forEach(ref => {
      const cell = ws[ref];
      if (cell) {
        console.log(`${ref} = ${cell.v} ${cell.f ? '(f: ' + cell.f + ')' : ''}`);
      } else {
        console.log(`${ref} = empty`);
      }
    });
  });
} catch (err) {
  console.error(err);
}
