const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'Financeiro 26.xlsx');
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets['Padrão'];

const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
console.log("Row 22 detail:", data[22]);
console.log("Row 23 detail:", data[23]);
console.log("Row 24 detail:", data[24]);
