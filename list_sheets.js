const XLSX = require("xlsx");
const path = require("path");

const filePath = path.join(__dirname, "Financeiro 26.xlsx");
const workbook = XLSX.readFile(filePath);
console.log("Sheets list:", workbook.SheetNames);
workbook.SheetNames.forEach(name => {
  const ws = workbook.Sheets[name];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  console.log(`Sheet "${name}" has ${rows.length} rows.`);
});
