const fs = require('fs');

function parseInter(csvText) {
  try {
    const lines = csvText.split('\n');
    let startIdx = 0;
    
    // Encontrar o cabeçalho
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Data Lançamento;Histórico;Descrição;Valor;Saldo')) {
        startIdx = i + 1;
        break;
      }
    }

    const transactions = [];
    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const cols = line.split(';');
      if (cols.length >= 4) {
        const dateStr = cols[0].trim();
        const historico = cols[1].trim();
        const descricao = cols[2].trim();
        const valorStr = cols[3].trim();
        
        if (!dateStr || !valorStr) continue;

        let cleanedValor = valorStr.replace(/\./g, '').replace(',', '.');
        let amount = parseFloat(cleanedValor);
        if (isNaN(amount)) continue;

        const dateParts = dateStr.split('/');
        if (dateParts.length === 3) {
          const transDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T12:00:00`);
          const fullDesc = historico ? `${historico} - ${descricao}` : descricao;
          
          transactions.push({
            date: transDate,
            description: fullDesc,
            amount: Math.abs(amount),
            type: amount < 0 ? "EXPENSE" : "INCOME"
          });
        }
      }
    }
    return transactions;
  } catch (error) {
    console.error("Erro no parseInter:", error);
    return [];
  }
}

const buffer = fs.readFileSync('Extrato Inter ABRIL 26.csv');
let text = "";
try {
  text = new TextDecoder("utf-8").decode(buffer);
} catch {
  text = new TextDecoder("iso-8859-1").decode(buffer);
}

const txs = parseInter(text);
console.log(`Parsed ${txs.length} transactions`);
