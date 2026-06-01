const fs = require('fs');
const readline = require('readline');

async function main() {
  const fileStream = fs.createReadStream('C:\\Users\\daniel\\.gemini\\antigravity\\brain\\91151181-8cb2-4fb1-beb6-54b0a67dd600\\.system_generated\\logs\\transcript.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.includes('/api/financeiro/delete') || line.includes('deleteTransaction')) {
      // Parse JSON line if possible
      try {
        const obj = JSON.parse(line);
        console.log("STEP:", obj.step_index);
        console.log(JSON.stringify(obj, null, 2));
      } catch (e) {
        console.log("NON-JSON MATCH:", line);
      }
    }
  }
}

main();
