import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ReengagementService } from "@/gestao/services/reengagementService";
import { normalizeName } from "@/lib/utils";

// Helper function to calculate average age
const calculateAvgAge = (list: any[]) => {
  const withAge = list.filter(p => p.age && p.age > 0);
  if (withAge.length === 0) return 0;
  return Math.round(withAge.reduce((acc, p) => acc + p.age, 0) / withAge.length);
};

// Helper function to group/merge lists (e.g. professions, locations)
const mergeGeneralList = (list: string[], patientCount: number) => {
  const counts: Record<string, number> = {};
  const originalLabels: Record<string, string> = {};

  const normalize = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  };

  list.forEach(val => {
    if (!val) return;
    const norm = normalize(val);
    counts[norm] = (counts[norm] || 0) + 1;
    if (!originalLabels[norm] || (val.includes('á') || val.includes('ó') || val.length > originalLabels[norm].length)) {
      originalLabels[norm] = val.trim();
    }
  });

  return Object.entries(counts)
    .map(([key, count]) => {
      let label = originalLabels[key] || key;
      label = label.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      const pct = patientCount > 0 ? parseFloat(((count / patientCount) * 100).toFixed(1)) : 0;
      return { name: label, count, pct };
    })
    .sort((a, b) => b.count - a.count);
};

