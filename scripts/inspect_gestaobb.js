const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'Gestão Conta BB.xlsx');
const workbook = XLSX.readFile(filePath);
console.log(`All Sheets in Gestão Conta BB.xlsx:`, workbook.SheetNames);

// Inspect the first few sheets (which are usually the most recent months)
const sheetsToInspect = workbook.SheetNames.slice(0, 5);
sheetsToInspect.forEach(sheetName => {
    console.log(`\n--- SHEET: ${sheetName} ---`);
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }).slice(0, 15);
    data.forEach((row, idx) => {
        const cleanRow = row.map(cell => String(cell).trim());
        console.log(`[Row ${idx + 1}]:`, JSON.stringify(cleanRow));
    });
});
