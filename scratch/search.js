const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', '(gestao)', 'financeiro', 'page_content.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const query = 'ganho';
lines.forEach((line, index) => {
  if (line.toLowerCase().includes(query)) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
