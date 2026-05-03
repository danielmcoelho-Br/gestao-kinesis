import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startMonth = parseInt(searchParams.get("startMonth") || "0");
    const startYear = parseInt(searchParams.get("startYear") || "2026");
    const endMonth = parseInt(searchParams.get("endMonth") || startMonth.toString());
    const endYear = parseInt(searchParams.get("endYear") || startYear.toString());

    // Definir o intervalo de datas
    const startDate = new Date(startYear, startMonth, 1);
    const endDate = new Date(endYear, endMonth + 1, 0, 23, 59, 59);

    // Buscar sessões finalizadas no período
    const sessions = await prisma.session.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: { contains: "Finalizado", mode: 'insensitive' }
      },
      select: {
        patientName: true,
      },
    });

    const uniquePatientNames = Array.from(new Set(sessions.map(s => s.patientName.trim().toLowerCase())));

    // 2. Buscar perfis completos desses pacientes (Busca insensível a maiúsculas/minúsculas)
    const allPatients = await prisma.patient.findMany();
    const patientProfiles = allPatients.filter(p => 
      uniquePatientNames.includes(p.name.trim().toLowerCase())
    );

    // 3. Cruzar dados: Identificar quem foi atendido mas não tem perfil cadastrado
    const profileNamesLower = patientProfiles.map(p => p.name.trim().toLowerCase());
    const missingProfiles = uniquePatientNames.filter(name => !profileNamesLower.includes(name));

    // 4. Calcular Estatísticas Avançadas
    const femalePatients = patientProfiles.filter(p => p.gender?.toLowerCase().startsWith('f'));
    const malePatients = patientProfiles.filter(p => p.gender?.toLowerCase().startsWith('m'));
    
    const calculateAvgAge = (list: any[]) => {
      const withAge = list.filter(p => p.age && p.age > 0);
      if (withAge.length === 0) return 0;
      return Math.round(withAge.reduce((acc, p) => acc + p.age, 0) / withAge.length);
    };

    const ageRangesConfig = [
      { label: "90+ anos", min: 90, max: 200 },
      { label: "80 - 89 anos", min: 80, max: 89 },
      { label: "70 - 79 anos", min: 70, max: 79 },
      { label: "60 - 69 anos", min: 60, max: 69 },
      { label: "50 - 59 anos", min: 50, max: 59 },
      { label: "40 - 49 anos", min: 40, max: 49 },
      { label: "30 - 39 anos", min: 30, max: 39 },
      { label: "20 - 29 anos", min: 20, max: 29 },
      { label: "10 - 19 anos", min: 10, max: 19 },
      { label: "0 - 9 anos", min: 0, max: 9 },
    ];

    const stratifiedAgeData = ageRangesConfig.map(range => {
      const menInRange = malePatients.filter(p => p.age && p.age >= range.min && p.age <= range.max).length;
      const womenInRange = femalePatients.filter(p => p.age && p.age >= range.min && p.age <= range.max).length;
      return {
        label: range.label,
        men: menInRange,
        women: womenInRange,
        total: menInRange + womenInRange
      };
    });

    // Adicionar "Indeterminada"
    const menNoAge = malePatients.filter(p => !p.age || p.age <= 0).length;
    const womenNoAge = femalePatients.filter(p => !p.age || p.age <= 0).length;
    stratifiedAgeData.push({
      label: "Indeterminada",
      men: menNoAge,
      women: womenNoAge,
      total: menNoAge + womenNoAge
    });

    // Lógica com Correspondência Difusa (Fuzzy Matching) e Correções Manuais
    const mergeProfessions = (profiles: any[]) => {
      const counts: Record<string, number> = {};
      const originalLabels: Record<string, string> = {};

      const normalize = (str: string) => {
        let n = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        // Correções de erros comuns de digitação ou termos específicos
        if (n.includes("empresariado")) return "empresario";
        if (n.startsWith("arteso")) return "artesao";
        if (n.includes("adminstrador")) return "administrador";
        if (n.includes("aposentad")) return "aposentado";
        return n;
      };

      // Função simples de distância de Levenshtein para similaridade
      const getDistance = (a: string, b: string) => {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= b.length; i++) {
          for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
            else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
          }
        }
        return matrix[b.length][a.length];
      };

      const processedGroups: string[] = [];

      profiles.forEach(p => {
        if (!p.profession) return;
        const raw = p.profession.trim();
        const normalized = normalize(raw);
        
        // Encontrar um grupo similar já existente
        let groupKey = processedGroups.find(g => {
          if (g === normalized) return true;
          // Se a distância for pequena em relação ao tamanho da palavra, agrupa
          if (getDistance(g, normalized) <= 1 && g.length > 4) return true;
          return false;
        }) || normalized;

        if (!processedGroups.includes(groupKey)) processedGroups.push(groupKey);

        counts[groupKey] = (counts[groupKey] || 0) + 1;

        // Definir Rótulo de Exibição
        if (!originalLabels[groupKey] || (raw.includes('á') || raw.includes('ó') || raw.length > originalLabels[groupKey].length)) {
          let label = raw;
          // Aplicar sufixos de gênero de forma inteligente ao rótulo
          const lowLabel = label.toLowerCase();
          if (lowLabel.endsWith('ora') || lowLabel.endsWith('or')) {
            label = lowLabel.endsWith('ora') ? label.substring(0, label.length - 1) + "(a)" : label + "(a)";
          } else if (lowLabel.endsWith('o') || lowLabel.endsWith('a')) {
            if (!lowLabel.endsWith('ista') && !lowLabel.endsWith('euta') && !lowLabel.endsWith('ente')) {
              label = label.substring(0, label.length - 1) + "o(a)";
            }
          }
          // Correções específicas de exibição
          if (groupKey === "artesao") label = "Artesão(ã)";
          if (groupKey === "empresario") label = "Empresário(a)";
          if (groupKey === "aposentado") label = "Aposentado(a)";
          if (groupKey === "administrador") label = "Administrador(a)";
          
          originalLabels[groupKey] = label;
        }
      });

      return Object.entries(counts)
        .map(([key, count]) => {
          let label = originalLabels[key] || key;
          // Capitalizar todas as palavras (Title Case)
          label = label.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          return [label, count];
        })
        .sort((a: any, b: any) => b[1] - a[1]);
    };

    // Função genérica para agrupar e formatar listas (Origem e Procedência)
    const mergeGeneralList = (list: string[]) => {
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
          // Capitalizar todas as palavras (Title Case)
          label = label.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          return [label, count];
        })
        .sort((a: any, b: any) => b[1] - a[1]);
    };

    const stats = {
      totalAttended: uniquePatientNames.length,
      withProfile: patientProfiles.length,
      missingProfile: missingProfiles.length,
      summary: {
        female: { count: femalePatients.length, avgAge: calculateAvgAge(femalePatients) },
        male: { count: malePatients.length, avgAge: calculateAvgAge(malePatients) },
        totalAvgAge: calculateAvgAge(patientProfiles)
      },
      stratifiedAgeData,
      gender: {
        masculino: malePatients.length,
        feminino: femalePatients.length,
        outro: patientProfiles.filter(p => p.gender && !['m', 'f'].includes(p.gender.toLowerCase()[0])).length,
        naoInformado: patientProfiles.filter(p => !p.gender).length
      },
      allProfessions: mergeProfessions(patientProfiles),
      allOrigins: mergeGeneralList(patientProfiles.map(p => p.origin).filter(Boolean) as string[]),
      allProvenance: mergeGeneralList(patientProfiles.map(p => p.provenance).filter(Boolean) as string[]),
      heatmapData: patientProfiles
        .filter(p => p.latitude && p.longitude)
        .map(p => ({ lat: p.latitude, lng: p.longitude, weight: 1 }))
    };

    return NextResponse.json({ stats, patients: patientProfiles, missingProfiles });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
