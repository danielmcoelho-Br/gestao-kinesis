// Tipos fundamentais para o sistema Kinesis

export interface Patient {
  name: string;
  phone?: string;
  email?: string;
  profession?: string;
  provenance?: string;
  birthDate?: string;
  gender?: string;
}

export interface Session {
  id: string;
  patientName: string;
  date: string;
  status: 'finalizado' | 'falta' | 'ausencia_prof' | 'justificada';
  value: number;
  category: string;
}

export interface GenderSummary {
  count: number;
  avgAge: number;
}

export interface StratifiedAgeRow {
  label: string;
  men: number;
  women: number;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
}

export interface PatientProfileStats {
  totalAttended: number;
  withProfile: number;
  missingProfile: number;
  summary: {
    female: GenderSummary;
    male: GenderSummary;
    totalAvgAge: number;
  };
  stratifiedAgeData: StratifiedAgeRow[];
  allProfessions: [string, number][];
  allProvenance: [string, number][];
  heatmapData?: HeatmapPoint[];
}

export interface PatientProfileResponse {
  stats: PatientProfileStats;
  patients: Patient[];
}

export interface ServiceStratification {
  name: string;
  count: number;
  grossValue: number;
}

export interface StatusSummary {
  finalizado: number;
  faltas: number;
  ausenciaProf: number;
  ausenciaJust: number;
}

export interface DashboardStats {
  statusSummary: StatusSummary;
  uniquePatientsCount: number;
  grossValue: number;
  clinicProfit: number;
  ticketAverage: number;
  avgSessionsPerPatient: number;
  stratification: ServiceStratification[];
}

export interface ComparisonValue {
  consolidated: DashboardStats;
  fisioterapia: DashboardStats;
  pilates: DashboardStats;
}

export interface DashboardResponse {
  current: ComparisonValue;
  comparisons: {
    lastMonth: ComparisonValue;
    lastYear: ComparisonValue;
    ytdCurrent: ComparisonValue;
    ytdPrevious: ComparisonValue;
  };
  history: any[]; // History is complex, leaving any for now or defining if needed
  professionals: { id: string, name: string }[];
}
