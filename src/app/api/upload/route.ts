import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

// Polyfill essential missing globals for headless pdf parsing libraries in Next.js environment
if (typeof (global as any).DOMMatrix === "undefined") (global as any).DOMMatrix = class DOMMatrix {};
if (typeof (global as any).Path2D === "undefined") (global as any).Path2D = class Path2D {};
if (typeof (global as any).ImageData === "undefined") (global as any).ImageData = class ImageData {};

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
    const autoSegmentRaw = data.get("autoSegment");
    const isAutoSegment = autoSegmentRaw === "true" || year <= 2024;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    const safeFileName = path.basename(file.name);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Salvar o arquivo no disco
    const uploadDir = path.join(os.tmpdir(), "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    const fileName = `${Date.now()}-${safeFileName}`;
    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);

    // Extrair dados (PDF ou Excel)
    let text = "";
    let excelData: any[] = [];
    const isExcel = safeFileName.endsWith(".xlsx") || safeFileName.endsWith(".xls") || safeFileName.endsWith(".csv");

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

      // Pre-parse dates for all items
      const parsedItems: any[] = [];
      for (const item of results) {
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
        parsedItems.push({ ...item, sessionDate });
      }

      if (isAutoSegment) {
        const groups: { [key: string]: { month: number; year: number; items: any[] } } = {};
        for (const item of parsedItems) {
          const m = item.sessionDate.getMonth();
          const y = item.sessionDate.getFullYear();
          const key = `${y}-${m}`;
          if (!groups[key]) {
            groups[key] = { month: m, year: y, items: [] };
          }
          groups[key].items.push(item);
        }

        let totalImported = 0;
        const processedMonths: string[] = [];
        const monthNames = [
          "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
          "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        ];

        const sortedKeys = Object.keys(groups).sort((a, b) => {
          const [yA, mA] = a.split('-').map(Number);
          const [yB, mB] = b.split('-').map(Number);
          return yA !== yB ? yA - yB : mA - mB;
        });

        for (const key of sortedKeys) {
          const { month: m, year: y, items: groupItems } = groups[key];
          const startOfMonth = new Date(y, m, 1);
          const endOfMonth = new Date(y, m + 1, 0, 23, 59, 59);

          await prisma.session.deleteMany({
            where: {
              date: { gte: startOfMonth, lte: endOfMonth }
            }
          });

          await prisma.importLog.deleteMany({
            where: {
              fileType: "SEUFISIO",
              month: m,
              year: y
            }
          });

          let groupImportedCount = 0;
          const groupStats = {
            total: groupItems.length,
            finalizado: 0,
            falta: 0,
            ausenciaProfissional: 0,
            ausenciaJustificada: 0
          };

          const sessionsToCreate: any[] = [];
          for (const item of groupItems) {
            const prof = professionals.find(p => item.professional.includes(p.name) || p.name.includes(item.professional));
            if (prof) {
              const specificRule = prof.serviceRules.find(r => item.tipo.includes(r.serviceCode));
              const percentage = specificRule ? specificRule.percentage : prof.defaultPercentage;

              sessionsToCreate.push({
                professionalId: prof.id,
                patientName: item.cliente,
                date: item.sessionDate,
                status: item.status,
                serviceType: item.tipo,
                value: item.valor,
                clinicPercentage: percentage
              });

              if (item.status === 'Finalizado') groupStats.finalizado++;
              else if (item.status === 'Não Compareceu') groupStats.falta++;
              else if (item.status === 'Ausência Justificada') groupStats.ausenciaJustificada++;
              else if (item.status === 'Ausência do Profissional') groupStats.ausenciaProfissional++;

              groupImportedCount++;
            }
          }

          if (sessionsToCreate.length > 0) {
            await prisma.session.createMany({
              data: sessionsToCreate
            });
          }

          await prisma.importLog.create({
            data: {
              fileName: safeFileName,
              fileType: "SEUFISIO",
              month: m,
              year: y,
              totalRecords: groupImportedCount,
              summary: JSON.stringify(groupStats),
              rawText: text,
              filePath: fileName
            }
          });

          totalImported += groupImportedCount;
          processedMonths.push(`${monthNames[m]}/${y}`);
        }

        return NextResponse.json({ 
          success: true, 
          importedCount: totalImported, 
          message: `${totalImported} atendimentos importados e distribuídos nos meses: ${processedMonths.join(', ')}!` 
        });
      } else {
        let importedCount = 0;
        const stats = {
          total: parsedItems.length,
          finalizado: 0,
          falta: 0,
          ausenciaProfissional: 0,
          ausenciaJustificada: 0
        };

        const sessionsToCreate: any[] = [];
        for (const item of parsedItems) {
          const prof = professionals.find(p => item.professional.includes(p.name) || p.name.includes(item.professional));
          if (prof) {
            const specificRule = prof.serviceRules.find(r => item.tipo.includes(r.serviceCode));
            const percentage = specificRule ? specificRule.percentage : prof.defaultPercentage;

            sessionsToCreate.push({
              professionalId: prof.id,
              patientName: item.cliente,
              date: item.sessionDate,
              status: item.status,
              serviceType: item.tipo,
              value: item.valor,
              clinicPercentage: percentage
            });

            if (item.status === 'Finalizado') stats.finalizado++;
            else if (item.status === 'Não Compareceu') stats.falta++;
            else if (item.status === 'Ausência Justificada') stats.ausenciaJustificada++;
            else if (item.status === 'Ausência do Profissional') stats.ausenciaProfissional++;

            importedCount++;
          }
        }

        if (sessionsToCreate.length > 0) {
          await prisma.session.createMany({
            data: sessionsToCreate
          });
        }

        await prisma.importLog.create({
          data: {
            fileName: safeFileName,
            fileType: "SEUFISIO",
            month,
            year,
            totalRecords: importedCount,
            summary: JSON.stringify(stats),
            rawText: text,
            filePath: fileName
          }
        });

        return NextResponse.json({ success: true, importedCount, message: `${importedCount} atendimentos importados!` });
      }
    } 
    else if (fileTypeSent === "BANCO_BB" || text.includes("Extrato de Conta Corrente")) {
      let transactions: any[] = [];
      if (isExcel) {
        transactions = excelData.map(row => {
          const dateVal = row["Data"] || row["Data Movimento"] || row["Data de Lançamento"] || row["Data Lançamento"] || "";
          
          let description = "";
          const finalidade = row["Finalidade"];
          const detalhes = row["Detalhes"];
          const lancamento = row["Lançamento"];
          const historico = row["Histórico"];
          const descricao = row["Descrição"];
          const favorecido = row["Favorecido"];

          if (finalidade) {
            description = String(finalidade).trim();
          } else if (detalhes && String(detalhes).trim() !== "") {
            let cleaned = String(detalhes)
              .replace(/^\d{2}\/\d{2}\s+\d{2}:\d{2}\s+/, "") 
              .replace(/^\d+\s+/, "") 
              .trim();
            if (cleaned) {
              description = cleaned;
            } else {
              description = String(detalhes).trim();
            }
          }

          if (!description) {
            description = String(historico || descricao || lancamento || "").trim();
          }

          const descLower = description.toLowerCase();
          if (!description || descLower.includes("saldo") || descLower === "lançamentos" || descLower.includes("extrato")) {
            return null;
          }

          if (favorecido && String(favorecido).trim() !== "" && String(favorecido).toLowerCase().trim() !== "kinesis") {
            description = `${description} (${String(favorecido).trim()})`;
          }

          const valCol = row["Valor Transação"] !== undefined ? row["Valor Transação"] : row["Valor"];
          if (valCol === undefined || valCol === null) return null;

          let amountVal = 0;
          let isNegative = false;

          if (typeof valCol === "number") {
            amountVal = Math.abs(valCol);
            isNegative = valCol < 0;
          } else {
            const strVal = String(valCol).trim();
            const isCredit = strVal.endsWith("C") || strVal.endsWith("c");
            const isDebit = strVal.endsWith("D") || strVal.endsWith("d");
            
            let cleaned = strVal.replace(/[^\d\.,-]/g, "");
            if (cleaned.includes(",") && cleaned.includes(".")) {
              cleaned = cleaned.replace(/\./g, "").replace(",", ".");
            } else if (cleaned.includes(",")) {
              cleaned = cleaned.replace(",", ".");
            }
            
            let num = parseFloat(cleaned);
            if (isNaN(num)) num = 0;
            
            amountVal = Math.abs(num);
            isNegative = num < 0 || isDebit;
            if (isCredit) isNegative = false;
          }

          if (amountVal === 0) return null;

          let typeVal: "INCOME" | "EXPENSE" = "INCOME";
          const tipoLancamento = row["Tipo Lançamento"];
          if (tipoLancamento) {
            const tlClean = String(tipoLancamento).toLowerCase().trim();
            if (tlClean === "entrada" || tlClean === "crédito" || tlClean === "c") {
              typeVal = "INCOME";
            } else if (tlClean === "saída" || tlClean === "débito" || tlClean === "d") {
              typeVal = "EXPENSE";
            } else {
              typeVal = isNegative ? "EXPENSE" : "INCOME";
            }
          } else {
            typeVal = isNegative ? "EXPENSE" : "INCOME";
          }

          let dateObj = dateVal;
          if (!dateObj) {
            dateObj = new Date(year, month, 15);
          }

          return {
            date: dateObj,
            description,
            amount: amountVal,
            type: typeVal
          };
        }).filter(Boolean);
      } else {
        transactions = parseBB(text);
      }
      // Pre-parse dates for all transactions
      const parsedTransactions: any[] = [];
      for (const t of transactions) {
        if (!t.date) continue;
        let transDate: Date;
        if (t.date instanceof Date) {
          transDate = t.date;
        } else {
          const dateStr = String(t.date);
          if (dateStr.includes('/')) {
            transDate = new Date(dateStr.split('/').reverse().join('-') + 'T12:00:00');
          } else {
            transDate = new Date(dateStr);
          }
        }
        if (isNaN(transDate.getTime())) {
          console.warn("Data de transação inválida:", t.date);
          continue;
        }
        parsedTransactions.push({ ...t, transDate });
      }

      if (isAutoSegment) {
        const groups: { [key: string]: { month: number; year: number; items: any[] } } = {};
        for (const t of parsedTransactions) {
          const m = t.transDate.getMonth();
          const y = t.transDate.getFullYear();
          const key = `${y}-${m}`;
          if (!groups[key]) {
            groups[key] = { month: m, year: y, items: [] };
          }
          groups[key].items.push(t);
        }

        let totalImported = 0;
        const processedMonths: string[] = [];
        const monthNames = [
          "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
          "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        ];

        const sortedKeys = Object.keys(groups).sort((a, b) => {
          const [yA, mA] = a.split('-').map(Number);
          const [yB, mB] = b.split('-').map(Number);
          return yA !== yB ? yA - yB : mA - mB;
        });

        for (const key of sortedKeys) {
          const { month: m, year: y, items: groupItems } = groups[key];
          const startOfMonth = new Date(y, m, 1);
          const endOfMonth = new Date(y, m + 1, 0, 23, 59, 59);

          await prisma.transaction.deleteMany({
            where: {
              date: { gte: startOfMonth, lte: endOfMonth },
              bank: 'Banco do Brasil'
            }
          });

          await prisma.importLog.deleteMany({
            where: {
              fileType: "BANCO_BB",
              month: m,
              year: y
            }
          });

          let groupImportedCount = 0;
          const transactionsToCreate: any[] = [];
          for (const t of groupItems) {
            transactionsToCreate.push({
              date: t.transDate,
              description: t.description,
              amount: t.amount,
              type: t.type,
              category: t.type === 'INCOME' ? 'Recebimento' : 'Despesa',
              bank: 'Banco do Brasil'
            });
            groupImportedCount++;
          }

          if (transactionsToCreate.length > 0) {
            await prisma.transaction.createMany({
              data: transactionsToCreate
            });
          }

          await prisma.importLog.create({
            data: {
              fileName: safeFileName,
              fileType: "BANCO_BB",
              month: m,
              year: y,
              totalRecords: groupImportedCount,
              summary: JSON.stringify({ total: groupImportedCount }),
              rawText: text,
              filePath: fileName
            }
          });

          totalImported += groupImportedCount;
          processedMonths.push(`${monthNames[m]}/${y}`);
        }

        return NextResponse.json({ 
          success: true, 
          importedCount: totalImported, 
          message: `${totalImported} transações bancárias importadas e distribuídas nos meses: ${processedMonths.join(', ')}!` 
        });
      } else {
        let importedCount = 0;
        const transactionsToCreate: any[] = [];
        for (const t of parsedTransactions) {
          transactionsToCreate.push({
            date: t.transDate,
            description: t.description,
            amount: t.amount,
            type: t.type,
            category: t.type === 'INCOME' ? 'Recebimento' : 'Despesa',
            bank: 'Banco do Brasil'
          });
          importedCount++;
        }

        if (transactionsToCreate.length > 0) {
          await prisma.transaction.createMany({
            data: transactionsToCreate
          });
        }

        await prisma.importLog.create({
          data: {
            fileName: safeFileName,
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
    }
    else if (fileTypeSent === "BANCO_INTER") {
      // Placeholder para Banco Inter
      await prisma.importLog.create({
        data: {
          fileName: safeFileName,
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
    else if (fileTypeSent === "COBRANCAS") {
      const parsedBillingSessions: any[] = [];
      if (isExcel) {
        console.log("Processando Excel de Cobranças via SQL Puro...", excelData.length, "linhas");
        for (const row of excelData) {
          const findKey = (keys: string[]) => {
            const keysLower = keys.map(k => k.toLowerCase().trim());
            const found = Object.keys(row).find(k => {
              const cleanedK = k.toLowerCase().trim();
              return keysLower.some(target => cleanedK === target || cleanedK.includes(target));
            });
            return found ? row[found] : "";
          };

          const name = findKey(["cliente", "paciente", "nome", "paciante"]);
          const valor = findKey(["valor", "preço", "total", "valor total", "bruto"]);
          const servico = String(findKey(["serviço", "procedimento", "tipo", "atendimento", "descrição"]) || "").toLowerCase();
          const dataAtendimento = findKey(["data", "dia", "atendimento", "data atendimento"]);
          const telefone = findKey(["telefone do cliente", "telefone", "celular", "contato"]);
          const obs = String(findKey(["obs", "observação", "notas"]) || "").toUpperCase();
          const statusRaw = findKey(["status", "situação", "status atendimento", "situação atendimento"]);

          if (!name || !dataAtendimento) continue;

          if (obs.includes("PACOTE FIXO")) continue;

          // Ignorar atendimentos não faturáveis (faltas, cancelamentos, ausências)
          if (statusRaw !== undefined && statusRaw !== null && statusRaw !== "") {
            const statusStr = String(statusRaw).toLowerCase().trim();
            if (
              statusStr.includes("não compareceu") ||
              statusStr.includes("falta") ||
              statusStr.includes("ausência") ||
              statusStr.includes("cancelado") ||
              statusStr.includes("desmarcado")
            ) {
              continue;
            }
          }
          
          // Verificar de forma robusta se a sessão já está paga
          const pagoRaw = findKey(["pago", "pagamento", "liquidado", "acerto"]);
          let isPaid = false;
          if (pagoRaw !== undefined && pagoRaw !== null && pagoRaw !== "") {
            if (typeof pagoRaw === "boolean") {
              isPaid = pagoRaw;
            } else {
              const pagoStr = String(pagoRaw).toLowerCase().trim();
              isPaid = 
                pagoStr === "true" ||
                pagoStr === "1" ||
                pagoStr === "sim" ||
                pagoStr === "s" ||
                pagoStr === "yes" ||
                pagoStr === "y" ||
                pagoStr === "pg" ||
                pagoStr === "pgto" ||
                pagoStr.includes("pago") ||
                pagoStr.includes("ok") ||
                pagoStr === "p" ||
                pagoStr.includes("confirmado") ||
                pagoStr === "x" ||
                pagoStr === "v";
            }
          }
          
          if (isPaid) continue;
          
          const valNum = typeof valor === "number" ? valor : parseFloat(String(valor).replace(/[^\d,.-]/g, '').replace(',', '.'));
          if (!valNum || valNum <= 0) continue;

          let sessionDate: Date;
          try {
            if (dataAtendimento instanceof Date) {
              sessionDate = dataAtendimento;
            } else {
              const dateStr = String(dataAtendimento);
              if (dateStr.includes('/')) {
                const dateParts = dateStr.split(' ')[0].split('/');
                if (dateParts[0].length === 4) {
                  sessionDate = new Date(`${dateParts.join('-')}T12:00:00`);
                } else {
                  sessionDate = new Date(`${dateParts.reverse().join('-')}T12:00:00`);
                }
              } else {
                sessionDate = new Date(dateStr);
              }
            }
          } catch (e) { continue; }

          if (isNaN(sessionDate.getTime())) continue;

          parsedBillingSessions.push({
            name,
            telefone,
            sessionDate,
            servico,
            valNum
          });
        }
      }

      if (isAutoSegment) {
        const groups: { [key: string]: { month: number; year: number; items: any[] } } = {};
        for (const bs of parsedBillingSessions) {
          const m = bs.sessionDate.getMonth();
          const y = bs.sessionDate.getFullYear();
          const key = `${y}-${m}`;
          if (!groups[key]) {
            groups[key] = { month: m, year: y, items: [] };
          }
          groups[key].items.push(bs);
        }

        let totalImported = 0;
        const processedMonths: string[] = [];
        const monthNames = [
          "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
          "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        ];

        const sortedKeys = Object.keys(groups).sort((a, b) => {
          const [yA, mA] = a.split('-').map(Number);
          const [yB, mB] = b.split('-').map(Number);
          return yA !== yB ? yA - yB : mA - mB;
        });

        for (const key of sortedKeys) {
          const { month: m, year: y, items: groupItems } = groups[key];

          try {
            await prisma.billingSession.deleteMany({
              where: {
                month: m,
                year: y
              }
            });
          } catch (e) {
            console.error("Erro ao limpar cobranças antigas:", e);
          }

          await prisma.importLog.deleteMany({
            where: {
              fileType: "COBRANCAS",
              month: m,
              year: y
            }
          });

          let groupImportedCount = 0;
          const billingToCreate: any[] = [];
          for (const bs of groupItems) {
            billingToCreate.push({
              id: Math.random().toString(36).substring(7),
              patientName: String(bs.name),
              phone: bs.telefone ? String(bs.telefone) : null,
              date: bs.sessionDate,
              serviceType: String(bs.servico),
              value: bs.valNum,
              isPaid: false,
              month: m,
              year: y,
              importLogId: "MANUAL",
              createdAt: new Date()
            });
            groupImportedCount++;
          }

          if (billingToCreate.length > 0) {
            await prisma.billingSession.createMany({
              data: billingToCreate
            });
          }

          await prisma.importLog.create({
            data: {
              fileName: safeFileName,
              fileType: "COBRANCAS",
              month: m,
              year: y,
              totalRecords: groupImportedCount,
              summary: JSON.stringify({ total: groupImportedCount }),
              rawText: text,
              filePath: fileName
            }
          });

          totalImported += groupImportedCount;
          processedMonths.push(`${monthNames[m]}/${y}`);
        }

        return NextResponse.json({ 
          success: true, 
          importedCount: totalImported, 
          message: `${totalImported} atendimentos para cobrança importados e distribuídos nos meses: ${processedMonths.join(', ')}!` 
        });
      } else {
        try {
          await prisma.billingSession.deleteMany({
            where: {
              month: month,
              year: year
            }
          });
        } catch (e) {
          console.error("Erro ao limpar cobranças antigas:", e);
        }

        let importedCount = 0;
        const billingToCreate: any[] = [];
        for (const bs of parsedBillingSessions) {
          billingToCreate.push({
            id: Math.random().toString(36).substring(7),
            patientName: String(bs.name),
            phone: bs.telefone ? String(bs.telefone) : null,
            date: bs.sessionDate,
            serviceType: String(bs.servico),
            value: bs.valNum,
            isPaid: false,
            month: month,
            year: year,
            importLogId: "MANUAL",
            createdAt: new Date()
          });
          importedCount++;
        }

        if (billingToCreate.length > 0) {
          await prisma.billingSession.createMany({
            data: billingToCreate
          });
        }

        console.log("Importação concluída. Registros:", importedCount);

        await prisma.importLog.create({
          data: {
            fileName: safeFileName,
            fileType: "COBRANCAS",
            month,
            year,
            totalRecords: importedCount,
            summary: JSON.stringify({ total: importedCount }),
            rawText: text,
            filePath: fileName
          }
        });

        return NextResponse.json({ success: true, importedCount, message: `${importedCount} atendimentos para cobrança importados!` });
      }
    }
    else if (fileTypeSent === "PERFIL_PACIENTE") {
      let importedCount = 0;
      if (isExcel) {
        for (const row of excelData) {
          const findKey = (keys: string[]) => {
            const keysLower = keys.map(k => k.toLowerCase().trim());
            const found = Object.keys(row).find(k => {
              const cleanK = k.toLowerCase().trim();
              return keysLower.some(target => cleanK === target || cleanK.includes(target));
            });
            return found ? row[found] : "";
          };

          const name = findKey(["Cliente", "Paciente", "Nome Cliente", "Nome"]);
          if (!name) continue;

          const rawDateStr = String(findKey(["Data Nascimento", "Nascimento", "Nasc"]) || "");
          let birthDate: Date | null = null;
          if (rawDateStr) {
            const match = rawDateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
            if (match) {
              const [_, d, m, y] = match;
              birthDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), 12, 0, 0);
            }
          }

          await prisma.patient.upsert({
            where: { name: String(name) },
            update: {
              registration: String(findKey(["Matrícula", "ID", "Código"]) || ""),
              gender: String(findKey(["Gênero", "Sexo", "Sexo/Gênero"]) || ""),
              age: parseInt(String(findKey(["Idade", "Idade Atual"]) || "0")) || null,
              phone: String(findKey(["Telefone", "Celular", "Contato"]) || ""),
              profession: String(findKey(["Profissão", "Trabalho", "Ocupação"]) || ""),
              origin: String(findKey(["Origem", "Indicação"]) || ""),
              provenance: String(findKey(["Procedência", "Cidade", "Bairro"]) || ""),
              address: String(findKey(["Endereço", "Logradouro", "Rua"]) || ""),
              latitude: parseFloat(String(findKey(["Latitude", "Lat"]) || "0")) || null,
              longitude: parseFloat(String(findKey(["Longitude", "Lng", "Long"]) || "0")) || null,
              birth_date: birthDate
            },
            create: {
              registration: String(findKey(["Matrícula", "ID", "Código"]) || ""),
              name: String(name),
              gender: String(findKey(["Gênero", "Sexo", "Sexo/Gênero"]) || ""),
              age: parseInt(String(findKey(["Idade", "Idade Atual"]) || "0")) || null,
              phone: String(findKey(["Telefone", "Celular", "Contato"]) || ""),
              profession: String(findKey(["Profissão", "Trabalho", "Ocupação"]) || ""),
              origin: String(findKey(["Origem", "Indicação"]) || ""),
              provenance: String(findKey(["Procedência", "Cidade", "Bairro"]) || ""),
              address: String(findKey(["Endereço", "Logradouro", "Rua"]) || ""),
              latitude: parseFloat(String(findKey(["Latitude", "Lat"]) || "0")) || null,
              longitude: parseFloat(String(findKey(["Longitude", "Lng", "Long"]) || "0")) || null,
              birth_date: birthDate
            }
          });
          importedCount++;
        }
      }

      await prisma.importLog.create({
        data: {
          fileName: safeFileName,
          fileType: "PERFIL_PACIENTE",
          month,
          year,
          totalRecords: importedCount,
          summary: JSON.stringify({ total: importedCount }),
          rawText: text,
          filePath: fileName
        }
      });
      return NextResponse.json({ success: true, importedCount, message: `${importedCount} perfis de pacientes atualizados!` });
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
