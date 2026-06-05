const fs = require('fs');

function parseInter(csvText) {
  try {
    const lines = csvText.split('\n');
    let startIdx = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Data Lançamento;Histórico;Descrição;Valor;Saldo')) {
        startIdx = i + 1;
        break;
      }
    }

    console.log("Start idx:", startIdx);
    if (startIdx === 0) {
      console.log("Cabeçalho não encontrado!");
      return [];
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

        let amountNum = parseFloat(valorStr.replace(/\./g, '').replace(',', '.'));
        const isNegative = amountNum < 0;
        amountNum = Math.abs(amountNum);
        const type = isNegative ? 'EXPENSE' : 'INCOME';
        
        let finalDesc = `${historico} - ${descricao}`;
        if (!descricao) {
           finalDesc = historico;
        }

        transactions.push({
          date: dateStr,
          description: finalDesc,
          amount: amountNum,
          type: type
        });
      }
    }
    return transactions;
  } catch(e) {
    console.error(e);
    return [];
  }
}

const text = fs.readFileSync('Extrato Inter ABRIL 26.csv', 'utf8');
const txs = parseInter(text);
console.log(txs);
