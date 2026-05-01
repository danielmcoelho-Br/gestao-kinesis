import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "node:fs/promises";
import path from "node:path";

const pdfParse = require("pdf-parse");
const XLSX = require("xlsx");

const statusList = [
  "Finalizado",
  "Não Compareceu",
  "Ausência Justificada",
  "Ausência do Profissional",
  "Ausência Nula"
];

export async function POST(request: Request) {
  const pdfParseModule = require("pdf-parse");
  const pdfParse = pdfParseModule.default || pdfParseModule;
  
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;
    const monthRaw = data.get("month");
    const yearRaw = data.get("year");
    const month = monthRaw !== null ? parseInt(monthRaw as string) : new Date().getMonth();
    const year = yearRaw !== null ? parseInt(yearRaw as string) : new Date().getFullYear();

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Salvar o arquivo no disco
    const uploadDir = path.join(process.cwd(), "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);

    // Extrair dados (PDF ou Excel)
    let text = "";
    let excelData: any[] = [];
    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".csv");

    if (isExcel) {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const firstSheet = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheet];
      
      // Tentar encontrar a linha do cabeçalho procurando por "Cliente" ou "Paciente"
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const headerRowIndex = rows.findIndex(row => 
        row.some(cell => typeof cell === "string" && (cell.includes("Cliente") || cell.includes("Paciente") || cell.includes("Matrícula")))
      );

      // Se encontrou, lê a partir dali. Se não, tenta o padrão.
      excelData = XLSX.utils.sheet_to_json(sheet, { range: headerRowIndex !== -1 ? headerRowIndex : 0 });
      text = JSON.stringify(excelData, null, 2); // Para o rawView
    } else {
      let pdfData;
      try {
        pdfData = await pdfParse(buffer);
        text = pdfData.text;
      } catch (pdfError: any) {
        console.error("Erro no pdf-parse:", pdfError);
        return NextResponse.json({ error: "Erro ao ler o PDF: " + pdfError.message }, { status: 500 });
      }
    }
    
    const fileTypeSent = data.get("type") as string;

    // Processamento por tipo
    if (fileTypeSent === "SEUFISIO" || text.includes("Atendimentos gerais")) {
      const professionals = await prisma.professional.findMany({
        include: { serviceRules: true }
      });
      
      let results: any[] = [];
      if (isExcel) {
        results = excelData.map(row => {
          // Normalizar chaves para ignorar espaços e acentos se necessário
          const findKey = (keys: string[]) => {
            const keysLower = keys.map(k => k.toLowerCase().trim());
            const found = Object.keys(row).find(k => keysLower.includes(k.toLowerCase().trim()));
            return found ? row[found] : "";
          };

          const rawDate = findKey(["Data/Hora", "Data", "Data Atendimento"]);
          const professional = findKey(["Profissional", "Nome Profissional", "Fisioterapeuta"]);
          const cliente = findKey(["Cliente", "Paciente", "Nome Cliente"]);
          const tipo = findKey(["Tipo Atendimento", "Serviço", "Procedimento", "Tipo"]);
          const status = findKey(["Status", "Situação"]);
          const valor = findKey(["Valor", "Preço", "Valor Total"]);

          // Se faltar dados básicos, ignorar linha ou marcar como inválida
          if (!rawDate || !professional) return null;

          return {
            cliente,
            professional,
            data: rawDate,
            tipo,
            status: status || "Finalizado",
            valor: typeof valor === "number" ? valor : parseFloat(String(valor || "0").replace(',', '.'))
          };
        }).filter(Boolean);
      } else {
        results = parseSeufisio(text, professionals);
      }

      if (results.length === 0) {
        return NextResponse.json({ error: "Nenhum dado válido encontrado. Verifique se as colunas (Data, Profissional, Cliente) estão presentes no arquivo." }, { status: 400 });
      }
      
      let importedCount = 0;
      const stats = {
        total: results.length,
        finalizado: 0,
        falta: 0,
        ausenciaProfissional: 0,
        ausenciaJustificada: 0
      };

      for (const item of results) {
        const prof = professionals.find(p => item.professional.includes(p.name) || p.name.includes(item.professional));
        if (prof) {
          const specificRule = prof.serviceRules.find(r => item.tipo.includes(r.serviceCode));
          const percentage = specificRule ? specificRule.percentage : prof.defaultPercentage;

          let sessionDate: Date;
          if (item.data instanceof Date) {
            sessionDate = item.data;
          } else {
            // Tentar converter string (DD/MM/YYYY HH:mm ou YYYY-MM-DD)
            const dateStr = String(item.data);
            if (dateStr.includes('/')) {
              const parts = dateStr.split(' ');
              const dateParts = parts[0].split('/');
              const timePart = parts[1] || '12:00';
              sessionDate = new Date(`${dateParts.reverse().join('-')}T${timePart}`);
            } else {
              sessionDate = new Date(dateStr);
            }
          }

          if (isNaN(sessionDate.getTime())) {
            console.warn("Data inválida para a linha:", item);
            continue;
          }

          await prisma.session.create({
            data: {
              professionalId: prof.id,
              patientName: item.cliente,
              date: sessionDate,
              status: item.status,
              serviceType: item.tipo,
              value: item.valor,
              clinicPercentage: percentage
            }
          });

          if (item.status === 'Finalizado') stats.finalizado++;
          else if (item.status === 'Não Compareceu') stats.falta++;
          else if (item.status === 'Ausência Justificada') stats.ausenciaJustificada++;
          else if (item.status === 'Ausência do Profissional') stats.ausenciaProfissional++;

          importedCount++;
        }
      }

      await prisma.importLog.create({
        data: {
          fileName: file.name,
          fileType: "SEUFISIO",
          month,
          year,
          totalRecords: importedCount,
          summary: JSON.stringify(stats),
          rawText: text,
          filePath: fileName // Guardamos apenas o nome para facilitar o acesso via API
        }
      });

      return NextResponse.json({ success: true, importedCount, message: `${importedCount} atendimentos importados!` });
    } 
    else if (fileTypeSent === "BANCO_BB" || text.includes("Extrato de Conta Corrente")) {
      let transactions: any[] = [];
      if (isExcel) {
        transactions = excelData.map(row => ({
          date: row["Data"] || row["Data Movimento"] || "",
          description: row["Histórico"] || row["Descrição"] || "",
          amount: typeof row["Valor"] === "number" ? Math.abs(row["Valor"]) : parseFloat(String(row["Valor"] || "0").replace(/\./g, '').replace(',', '.')),
          type: (typeof row["Valor"] === "number" ? row["Valor"] > 0 : String(row["Valor"]).includes('+')) ? 'INCOME' : 'EXPENSE'
        }));
      } else {
        transactions = parseBB(text);
      }
      let importedCount = 0;
      
      for (const t of transactions) {
        await prisma.transaction.create({
          data: {
            date: new Date(t.date.split('/').reverse().join('-') + 'T12:00:00'),
            description: t.description,
            amount: t.amount,
            type: t.type,
            category: t.type === 'INCOME' ? 'Recebimento' : 'Despesa',
            bank: 'Banco do Brasil'
          }
        });
        importedCount++;
      }

      await prisma.importLog.create({
        data: {
          fileName: file.name,
          fileType: "BANCO_BB",
          month,
          year,
          totalRecords: importedCount,
          summary: JSON.stringify({ total: importedCount }),
          rawText: text,
          filePath: fileName
        }
      });

      return NextResponse.json({ success: true, importedCount, message: `${importedCount} transações bancárias importadas!` });
    }
    else if (fileTypeSent === "BANCO_INTER") {
      // Placeholder para Banco Inter
      await prisma.importLog.create({
        data: {
          fileName: file.name,
          fileType: "BANCO_INTER",
          month,
          year,
          totalRecords: 0,
          summary: JSON.stringify({ message: "Arquivo recebido. Processamento automático em breve." }),
          rawText: text,
          filePath: fileName
        }
      });
      return NextResponse.json({ success: true, message: "Extrato Banco Inter recebido!" });
    }
    else if (fileTypeSent === "PERFIL_PACIENTE") {
      let importedCount = 0;
      if (isExcel) {
        for (const row of excelData) {
          const findKey = (keys: string[]) => {
            const keysLower = keys.map(k => k.toLowerCase().trim());
            const found = Object.keys(row).find(k => keysLower.includes(k.toLowerCase().trim()));
            return found ? row[found] : "";
          };

          const name = findKey(["Cliente", "Paciente", "Nome Cliente", "Nome"]);
          if (!name) continue;

          await prisma.patient.create({
            data: {
              registration: String(findKey(["Matrícula", "ID", "Código"]) || ""),
              name: String(name),
              gender: String(findKey(["Gênero", "Sexo"]) || ""),
              age: parseInt(String(findKey(["Idade"]) || "0")),
              phone: String(findKey(["Telefone", "Celular"]) || ""),
              profession: String(findKey(["Profissão", "Cargo"]) || ""),
              origin: String(findKey(["Origem / procedência", "Origem", "Indicação"]) || "")
            }
          });
          importedCount++;
        }
      }

      await prisma.importLog.create({
        data: {
          fileName: file.name,
          fileType: "PERFIL_PACIENTE",
          month,
          year,
          totalRecords: importedCount,
          summary: JSON.stringify({ total: importedCount }),
          rawText: text,
          filePath: fileName
        }
      });
      return NextResponse.json({ success: true, importedCount, message: `${importedCount} perfis de pacientes importados!` });
    }

    return NextResponse.json({ error: "Tipo de arquivo não suportado ou conteúdo não reconhecido." }, { status: 400 });

    return NextResponse.json({ error: "Formato de arquivo não reconhecido." }, { status: 400 });

  } catch (error: any) {
    console.error("Erro ao processar PDF:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ... Funções de parsing (parseSeufisio e parseBB)
function parseSeufisio(text: string, knownProfessionals: any[]) {
  const lines = text.split('\n');
  const atendimentos: any[] = [];
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
        if (beforeDate.endsWith(profName)) {
          professional = profName;
          cliente = beforeDate.substring(0, beforeDate.length - profName.length);
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

function parseBB(text: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const transactions: any[] = [];
  let currentDate = null;
  let currentDesc: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const dateMatch = line.match(/^(\d{2}\/\d{2}\/\d{4})$/);
    if (dateMatch) {
      currentDate = dateMatch[1];
      currentDesc = [];
      continue;
    }
    const valMatch = line.match(/([\d\.,]+)\s+\(([\+-])\)/);
    if (valMatch && currentDate && currentDate !== "00/00/0000") {
      const amount = parseFloat(valMatch[1].replace(/\./g, '').replace(',', '.'));
      const type = valMatch[2] === '+' ? 'INCOME' : 'EXPENSE';
      let description = currentDesc.join(' ');
      if (!description.includes("Saldo")) {
        transactions.push({ date: currentDate, description: description || "Transação sem descrição", amount, type });
      }
      currentDesc = [];
    } else {
      if (!/^\d+$/.test(line) && line !== "Lançamentos" && !line.includes("Extrato")) {
        currentDesc.push(line);
      }
    }
  }
  return transactions;
}
