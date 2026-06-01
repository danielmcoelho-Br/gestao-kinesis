import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate using Bearer Token
    const authHeader = req.headers.get("Authorization");
    const expectedToken = process.env.SYNC_API_TOKEN || "kinesis-sync-secret-token-2026-v1";
    
    if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.split(" ")[1] !== expectedToken) {
      return NextResponse.json(
        { error: "Não autorizado. Token de sincronização inválido ou ausente." }, 
        { status: 401, headers: corsHeaders }
      );
    }

    // 2. Parse request body
    const body = await req.json();
    const { month, year, atendimentos, debugHtml, logs } = body; 
    const clearMonth = body.clearMonth !== false; // Default to true

    if (debugHtml) {
      console.log("=== SEUFISIO SYNC DEBUG HTML ===");
      console.log(debugHtml);
      console.log("================================");
    }

    if (logs && Array.isArray(logs)) {
      console.log("=== SEUFISIO SYNC EXTENSION LOGS ===");
      logs.forEach((l: string) => console.log(l));
      console.log("====================================");
    }

    if (month === undefined || year === undefined || !Array.isArray(atendimentos)) {
      return NextResponse.json(
        { error: "Payload inválido. Certifique-se de enviar 'month', 'year' e o array 'atendimentos'." }, 
        { status: 400, headers: corsHeaders }
      );
    }

    // 3. Fetch professionals to perform dynamic mapping
    const professionals = await prisma.professional.findMany({
      include: { serviceRules: true }
    });
    console.log("Sync API: professionals fetched from DB:", professionals.length);
    professionals.forEach(p => console.log(`- DB Professional: "${p.name}" (ID: ${p.id})`));

    // 4. Pre-parse dates and filter valid attendance rows
    const parsedItems: any[] = [];
    for (const item of atendimentos) {
      const { cliente, professional, data, tipo, status, valor } = item;
      if (!data || !professional) continue;

      let sessionDate: Date;
      let dateStr = String(data).trim();

      // Handle glued dates like "04/05/202612:00" (resulting from textContent concatenation of line breaks)
      const gluedMatch = dateStr.match(/^(\d{2}\/\d{2}\/\d{4})(\d{2}:\d{2}(:\d{2})?)$/);
      if (gluedMatch) {
        dateStr = gluedMatch[1] + ' ' + gluedMatch[2];
      }

      if (dateStr.includes('/')) {
        const parts = dateStr.split(/\s+/);
        const dateParts = parts[0].split('/');
        const timePart = parts[1] || '12:00';
        sessionDate = new Date(`${dateParts.reverse().join('-')}T${timePart}`);
      } else {
        sessionDate = new Date(dateStr);
      }

      if (isNaN(sessionDate.getTime())) {
        console.warn("Invalid date parsed for sync item:", item);
        continue;
      }

      parsedItems.push({
        cliente: String(cliente || "Paciente Sem Nome").trim(),
        professional: String(professional).trim(),
        sessionDate,
        tipo: String(tipo || "Atendimento").trim(),
        status: String(status || "Finalizado").trim(),
        valor: typeof valor === "number" ? valor : parseFloat(String(valor || "0").replace(',', '.'))
      });
    }

    console.log("Sync API: parsed items count =", parsedItems.length);

    if (parsedItems.length === 0) {
      return NextResponse.json(
        { error: "Nenhum atendimento válido encontrado no payload." }, 
        { status: 400, headers: corsHeaders }
      );
    }

    if (clearMonth) {
      // 5. Delete previous data for the target period to prevent double-inserting
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

      await prisma.session.deleteMany({
        where: {
          date: { gte: startOfMonth, lte: endOfMonth }
        }
      });

      await prisma.importLog.deleteMany({
        where: {
          fileType: "SEUFISIO",
          month: month,
          year: year
        }
      });
    }

    // 6. Map and insert new sessions
    let importedCount = 0;
    const stats = {
      total: parsedItems.length,
      finalizado: 0,
      falta: 0,
      ausenciaProfissional: 0,
      ausenciaJustificada: 0
    };

    const sessionsToCreate: any[] = [];
    for (let idx = 0; idx < parsedItems.length; idx++) {
      const item = parsedItems[idx];
      // Fuzzy match professional names to handle table truncation (e.g., 'Joao Pedro...' -> 'Joao Pedro Passos Facioli')
      const cleanProf = item.professional.replace(/\.\.\./g, "").trim().toUpperCase();
      const prof = professionals.find(p => {
        const dbName = p.name.toUpperCase();
        // 1. Direct match or inclusion
        if (dbName.includes(cleanProf) || cleanProf.includes(dbName)) return true;
        
        // 2. Word-by-word match (for truncated last names, e.g., 'Paula Guar...' matches 'Paula Guará')
        const cleanWords = cleanProf.split(/\s+/).filter((w: string) => w.length > 2);
        if (cleanWords.length > 0 && cleanWords.every((w: string) => dbName.includes(w))) {
          return true;
        }
        
        // 3. First name match as fallback
        const dbFirstName = dbName.split(" ")[0];
        const cleanFirstName = cleanProf.split(" ")[0];
        if (dbFirstName === cleanFirstName && cleanFirstName.length > 2) {
          return true;
        }
        
        return false;
      });

      if (prof) {
        const specificRule = prof.serviceRules.find(r => item.tipo.includes(r.serviceCode));
        const percentage = specificRule ? specificRule.percentage : prof.defaultPercentage;

        sessionsToCreate.push({
          professionalId: prof.id,
          patientName: item.cliente.replace(/\.\.\./g, "").trim(),
          date: item.sessionDate,
          status: item.status,
          serviceType: item.tipo.replace(/\.\.\./g, "").trim(),
          value: item.valor,
          clinicPercentage: percentage
        });

        if (item.status === 'Finalizado') stats.finalizado++;
        else if (item.status === 'Não Compareceu') stats.falta++;
        else if (item.status === 'Ausência Justificada') stats.ausenciaJustificada++;
        else if (item.status === 'Ausência do Profissional') stats.ausenciaProfissional++;

        importedCount++;
      } else {
        console.warn(`Sync API: match failed for item ${idx} - "${item.professional}" (clean: "${cleanProf}")`);
      }
    }

    console.log(`Sync API: completed matching. Matched ${importedCount} of ${parsedItems.length} items.`);

    if (sessionsToCreate.length > 0) {
      await prisma.session.createMany({
        data: sessionsToCreate
      });
    }

    // 7. Write to ImportLog
    await prisma.importLog.create({
      data: {
        fileName: `Sincronização Extensão SeuFisio (${importedCount} registros)`,
        fileType: "SEUFISIO",
        month: month,
        year: year,
        totalRecords: importedCount,
        summary: JSON.stringify(stats),
        rawText: JSON.stringify(atendimentos, null, 2),
        filePath: "sync-extension"
      }
    });

    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    return NextResponse.json({
      success: true,
      importedCount,
      message: `${importedCount} atendimentos sincronizados com sucesso para o período de ${monthNames[month]}/${year}!`
    }, {
      headers: corsHeaders
    });

  } catch (error: any) {
    console.error("Erro na sincronização SeuFisio:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor durante a sincronização." }, 
      { status: 500, headers: corsHeaders }
    );
  }
}
