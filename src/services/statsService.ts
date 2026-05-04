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

        if (isFinalizado) {
          statusSummary.finalizado++;
          finalizedGross += s.value;
          
          if (s.patientName) uniquePatients.add(s.patientName.trim().toLowerCase());

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

  static async getDashboardData(
    startMonth: number, 
    startYear: number, 
    endMonth: number = startMonth, 
    endYear: number = startYear, 
    professionalId: string | null = null
  ) {
    const startDate = new Date(startYear, startMonth, 1);
    const endDate = new Date(endYear, endMonth + 1, 0, 23, 59, 59);
    
    const profFilter = professionalId ? { professionalId } : {};

    // 1. Current Period (Range)
    const currentSessions = await prisma.session.findMany({ 
      where: { ...profFilter, date: { gte: startDate, lte: endDate } } 
    });
    const current = this.getSeparatedStats(currentSessions);

    // 2. Comparisons (Prev Month and Same Month Last Year - BASED ON START OF RANGE)
    const prevMonthDate = new Date(startYear, startMonth - 1, 1);
    const pmSessions = await prisma.session.findMany({ 
      where: { ...profFilter, date: { gte: new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), 1), lte: new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, 0, 23, 59, 59) } } 
    });
    const lastMonth = this.getSeparatedStats(pmSessions);

    const pySessions = await prisma.session.findMany({ 
      where: { ...profFilter, date: { gte: new Date(startYear - 1, startMonth, 1), lte: new Date(startYear - 1, startMonth + 1, 0, 23, 59, 59) } } 
    });
    const lastYear = this.getSeparatedStats(pySessions);

    // 3. FETCH ALL AVAILABLE YEARS
    const sessionYears = await prisma.session.groupBy({
      by: ['date'],
      _count: true,
    });
    const availableYears = Array.from(new Set(sessionYears.map(s => s.date.getFullYear()))).sort((a, b) => b - a);

    const history = await Promise.all(availableYears.map(async (y) => {
      const yearSessions = await prisma.session.findMany({ 
        where: { 
          ...profFilter, 
          date: { gte: new Date(y, 0, 1), lte: new Date(y, 11, 31, 23, 59, 59) } 
        } 
      });

      const data = Array.from({ length: 12 }, (_, m) => {
        const mSessions = yearSessions.filter(s => s.date.getMonth() === m);
        return { month: m, ...this.getSeparatedStats(mSessions) };
      });

      return { year: y, data };
    }));

    // 4. Calculate YTD (Year To Date)
    const calculateYTD = (historyData: any[], targetMonth: number) => {
      const ytdData = historyData.filter(h => h.month <= targetMonth);
      const result: any = {};
      ytdData.forEach(monthObj => {
        Object.keys(monthObj).forEach(key => {
          if (key === 'month') return;
          if (!result[key]) result[key] = { grossValue: 0 };
          result[key].grossValue += monthObj[key].grossValue || 0;
        });
      });
      return result;
    };

    const currentYearData = history.find(h => h.year === startYear)?.data || [];
    const lastYearHistory = history.find(h => h.year === startYear - 1)?.data || [];
    
    const ytdCurrent = calculateYTD(currentYearData, endMonth);
    const ytdPrevious = calculateYTD(lastYearHistory, endMonth);

    return {
      current: current || this.getSeparatedStats([]),
      comparisons: { 
        lastMonth: lastMonth || this.getSeparatedStats([]), 
        lastYear: lastYear || this.getSeparatedStats([]),
        ytdCurrent,
        ytdPrevious
      },
      yearData: currentYearData.length > 0 ? currentYearData : Array.from({ length: 12 }, (_, m) => ({ month: m, ...this.getSeparatedStats([]) })),
      history,
      professionals: await prisma.professional.findMany({ 
        select: { id: true, name: true },
        orderBy: { name: 'asc' } 
      })
    };
  }
}
