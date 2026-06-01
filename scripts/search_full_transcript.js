const fs = require('fs');
const readline = require('readline');

async function main() {
  const logFile = 'C:\\Users\\daniel\\.gemini\\]antigravity\\brain\\91151181-8cb2-4fb1-beb6-54b0a67dd600\\.system_generated\\logs\\transcript.jsonl'.replace(']', '');
  if (!fs.existsSync(logFile)) {
    console.error("Log file not found!");
    return;
  }
  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    // If it contains "Guilherme" (case insensitive) or "Pilates" (case insensitive) and "delete"
    if (line.toLowerCase().includes('guilherme') || line.toLowerCase().includes('pilates')) {
      if (line.toLowerCase().includes('delete') || line.toLowerCase().includes('exclui') || line.toLowerCase().includes('remover') || line.toLowerCase().includes('manual') || line.toLowerCase().includes('update')) {
        console.log(`--- MATCHING LINE (step_index: ${JSON.parse(line).step_index}) ---`);
        console.log(line);
      }
    }
  }
}

main();
