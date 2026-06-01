const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', '(gestao)', 'financeiro', 'page_content.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const queries = ['handleSaveExtraField', 'api/financeiro', 'PRO_EARNING', 'fetch'];
lines.forEach((line, index) => {
  queries.forEach(query => {
    if (line.includes(query)) {
      console.log(`${query} at line ${index + 1}: ${line.trim()}`);
    }
  });
});
