const fs = require('fs');
const readline = require('readline');

async function main() {
  const fileStream = fs.createReadStream('C:\\Users\\daniel\\.gemini\\antigravity\\brain\\91151181-8cb2-4fb1-beb6-54b0a67dd600\\.system_generated\\logs\\transcript.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.includes('/api/financeiro/delete')) {
      try {
        const obj = JSON.parse(line);
        console.log("STEP:", obj.step_index, "TYPE:", obj.type, "STATUS:", obj.status);
        console.log("CONTENT:", obj.content);
        if (obj.tool_calls) {
          console.log("TOOL_CALLS:", JSON.stringify(obj.tool_calls));
        }
      } catch (e) {
        console.log("RAW MATCH:", line);
      }
    }
  }
}

main();
