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

  let lineCount = 0;
  for await (const line of rl) {
    lineCount++;
    const lower = line.toLowerCase();
    if (lower.includes('guilherme') || lower.includes('pilates')) {
      console.log(`=== Match on line ${lineCount} ===`);
      // Find where "Guilherme" or "Pilates" is and print 300 characters before and after
      const indices = [];
      let idx = lower.indexOf('guilherme');
      while (idx !== -1) {
        indices.push(idx);
        idx = lower.indexOf('guilherme', idx + 1);
      }
      idx = lower.indexOf('pilates');
      while (idx !== -1) {
        indices.push(idx);
        idx = lower.indexOf('pilates', idx + 1);
      }
      
      for (const pos of indices) {
        const start = Math.max(0, pos - 100);
        const end = Math.min(line.length, pos + 300);
        console.log(`[pos ${pos}]: ...${line.substring(start, end).replace(/\n/g, ' ')}...`);
      }
    }
  }
}

main();
