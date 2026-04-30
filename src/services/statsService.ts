import { prisma } from "@/lib/prisma";

export interface SessionMetrics {
  count: number;
  grossValue: number;
  clinicProfit: number;
  profValue: number;
}

export interface StatusSummary {
  finalizado: number;
  faltas: number;
  ausenciaProf: number;
  ausenciaJust: number;
  ausenciaNula: number;
}

export interface StratifiedCategory extends SessionMetrics {
  name: string;
}

export interface FullMetrics extends SessionMetrics {
  totalCount: number;
  statusSummary: StatusSummary;
  stratification: StratifiedCategory[];
  avgSessionsPerPatient?: number;
  ticketAverage?: number;
  uniquePatientsCount: number;
}

export interface DashboardStats {
  consolidated: FullMetrics;
  fisioterapia: FullMetrics;
  pilates: FullMetrics;
}

export class StatsService {
  static categorizeService(serviceType: string): { category: string, isPilates: boolean } {
    const type = serviceType.toLowerCase().trim();
    if (type.includes("pilates")) return { category: "Pilates", isPilates: true };
    if (type.includes("reabilitação")) return { category: "Fisioterapia (Reabilitação)", isPilates: false };
    if (type.includes("av. tontura") || (type.includes("avaliação") && !type.includes("funcional") && !type.includes("geriatria"))) return { category: "Avaliação", isPilates: false };
    if (type.includes("av. funcional") || type.includes("avaliação funcional")) return { category: "Avaliação Funcional", isPilates: false };
    if (type.includes("geriatria")) return { category: "Geriatria", isPilates: false };
    if (type.includes("domiciliar")) return { category: "Domiciliar", isPilates: false };
    if (type.includes("épic")) return { category: "Orientação EPIC", isPilates: false };
    if (type.includes("av funcional kinesis")) return { category: "Av Funcional Kinesis", isPilates: false };
    if (type.includes("nutrição")) return { category: "Nutrição", isPilates: false };
    return { category: "Outros", isPilates: false };
  }

  static processSessions(sessions: any[]): FullMetrics {
    const statusSummary: StatusSummary = { finalizado: 0, faltas: 0, ausenciaProf: 0, ausenciaJust: 0, ausenciaNula: 0 };
    const stratMap: Record<string, StratifiedCategory> = {};
    const uniquePatients = new Set<string>();
    
    let totalGross = 0;
    let totalClinic = 0;
    let finalizedGross = 0;

    sessions.forEach(s => {
      const status = (s.status || "").toLowerCase().trim();
      const isFinalizado = status.includes("finalizado");
      const { category } = this.categorizeService(s.serviceType);
      
      if (status.includes("ausência nula")) {
        statusSummary.ausenciaNula++;
      } else {
        totalGross += s.value;
        const clinicPart = s.value * s.clinicPercentage;
        totalClinic += clinicPart;

        if (s.patientName) uniquePatients.add(s.patientName.trim().toLowerCase());

        if (isFinalizado) {
          statusSummary.finalizado++;
          finalizedGross += s.value;
          
          if (!stratMap[category]) {
            stratMap[category] = { name: category, count: 0, grossValue: 0, clinicProfit: 0, profValue: 0 };
          }
          stratMap[category].count++;
          stratMap[category].grossValue += s.value;
          stratMap[category].clinicProfit += clinicPart;
          stratMap[category].profValue += (s.value - clinicPart);
        } else if (status.includes("não compareceu")) {
          statusSummary.faltas++;
        } else if (status.includes("ausência do profissional")) {
          statusSummary.ausenciaProf++;
        } else {
          statusSummary.ausenciaJust++;
        }
      }
    });

    const effectiveCount = statusSummary.finalizado + statusSummary.faltas + statusSummary.ausenciaProf + statusSummary.ausenciaJust;

    const metrics: FullMetrics = {
      count: effectiveCount,
      totalCount: sessions.length,
      grossValue: totalGross,
      clinicProfit: totalClinic,
      profValue: totalGross - totalClinic,
      statusSummary,
      stratification: Object.values(stratMap),
      uniquePatientsCount: uniquePatients.size
    };

    if (statusSummary.finalizado > 0) {
      metrics.ticketAverage = totalGross / statusSummary.finalizado;
      if (uniquePatients.size > 0) {
        metrics.avgSessionsPerPatient = statusSummary.finalizado / uniquePatients.size;
      }
    }

    return metrics;
  }

  static getSeparatedStats(sessions: any[]): DashboardStats {
    const fisioSessions = sessions.filter(s => !this.categorizeService(s.serviceType).isPilates);
    const pilatesSessions = sessions.filter(s => this.categorizeService(s.serviceType).isPilates);

    return {
      consolidated: this.processSessions(sessions),
      fisioterapia: this.processSessions(fisioSessions),
      pilates: this.processSessions(pilatesSessions)
    };
  }

  static async getDashboardData(month: number, year: number, professionalId: string | null = null) {
    const startOfTarget = new Date(year, month, 1);
    const endOfTarget = new Date(year, month + 1, 0, 23, 59, 59);
    const filter: any = { date: { gte: startOfTarget, lte: endOfTarget } };
    if (professionalId) filter.professionalId = professionalId;

    const currentSessions = await prisma.session.findMany({ where: filter });
    const current = this.getSeparatedStats(currentSessions);

    const prevMonthDate = new Date(year, month - 1, 1);
    const pmSessions = await prisma.session.findMany({ 
      where: { ...filter, date: { gte: new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), 1), lte: new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, 0, 23, 59, 59) } } 
    });
    const lastMonth = this.getSeparatedStats(pmSessions);

    const pySessions = await prisma.session.findMany({ 
      where: { ...filter, date: { gte: new Date(year - 1, month, 1), lte: new Date(year - 1, month + 1, 0, 23, 59, 59) } } 
    });
    const lastYear = this.getSeparatedStats(pySessions);

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);
    const yearSessions = await prisma.session.findMany({ where: { ...filter, date: { gte: startOfYear, lte: endOfYear } } });
    const yearData = Array.from({ length: 12 }, (_, m) => {
      const mSessions = yearSessions.filter(s => s.date.getMonth() === m);
      return { month: m, ...this.getSeparatedStats(mSessions) };
    });

    const pySessionsTotal = await prisma.session.findMany({ where: { ...filter, date: { gte: new Date(year - 1, 0, 1), lte: new Date(year - 1, 11, 31, 23, 59, 59) } } });
    const lastYearData = Array.from({ length: 12 }, (_, m) => {
      const mSessions = pySessionsTotal.filter(s => s.date.getMonth() === m);
      return { month: m, ...this.getSeparatedStats(mSessions) };
    });

    return {
      current,
      comparisons: { lastMonth, lastYear },
      yearData,
      history: [{ year, data: yearData }, { year: year - 1, data: lastYearData }],
      professionals: await prisma.professional.findMany({ 
        select: { id: true, name: true },
        orderBy: { name: 'asc' } 
      })
    };
  }
}
