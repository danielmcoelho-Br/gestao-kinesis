const fs = require('fs');
const readline = require('readline');

async function main() {
  const logFile = 'C:\\Users\\daniel\\.gemini\\antigravity\\brain\\91151181-8cb2-4fb1-beb6-54b0a67dd600\\.system_generated\\logs\\transcript.jsonl';
  if (!fs.existsSync(logFile)) {
    console.error("Log file not found!");
    return;
  }
  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  console.log("=== SEARCHING DELETED TRANSACTIONS ===");
  for await (const line of rl) {
    if (line.includes('/api/financeiro/delete') || line.includes('delete') || line.includes('Guilherme') || line.includes('Pilates') || line.includes('Guilherme') || line.includes('FEV')) {
      // Try to see if it contains transaction details
      if (line.includes('amount') && (line.includes('Guilherme') || line.includes('Pilates') || line.includes('FEV') || line.includes('Fev'))) {
        console.log("FOUND LINE:", line.substring(0, 1000));
      }
    }
  }
}

main();
