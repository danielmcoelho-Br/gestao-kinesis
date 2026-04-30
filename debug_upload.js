const fs = require('fs');
const pdf = require('pdf-parse');

const statusList = [
  "Finalizado",
  "Não Compareceu",
  "Ausência Justificada",
  "Ausência do Profissional",
  "Ausência Nula"
];

function parseSeufisio(text, knownProfessionals) {
  const lines = text.split('\n');
  const atendimentos = [];
  const profNames = knownProfessionals.map(p => p.name);
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;
    const dateRegex = /(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2})/;
    const dateMatch = line.match(dateRegex);
    if (dateMatch) {
      const dateStr = dateMatch[1];
      const parts = line.split(dateStr);
      const beforeDate = parts[0];
      const afterDate = parts.slice(1).join(dateStr);
      let professional = "Desconhecido";
      let cliente = beforeDate;
      for (const profName of profNames) {
        if (beforeDate.includes(profName)) {
          professional = profName;
          cliente = beforeDate.replace(profName, "");
          break;
        }
      }
      let status = "Desconhecido";
      let type = afterDate;
      let valor = 0;
      for (const s of statusList) {
        if (afterDate.includes(s)) {
          status = s;
          const afterStatusParts = afterDate.split(s);
          type = afterStatusParts[0];
          const rest = afterStatusParts.slice(1).join(s);
          const valMatch = rest.match(/(\d+,\d{2})/);
          if (valMatch) valor = parseFloat(valMatch[1].replace(',', '.'));
          break;
        }
      }
      atendimentos.push({ cliente: cliente.trim(), professional, data: dateStr, tipo: type.trim(), status, valor });
    }
  }
  return atendimentos;
}

const dataBuffer = fs.readFileSync('atendimentos março 26.pdf');

pdf(dataBuffer).then(function(data) {
    const text = data.text;
    console.log("PDF TEXT SNIPPET:", text.substring(0, 2000));
    
    // Simular profissionais conhecidos
    const knownProfs = [
        { name: "Daniel" }, // Exemplo
        { name: "Kinesis" }
    ];
    
    const results = parseSeufisio(text, []); // Testar com lista vazia primeiro para ver o que ele pega
    console.log("RESULTS COUNT:", results.length);
    if (results.length > 0) {
        console.log("FIRST RESULT:", results[0]);
    }
});
