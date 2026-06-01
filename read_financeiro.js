const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

async function main() {
  try {
    const filePath = path.join(__dirname, "Financeiro 26.xlsx");
    const workbook = XLSX.readFile(filePath);
    console.log("Sheets:", workbook.SheetNames);
    
    for (const name of workbook.SheetNames) {
      console.log("\n==================================");
      console.log("Sheet:", name);
      const ws = workbook.Sheets[name];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      console.log("Total rows:", rows.length);
      // Let's print the first 45 rows to understand the structure
      rows.slice(0, 45).forEach((row, i) => {
        // filter empty cells at the end
        const cleanRow = row.map(c => c === undefined ? "" : c);
        if (cleanRow.some(c => c !== "")) {
          console.log(`Row ${i}:`, cleanRow);
        }
      });
    }
  } catch (err) {
    console.error("Error reading Financeiro 26:", err);
  }
}

main();
