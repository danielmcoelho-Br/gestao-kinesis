const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'Financeiro 26.xlsx');
const workbook = XLSX.readFile(filePath);
console.log(`Sheet Names in Financeiro 26.xlsx:`, workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
    console.log(`\n--- SHEET: ${sheetName} ---`);
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }).slice(0, 20);
    data.forEach((row, idx) => {
        const cleanRow = row.map(cell => String(cell).trim());
        console.log(`[Row ${idx + 1}]:`, JSON.stringify(cleanRow));
    });
});
