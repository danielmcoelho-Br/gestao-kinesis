const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

function cleanRow(row) {
  return row.map(c => c === undefined || c === null ? "" : String(c).trim());
}

async function main() {
  try {
    const filePath = path.join(__dirname, "Financeiro 26.xlsx");
    const workbook = XLSX.readFile(filePath);
    let outputText = "";
    
    workbook.SheetNames.forEach(name => {
      outputText += `\n==================================\n`;
      outputText += `SHEET: ${name}\n`;
      outputText += `==================================\n`;
      const ws = workbook.Sheets[name];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      rows.forEach((row, i) => {
        const cleaned = cleanRow(row);
        if (cleaned.some(c => c !== "")) {
          outputText += `Row ${i}: ${JSON.stringify(cleaned)}\n`;
        }
      });
    });
    
    fs.writeFileSync(path.join(__dirname, "../sheets_details.txt"), outputText);
    console.log("All sheets written to sheets_details.txt successfully!");
  } catch (err) {
    console.error("Error reading sheets:", err);
  }
}

main();
