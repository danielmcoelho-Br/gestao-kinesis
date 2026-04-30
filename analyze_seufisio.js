const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(process.cwd(), 'Atendimentos março 26.xls');
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, { range: 1 });
console.log("Colunas encontradas:", Object.keys(data[0]));
console.log("Exemplo de linha:", data[0]);
