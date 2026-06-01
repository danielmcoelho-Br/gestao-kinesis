import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StatsService } from "@/gestao/services/statsService";
import { promises as fs } from "fs";
import path from "path";

const INSTRUCTIONS_FILE = path.join(process.cwd(), "src/gestao/copilot_instructions.txt");

// GET: Retorna as diretrizes personalizadas atuais
export async function GET() {
  try {
    let customInstructions = "";
    try {
      customInstructions = await fs.readFile(INSTRUCTIONS_FILE, "utf-8");
    } catch (e) {
      // Arquivo não existe ainda
    }
    return NextResponse.json({ instructions: customInstructions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao ler as diretrizes." }, { status: 500 });
  }
}

// PUT: Salva as diretrizes personalizadas
export async function PUT(req: NextRequest) {
  try {
    const { instructions } = await req.json();
    const dir = path.dirname(INSTRUCTIONS_FILE);
    
    // Garante que a pasta existe
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(INSTRUCTIONS_FILE, instructions || "", "utf-8");
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao salvar as diretrizes." }, { status: 500 });
  }
}

// POST: Executa a análise com base no prompt do usuário e contexto
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, activeTab, startMonth, startYear, endMonth, endYear } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        error: "Chave GEMINI_API_KEY não configurada no arquivo .env. Por favor, adicione a sua chave no arquivo .env na raiz do projeto (ex: GEMINI_API_KEY=\"sua-chave-aqui\") e reinicie o servidor dev."
      }, { status: 400 });
    }

    // 1. Ler as diretrizes personalizadas salvas
    let customInstructions = "";
    try {
      customInstructions = await fs.readFile(INSTRUCTIONS_FILE, "utf-8");
    } catch (e) {
      // Ignora se não existir
    }

    // 2. Get Dashboard Stats using existing StatsService
    const statsData = await StatsService.getDashboardData(
      startMonth, 
      startYear, 
      endMonth, 
      endYear, 
      ['geral', 'fisioterapia', 'pilates'].includes(activeTab) ? null : activeTab
    );

    // 3. Fetch Patients with their DiaryLogs and Sessions
    const patients = await prisma.patient.findMany({
      include: {
        diary_logs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    const startDate = new Date(startYear, startMonth, 1);
    const endDate = new Date(endYear, endMonth + 1, 0, 23, 59, 59);

    // Fetch all sessions of the period to manually correlate with patients
    const periodSessions = await prisma.session.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // 4. Compile clinical correlations patient-by-patient
    const patientCorrelations = patients.map(p => {
      const pSessions = periodSessions.filter(
        s => s.patientName && s.patientName.trim().toLowerCase() === p.name.trim().toLowerCase()
      );
      
      const totalSessions = pSessions.length;
      const completed = pSessions.filter(s => s.status.toLowerCase().includes("finalizado")).length;
      const faltas = pSessions.filter(s => s.status.toLowerCase().includes("não compareceu")).length;
      const justificadas = pSessions.filter(s => s.status.toLowerCase().includes("justificada")).length;
      
      const painLogs = p.diary_logs.filter(log => log.createdAt >= startDate && log.createdAt <= endDate);
      const avgPain = painLogs.length > 0 
        ? parseFloat((painLogs.reduce((acc, log) => acc + log.painLevel, 0) / painLogs.length).toFixed(1))
        : null;
      const lastPain = p.diary_logs.length > 0 ? p.diary_logs[0].painLevel : null;
      const moods = Array.from(new Set(painLogs.map(log => log.mood).filter(Boolean)));
      
      return {
        nome: p.name,
        idade: p.age,
        profissao: p.profession,
        totalSessoes: totalSessions,
        finalizadas: completed,
        faltas,
        justificadas,
        dorMedia: avgPain,
        dorUltima: lastPain,
        humores: moods
      };
    }).filter(p => p.totalSessoes > 0 || p.dorMedia !== null); // only include patients active or who reported pain in the period

    // 5. Construct context summary for Gemini
    const context = {
      periodo: {
        inicio: `${startMonth + 1}/${startYear}`,
        fim: `${endMonth + 1}/${endYear}`,
        abaAtiva: activeTab
      },
      metricasPrincipais: {
        consolidado: statsData.current.consolidated,
        fisioterapia: statsData.current.fisioterapia,
        pilates: statsData.current.pilates
      },
      correlacaoClinicaPacientes: patientCorrelations
    };

    // 6. Construct system prompt
    const systemPrompt = `Você é o Kinesis AI Copilot, um especialista em inteligência clínica, análise de dados de saúde e gestão financeira de clínicas de fisioterapia e pilates.
Você está ajudando o Daniel, proprietário e fisioterapeuta-chefe da Kinesis, a analisar os dados da sua clínica.

Seu tom deve ser profissional, direto, analítico e focado em propor soluções clínicas (ajuste de tratamento, melhora de assiduidade) e financeiras (repasses, otimização de faturamento).

Aqui estão os dados da clínica para o período selecionado (${context.periodo.inicio} até ${context.periodo.fim}), filtrados pela aba "${context.periodo.abaAtiva}":

1. MÉTRICAS DO PERÍODO ATUAL:
- Total Geral de Sessões Finalizadas: ${context.metricasPrincipais.consolidado.statusSummary.finalizado}
- Total Geral de Pacientes Únicos: ${context.metricasPrincipais.consolidado.uniquePatientsCount}
- Faturamento Bruto Consolidado: R$ ${context.metricasPrincipais.consolidado.grossValue.toFixed(2)} (Fisioterapia: R$ ${context.metricasPrincipais.fisioterapia.grossValue.toFixed(2)}, Pilates: R$ ${context.metricasPrincipais.pilates.grossValue.toFixed(2)})
- Margem da Clínica Consolidada: R$ ${context.metricasPrincipais.consolidado.clinicProfit.toFixed(2)} (Fisioterapia: R$ ${context.metricasPrincipais.fisioterapia.clinicProfit.toFixed(2)}, Pilates: R$ ${context.metricasPrincipais.pilates.clinicProfit.toFixed(2)})
- Ticket Médio Consolidado: R$ ${(context.metricasPrincipais.consolidado.ticketAverage || 0).toFixed(2)}
- Média de Sessões por Paciente: ${(context.metricasPrincipais.consolidado.avgSessionsPerPatient || 0).toFixed(2)}
- Status das Sessões Consolidadas: ${JSON.stringify(context.metricasPrincipais.consolidado.statusSummary)}

2. DETALHAMENTO DOS SERVIÇOS (CATEGORIAS E CONTRATAÇÕES):
Fisioterapia Stratification: ${JSON.stringify(context.metricasPrincipais.fisioterapia.stratification)}
Pilates Stratification: ${JSON.stringify(context.metricasPrincipais.pilates.stratification)}

3. CORRELAÇÃO CLÍNICA DE PACIENTES (Cruzamento de Faltas, Idade e Nível de Dor no período):
${JSON.stringify(context.correlacaoClinicaPacientes, null, 2)}
${customInstructions ? `
4. DIRETRIZES E REGRAS PERSONALIZADAS DA CLÍNICA (Siga-as com prioridade máxima e rigorosamente):
${customInstructions}
` : ""}

INSTRUÇÕES DE RESPOSTA:
- Responda SEMPRE em português.
- Use tabelas markdown, marcadores em negrito e listas para organizar as informações de forma extremamente visual, organizada e limpa.
- Faça cruzamentos de dados reais. Se o usuário perguntar sobre correlação entre faltas e dor, analise a lista de pacientes fornecida acima e liste nominalmente os casos que mais chamam atenção (ex: dor média alta + muitas faltas, indicando que a dor pode estar impedindo o comparecimento ou a falta de tratamento está piorando a dor).
- Seja preciso nos números. Não invente dados que não estão no contexto.
- Conclua sempre com 2 ou 3 recomendações de ação prática de gestão ou clínica baseadas no seu cruzamento.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: `Contexto do sistema:\n${systemPrompt}\n\nPergunta do usuário: "${prompt}"` }
            ]
          }
        ]
      })
    });

    const geminiData = await geminiResponse.json();
    
    if (!geminiResponse.ok) {
      console.error("Erro na resposta do Gemini API:", geminiData);
      return NextResponse.json({
        error: geminiData.error?.message || "Erro desconhecido na comunicação com a API do Gemini."
      }, { status: 500 });
    }

    const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, não consegui gerar uma resposta.";

    return NextResponse.json({ text: aiText });
    
  } catch (error: any) {
    console.error("Erro na rota do Copilot:", error);
    return NextResponse.json({ error: error.message || "Erro interno do servidor." }, { status: 500 });
  }
}
