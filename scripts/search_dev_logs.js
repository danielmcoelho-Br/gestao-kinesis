const fs = require('fs');
const readline = require('readline');
const glob = require('glob'); // wait, let's just use native fs since we don't know if glob is installed.

async function main() {
  const logFile = 'C:\\Users\\daniel\\.gemini\\antigravity\\brain\\91151181-8cb2-4fb1-beb6-54b0a67dd600\\.system_generated\\tasks\\task-1196.log';
  if (!fs.existsSync(logFile)) {
    console.log("Log file not found!");
    return;
  }
  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.includes('delete') || line.includes('Guilherme') || line.includes('Pilates')) {
      console.log(line);
    }
  }
}

main();
