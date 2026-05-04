import { DashboardStats, StratifiedAgeRow } from "@/types";

/**
 * Serviço de utilidades para o lado do cliente (Frontend).
 * Contém lógica de formatação e cálculos simples que não dependem do banco de dados.
 */
export const ClientStatsService = {
  
  /**
   * Formata os dados de estratificação etária para o formato esperado pelo Recharts.
   */
  formatAgeChartData(stratifiedAgeData: StratifiedAgeRow[], totalWithProfile: number) {
    return stratifiedAgeData.map((d) => ({
      name: d.label,
      men: d.men,
      women: d.women,
      value: d.men + d.women,
      pct: totalWithProfile > 0 ? (((d.men + d.women) / totalWithProfile) * 100).toFixed(1) : 0
    })).reverse();
  },

  /**
   * Calcula o ticket médio de faturamento por paciente.
   */
  calculateTicketAverage(grossValue: number, uniquePatients: number): number {
    if (uniquePatients === 0) return 0;
    return grossValue / uniquePatients;
  },

  /**
   * Consolida resumos de status (finalizadas, faltas, etc) para exibição.
   */
  getAttendanceStatusSummary(stats: DashboardStats) {
    const { statusSummary } = stats;
    return [
      { label: "Finalizadas", count: statusSummary.finalizado, color: "var(--success)" },
      { label: "Faltas (Pac.)", count: statusSummary.faltas, color: "var(--danger)" },
      { label: "Ausência Prof.", count: statusSummary.ausenciaProf, color: "#f59e0b" },
      { label: "Justificadas", count: statusSummary.ausenciaJust, color: "#8b5cf6" }
    ];
  },

  /**
   * Calcula o total acumulado de sessões finalizadas para um determinado período no histórico.
   */
  calculateAccumulatedSessions(history: any[], year: number, endMonth: number, type: string) {
    let total = 0;
    const yearData = history.find((h) => h.year === year);
    if (yearData) {
      for (let i = 0; i <= endMonth; i++) {
        total += yearData.data[i][type]?.statusSummary?.finalizado || 0;
      }
    }
    return total;
  }
};
