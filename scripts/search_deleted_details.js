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

  console.log("=== SEARCHING TRANSACTIONS IN LOGS ===");
  for await (const line of rl) {
    // If the line contains "Guilherme" or "Pilates"
    if (line.toLowerCase().includes('guilherme') || line.toLowerCase().includes('pilates')) {
      // Find objects or arrays in JSON
      try {
        const obj = JSON.parse(line);
        // Let's inspect the content or tool_calls
        const contentStr = typeof obj.content === 'string' ? obj.content : '';
        const toolCallsStr = obj.tool_calls ? JSON.stringify(obj.tool_calls) : '';
        
        // Search inside content or toolCalls
        const fullText = (contentStr + ' ' + toolCallsStr).toLowerCase();
        
        // Let's find any JSON transaction-like patterns
        // We look for objects containing 'amount' and ('guilherme' or 'pilates' or 'bonagamba')
        const regex = /\{[^{}]*"amount"[^{}]*\}/gi;
        let match;
        while ((match = regex.exec(fullText)) !== null) {
          const matchedJson = match[0];
          if (matchedJson.includes('guilherme') || matchedJson.includes('pilates') || matchedJson.includes('bonagamba') || matchedJson.includes('fev')) {
            console.log(`Step ${obj.step_index}:`, matchedJson);
          }
        }
      } catch (e) {
        // console.error(e);
      }
    }
  }
}

main();
