const fs = require('fs');
const readline = require('readline');

async function main() {
  const fileStream = fs.createReadStream('C:\\Users\\daniel\\.gemini\\antigravity\\brain\\91151181-8cb2-4fb1-beb6-54b0a67dd600\\.system_generated\\logs\\transcript.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.includes('12/03/2026') && line.includes('GUILHERME')) {
      console.log(line.substring(line.indexOf('12/03/2026') - 50, line.indexOf('12/03/2026') + 200));
    }
  }
}

main();
