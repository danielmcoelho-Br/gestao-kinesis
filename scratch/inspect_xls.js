const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join('C:', 'Users', 'daniel', '.gemini', 'antigravity', 'scratch', 'gestao-kinesis', 'uploads', '1777476022576-Atendimentos março 26.xls');
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);
console.log(JSON.stringify(data[0], null, 2));
