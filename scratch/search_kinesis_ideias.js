const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'ideias_kinesis.md');
if (!fs.existsSync(filePath)) {
  console.log("File not found");
  process.exit(0);
}
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const queries = ['Cris', 'repartição', 'ganho', 'profissional', 'pilates', 'acerto', 'sócio'];
lines.forEach((line, index) => {
  queries.forEach(query => {
    if (line.toLowerCase().includes(query.toLowerCase())) {
      console.log(`${query} at line ${index + 1}: ${line.trim()}`);
    }
  });
});
