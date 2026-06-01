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

  console.log("=== SEARCHING FOR VALUES 11107.08 AND 836 ===");
  let count = 0;
  for await (const line of rl) {
    count++;
    if (line.includes('11107') || line.includes('836')) {
      console.log(`\n--- Match on line ${count} ---`);
      console.log(line.substring(0, 2000));
    }
  }
}

main();