// Helper for professions fuzzy matching
const mergeProfessions = (profiles: any[]) => {
  const counts: Record<string, number> = {};
  const originalLabels: Record<string, string> = {};

  const normalize = (str: string) => {
    let n = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    if (n.includes("empresariado")) return "empresario";
    if (n.startsWith("arteso")) return "artesao";
    if (n.includes("adminstrador")) return "administrador";
    if (n.includes("aposentad")) return "aposentado";
    return n;
  };

  profiles.forEach(p => {
    if (!p.profession) return;
    const raw = p.profession.trim();
    const normalized = normalize(raw);
    counts[normalized] = (counts[normalized] || 0) + 1;
    if (!originalLabels[normalized] || raw.length > originalLabels[normalized].length) {
      originalLabels[normalized] = raw;
    }
  });

  return Object.entries(counts)
    .map(([key, count]) => {
      let label = originalLabels[key] || key;
      label = label.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      const pct = profiles.length > 0 ? parseFloat(((count / profiles.length) * 100).toFixed(1)) : 0;
      return { name: label, count, pct };
    })
    .sort((a, b) => b.count - a.count);
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, startMonth, startYear, endMonth, endYear } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        error: "Chave GEMINI_API_KEY não configurada no arquivo .env."
      }, { status: 400 });
    }

    // 1. Fetch patients attended in the period
    const startDate = new Date(startYear, startMonth, 1);
    const endDate = new Date(endYear, endMonth + 1, 0, 23, 59, 59);

    const sessions = await prisma.session.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: { contains: "Finalizado", mode: 'insensitive' }
      },
      select: { patientName: true },
      distinct: ['patientName']
    });

    const uniquePatientNames = Array.from(new Set(sessions.map(s => s.patientName.trim().toLowerCase())));
    const uniquePatientNamesVariants = Array.from(new Set(
      uniquePatientNames.flatMap(name => [
        name,
        name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      ])
    ));

    const patientProfiles = uniquePatientNamesVariants.length > 0
      ? await prisma.patient.findMany({
          where: {
            OR: uniquePatientNamesVariants.map(name => ({
              name: {
                startsWith: name,
                mode: 'insensitive' as const
              }
            }))
          }
        })
      : [];

    const profileNamesNorm = patientProfiles.map(p => normalizeName(p.name));
    const missingProfilesCount = uniquePatientNames.filter(name => {
      const normName = normalizeName(name);
      return !profileNamesNorm.some(pName => pName.startsWith(normName));
    }).length;

    // 2. Fetch diagnoses
    const patientIds = patientProfiles.map(p => p.id);
    const patientDiagnoses = await prisma.patientDiagnosis.findMany({
      where: { patient_id: { in: patientIds } }
    });

    const mergeDiagnoses = (diags: any[]) => {
      const counts: Record<string, number> = {};
      const originalLabels: Record<string, string> = {};
      const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

      diags.forEach(d => {
        if (!d.diagnosis) return;
        const raw = d.diagnosis.trim();
        const norm = normalize(raw);
        counts[norm] = (counts[norm] || 0) + 1;
        if (!originalLabels[norm] || raw.length > originalLabels[norm].length) {
          originalLabels[norm] = raw;
        }
      });

      return Object.entries(counts)
        .map(([key, count]) => {
          let label = originalLabels[key] || key;
          label = label.toLowerCase().split(' ').map(word => {
            if (['de', 'da', 'do', 'e', 'ou', 'para', 'com'].includes(word)) return word;
            return word.charAt(0).toUpperCase() + word.slice(1);
          }).join(' ');
          const pct = patientProfiles.length > 0 ? parseFloat(((count / patientProfiles.length) * 100).toFixed(1)) : 0;
          return { name: label, count, pct };
        })
        .sort((a, b) => b.count - a.count);
    };

    const mergeSegments = (diags: any[]) => {
      const counts: Record<string, number> = {};
      const originalLabels: Record<string, string> = {};
      const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

      diags.forEach(d => {
        if (!d.segment) return;
        const raw = d.segment.trim();
        const norm = normalize(raw);
        counts[norm] = (counts[norm] || 0) + 1;
        if (!originalLabels[norm] || raw.length > originalLabels[norm].length) {
          originalLabels[norm] = raw;
        }
      });

      return Object.entries(counts)
        .map(([key, count]) => {
          let label = originalLabels[key] || key;
          label = label.toLowerCase().split(' ').map(word => {
            if (['de', 'da', 'do', 'e', 'ou', 'para', 'com'].includes(word)) return word;
            return word.charAt(0).toUpperCase() + word.slice(1);
          }).join(' ');
          const pct = patientProfiles.length > 0 ? parseFloat(((count / patientProfiles.length) * 100).toFixed(1)) : 0;
          return { name: label, count, pct };
        })
        .sort((a, b) => b.count - a.count);
    };

    // 3. Fetch Inactives and Feedbacks
    const inactivePatients = await ReengagementService.getInactivePatients(14);
    const feedbacks = await ReengagementService.getReengagementFeedbacks();

    const femaleCount = patientProfiles.filter(p => p.gender?.toLowerCase().startsWith('f')).length;
    const maleCount = patientProfiles.filter(p => p.gender?.toLowerCase().startsWith('m')).length;

    const stats = {
      totalAttended: uniquePatientNames.length,
      withProfile: patientProfiles.length,
      missingProfile: missingProfilesCount,
      gender: {
        feminino: femaleCount,
        masculino: maleCount
      },
      allProfessions: mergeProfessions(patientProfiles),
      allProvenance: mergeGeneralList(patientProfiles.map(p => p.provenance).filter(Boolean) as string[], patientProfiles.length),
      allDiagnoses: mergeDiagnoses(patientDiagnoses),
      allSegments: mergeSegments(patientDiagnoses)
    };

    // 4. Construct System Prompt
    const systemPrompt = `Você é o Kinesis AI Patient Agent, um agente inteligente de IA especializado em análise de padrões de pacientes, demografia, geomarketing e evasão (absenteísmo e churn) de clínicas de reabilitação.
Você está ajudando o Daniel, proprietário e gestor da clínica Kinesis, a obter insights sobre o comportamento, perfis e agendamentos dos pacientes.

Seu tom deve ser profissional, altamente analítico e focado em propor soluções estratégicas (ex: onde focar marketing digital local, como recuperar pacientes inativos, como ajustar a ocupação de horários, etc.).

Aqui estão os dados da clínica consolidados para os pacientes atendidos no período selecionado (${startMonth + 1}/${startYear} até ${endMonth + 1}/${endYear}):

1. MÉTRICAS DE PÚBLICO:
- Pacientes Únicos Atendidos no Período: ${stats.totalAttended}
- Perfis Detalhados Encontrados: ${stats.withProfile}
- Aguardando Cadastro Básico: ${stats.missingProfile}
- Gênero: Feminino: ${stats.gender.feminino} (${stats.withProfile > 0 ? ((stats.gender.feminino / stats.withProfile) * 100).toFixed(1) : 0}%) | Masculino: ${stats.gender.masculino} (${stats.withProfile > 0 ? ((stats.gender.masculino / stats.withProfile) * 100).toFixed(1) : 0}%)

2. DISTRIBUIÇÃO GEOGRÁFICA (BAIRROS/PROCEDÊNCIAS):
${JSON.stringify(stats.allProvenance, null, 2)}

3. DISTRIBUIÇÃO PROFISSIONAL:
${JSON.stringify(stats.allProfessions, null, 2)}

4. DISTRIBUIÇÃO CLÍNICA DE PATOLOGIAS (DIAGNÓSTICOS E SEGMENTOS):
- Diagnósticos Clínicos Registrados:
${JSON.stringify(stats.allDiagnoses, null, 2)}
- Segmentos Corporais Acometidos:
${JSON.stringify(stats.allSegments, null, 2)}

5. PACIENTES INATIVOS (+14 DIAS SEM AGENDA E SEM CONSULTAS FUTURAS):
- Total de Pacientes Inativos no Sistema: ${inactivePatients.length}
- Amostra dos Pacientes Inativos (primeiros 40):
${JSON.stringify(inactivePatients.slice(0, 40).map(p => ({ nome: p.name, telefone: p.phone, diasInativo: p.daysInactive })), null, 2)}

6. FEEDBACKS DE EVASÃO (Motivos de afastamento deixados pelos pacientes):
${JSON.stringify(feedbacks, null, 2)}

INSTRUÇÕES DE RESPOSTA:
- Responda SEMPRE em português.
- Apresente análises cruzando os dados reais fornecidos (ex: correlacionar os bairros que mais trazem pacientes com os diagnósticos mais frequentes deles, ou analisar se a inatividade está ligada a algum motivo recorrente nos feedbacks).
- Use tabelas markdown, listas em negrito e formatações ricas para deixar a resposta bonita e escaneável.
- Conclua com 3 recomendações estratégicas acionáveis de marketing, agendamento ou fidelização de pacientes.`;

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
              { text: `Contexto de análise de pacientes:\n${systemPrompt}\n\nPergunta do usuário: "${prompt}"` }
            ]
          }
        ]
      })
    });

    const geminiData = await geminiResponse.json();
    
    if (!geminiResponse.ok) {
      console.error("Erro na resposta do Gemini API (Patient Agent):", geminiData);
      return NextResponse.json({
        error: geminiData.error?.message || "Erro desconhecido na comunicação com a API do Gemini."
      }, { status: 500 });
    }

    const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, não consegui analisar os dados de pacientes.";

    return NextResponse.json({ text: aiText });

  } catch (error: any) {
    console.error("Erro na rota do Patient Copilot:", error);
    return NextResponse.json({ error: error.message || "Erro interno do servidor." }, { status: 500 });
  }
}
