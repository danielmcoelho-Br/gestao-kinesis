const fs = require('fs');

const path = 'C:\\Users\\daniel\\.gemini\\antigravity\\scratch\\kinesis-app\\ideias_kinesis.md';
if (!fs.existsSync(path)) {
  console.log("File ideas not found.");
  process.exit(1);
}

const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');
console.log(`Searching ideas document. Total lines: ${lines.length}`);

let count = 0;
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('seufisio')) {
    console.log(`[Line ${idx + 1}] ${line.trim()}`);
    count++;
  }
});
console.log(`Found ${count} lines mentioning seufisio.`);
