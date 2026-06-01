const XLSX = require("xlsx");
const path = require("path");

async function main() {
  try {
    const filePath = path.join(__dirname, "Financeiro 26.xlsx");
    const workbook = XLSX.readFile(filePath);
    
    ['Janeiro', 'Fevereiro', 'Março'].forEach(name => {
      console.log(`\n==================================`);
      console.log(`SHEET FORMULAS: ${name}`);
      console.log(`==================================`);
      const ws = workbook.Sheets[name];
      
      // Let's print cells in rows 18 to 35 for columns A to N
      const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V'];
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
    });
  } catch (err) {
    console.error("Error reading formulas:", err);
  }
}

main();
