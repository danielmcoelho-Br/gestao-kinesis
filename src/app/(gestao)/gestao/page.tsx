"use client";

import { useEffect, useState, useMemo } from "react";
import { usePeriod } from "@/gestao/context/PeriodContext";
import { TrendingUp, Users, DollarSign, Calendar, Activity, Home, Target, BarChart3, Download, X, Send, Sparkles, Loader2, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';
import { 
  MetricCard, 
  StatusBox, 
  TemporalComparisonGrid 
} from "@/gestao/components/DashboardComponents";
import { MetricChart } from "@/gestao/components/MetricChart";
import { ReportHeader } from "@/gestao/components/ReportHeader";
import { DashboardResponse } from "@/gestao/types";
import { ClientStatsService } from "@/gestao/services/clientStatsService";
import { getDischargedDiagnoses, getProfessionalDiagnosticsFrequency, getProfessionalCasesFrequency, getAverageSessionsPerDiagnosis } from "@/app/(lab)/dashboard/actions";

const monthsNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function Dashboard() {
  const { startMonth, startYear, endMonth, endYear, initialized } = usePeriod();
  const [stats, setStats] = useState<DashboardResponse | null>(null);
  const [activeTab, setActiveTab] = useState<string>('geral');
  const [loading, setLoading] = useState(true);

  // Estados para Altas, Frequência de Diagnósticos, Casos e Média de Atendimentos
  const [dischargedDiagnoses, setDischargedDiagnoses] = useState<any[]>([]);
  const [loadingDischarged, setLoadingDischarged] = useState<boolean>(true);
  const [diagnosticsFrequency, setDiagnosticsFrequency] = useState<any[]>([]);
  const [loadingFrequency, setLoadingFrequency] = useState<boolean>(true);
  const [casesFrequency, setCasesFrequency] = useState<any[]>([]);
  const [loadingCases, setLoadingCases] = useState<boolean>(true);
  const [averageSessions, setAverageSessions] = useState<any[]>([]);
  const [loadingAvgSessions, setLoadingAvgSessions] = useState<boolean>(true);

  // Estado para controle de expansão de sanfona por segmento
  const [expandedSegments, setExpandedSegments] = useState<Record<string, boolean>>({});
  const toggleSegment = (key: string) => {
    setExpandedSegments(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Auxiliar para agrupar Frequência por segmento e calcular porcentagem do total
  const groupFrequencyBySegment = (items: any[]) => {
    const groups: Record<string, { total: number; items: any[] }> = {};
    let totalAll = 0;

    for (const item of items) {
      const segName = item.segment || "Outros";
      if (!groups[segName]) {
        groups[segName] = { total: 0, items: [] };
      }
      groups[segName].items.push(item);
      groups[segName].total += item.count;
      totalAll += item.count;
    }

    return Object.entries(groups).map(([segmentName, data]) => {
      const percentage = totalAll > 0 ? (data.total / totalAll) * 100 : 0;
      return {
        segmentName,
        total: data.total,
        percentage: Number(percentage.toFixed(1)),
        items: data.items.map(it => ({
          ...it,
          segmentPercentage: data.total > 0 ? Number(((it.count / data.total) * 100).toFixed(1)) : 0,
          totalPercentage: totalAll > 0 ? Number(((it.count / totalAll) * 100).toFixed(1)) : 0
        })).sort((a, b) => b.count - a.count)
      };
    }).sort((a, b) => b.total - a.total);
  };

  // Auxiliar para agrupar Média de Sessões por segmento (média ponderada) e calcular porcentagem do total de altas
  const groupAverageSessionsBySegment = (items: any[]) => {
    const groups: Record<string, { totalCases: number; totalWeightedSessions: number; items: any[] }> = {};
    let totalCasesAll = 0;

    for (const item of items) {
      const segName = item.segment || "Outros";
      if (!groups[segName]) {
        groups[segName] = { totalCases: 0, totalWeightedSessions: 0, items: [] };
      }
      groups[segName].items.push(item);
      groups[segName].totalCases += item.casesCount;
      groups[segName].totalWeightedSessions += item.averageSessions * item.casesCount;
      totalCasesAll += item.casesCount;
    }

    return Object.entries(groups).map(([segmentName, data]) => {
      const percentage = totalCasesAll > 0 ? (data.totalCases / totalCasesAll) * 100 : 0;
      const weightedAvg = data.totalCases > 0 ? (data.totalWeightedSessions / data.totalCases) : 0;
      return {
        segmentName,
        totalCases: data.totalCases,
        averageSessions: Number(weightedAvg.toFixed(1)),
        percentage: Number(percentage.toFixed(1)),
        items: data.items.map(it => ({
          ...it,
          segmentCasesPercentage: data.totalCases > 0 ? Number(((it.casesCount / data.totalCases) * 100).toFixed(1)) : 0,
          totalCasesPercentage: totalCasesAll > 0 ? Number(((it.casesCount / totalCasesAll) * 100).toFixed(1)) : 0
        })).sort((a, b) => b.casesCount - a.casesCount)
      };
    }).sort((a, b) => b.totalCases - a.totalCases);
  };


  // Busca de dados otimizada
  const fetchStats = async () => {
    if (!initialized) return;
    setLoading(true);
    const isProf = !['geral', 'fisioterapia', 'pilates'].includes(activeTab);
    const profParam = isProf ? `&profId=${activeTab}` : "";
    
    try {
      const url = `/api/stats?startMonth=${startMonth}&startYear=${startYear}&endMonth=${endMonth}&endYear=${endYear}${profParam}`;
      const res = await fetch(url);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Falha ao carregar dados do servidor");
      }
      const data = await res.json();
      setStats(data);
    } catch (e: any) {
      console.error("Erro ao buscar estatísticas", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDischargedAndFrequency = async (profId: string) => {
    setLoadingDischarged(true);
    setLoadingFrequency(true);
    setLoadingCases(true);
    setLoadingAvgSessions(true);
    
    try {
      const resultDischarged = await getDischargedDiagnoses(profId, startMonth, startYear, endMonth, endYear);
      if (resultDischarged.success) {
        setDischargedDiagnoses(resultDischarged.data || []);
      }
    } catch (err) {
      console.error("Erro ao buscar altas na gestão:", err);
    } finally {
      setLoadingDischarged(false);
    }

    try {
      const resultFrequency = await getProfessionalDiagnosticsFrequency(profId, startMonth, startYear, endMonth, endYear);
      if (resultFrequency.success) {
        setDiagnosticsFrequency(resultFrequency.data || []);
      }
    } catch (err) {
      console.error("Erro ao buscar frequências na gestão:", err);
    } finally {
      setLoadingFrequency(false);
    }

    try {
      const resultCases = await getProfessionalCasesFrequency(profId, startMonth, startYear, endMonth, endYear);
      if (resultCases.success) {
        setCasesFrequency(resultCases.data || []);
      }
    } catch (err) {
      console.error("Erro ao buscar frequência de casos na gestão:", err);
    } finally {
      setLoadingCases(false);
    }

    try {
      const resultAvg = await getAverageSessionsPerDiagnosis(profId, startMonth, startYear, endMonth, endYear);
      if (resultAvg.success) {
        setAverageSessions(resultAvg.data || []);
      }
    } catch (err) {
      console.error("Erro ao buscar média de sessões na gestão:", err);
    } finally {
      setLoadingAvgSessions(false);
    }
  };

  useEffect(() => {
    if (initialized) {
      fetchStats();
      const profId = !['geral', 'fisioterapia', 'pilates'].includes(activeTab) ? activeTab : "all";
      fetchDischargedAndFrequency(profId);
    }
  }, [startMonth, startYear, endMonth, endYear, activeTab, initialized]);

  // Cálculo de dados para exibição (Memoizado para performance)
  const displayContext = useMemo(() => {
    if (!stats) return null;
    const { current, comparisons, history, professionals } = stats;
    const type = activeTab === 'geral' || !['fisioterapia', 'pilates'].includes(activeTab) ? 'consolidated' : activeTab;
    
    let title = "Visão Geral";
    let color = "var(--primary)";
    if (activeTab === 'fisioterapia') { title = "Fisioterapia"; color = "#3b82f6"; }
    else if (activeTab === 'pilates') { title = "Pilates"; color = "#10b981"; }
    else if (!['geral', 'fisioterapia', 'pilates'].includes(activeTab)) {
      const prof = professionals.find((p) => p.id === activeTab);
      title = prof ? prof.name.trim().split(' ')[0] : "Profissional";
      color = "#8b5cf6";
    }

    const compLastMonth = (comparisons.lastMonth as any)[type] || comparisons.lastMonth;
    const compLastYear = (comparisons.lastYear as any)[type] || comparisons.lastYear;
    const ytdData = { 
      current: (comparisons.ytdCurrent as any)?.[type] || { grossValue: 0, statusSummary: { finalizado: 0 } }, 
      prev: (comparisons.ytdPrevious as any)?.[type] || { grossValue: 0, statusSummary: { finalizado: 0 } } 
    };

    // Cálculos Manuais de Acumulado via Service
    const accSessionsCurrent = ClientStatsService.calculateAccumulatedSessions(history, startYear, endMonth, type);
    const accSessionsPrev = ClientStatsService.calculateAccumulatedSessions(history, startYear - 1, endMonth, type);

    return { 
      data: (current as any)[type], 
      title, color, type, 
      compLastMonth, compLastYear, 
      ytd: ytdData, accSessionsCurrent, accSessionsPrev,
      history, professionals
    };
  }, [stats, activeTab, startMonth, startYear, endMonth, endYear]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '20px' }}>
      <div className="loader"></div>
      <p style={{ color: 'var(--text-secondary)', animation: 'pulse 1.5s infinite' }}>Sincronizando dados da clínica...</p>
    </div>
  );

  if (!displayContext) return null;

  const { data, title, color, type, compLastMonth, compLastYear, ytd, accSessionsCurrent, accSessionsPrev, history, professionals } = displayContext;

  return (
    <div className="dashboard-container" style={{ paddingBottom: '60px' }}>
      <ReportHeader title={`Dashboard - ${title}`} />
      
      {/* Navegação de Abas */}
      <nav className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
        <div className="tab-buttons-container" style={{ display: 'flex', gap: '12px', padding: '4px', background: 'rgba(0,0,0,0.02)', borderRadius: '16px', width: 'fit-content' }}>
          <TabButton active={activeTab === 'geral'} onClick={() => setActiveTab('geral')} icon={<Home size={20} />} label="Visão Geral" isPrimary />
          <TabButton active={activeTab === 'fisioterapia'} onClick={() => setActiveTab('fisioterapia')} icon={<Activity size={20} />} label="Fisioterapia" isPrimary />
          <TabButton active={activeTab === 'pilates'} onClick={() => setActiveTab('pilates')} icon={<Target size={20} />} label="Pilates" isPrimary />
        </div>
        <div className="prof-selector-container" style={{ display: 'flex', gap: '8px', padding: '4px', overflowX: 'auto', whiteSpace: 'nowrap', scrollbarWidth: 'none' }}>
          <span style={{ alignSelf: 'center', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-secondary)', marginRight: '8px' }}>Equipe:</span>
          {professionals.map((p: any) => (
            <TabButton key={p.id} active={activeTab === p.id} onClick={() => setActiveTab(p.id)} icon={<Users size={16} />} label={p.name.trim().split(' ')[0]} />
          ))}
        </div>
      </nav>

      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: '800', letterSpacing: '-1px', margin: 0 }}>
            {title} <span style={{ color, opacity: 0.6 }}>/ {monthsNames[startMonth]} {startYear} { (startMonth !== endMonth || startYear !== endYear) && `até ${monthsNames[endMonth]} ${endYear}` }</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>KinesisLab - Clinical & Financial Intelligence</p>
        </div>
        <button 
          onClick={() => window.print()} 
          className="btn no-print" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--primary)', color: 'white', borderRadius: '12px', padding: '12px 20px' }}
        >
          <Download size={20} /> Exportar Relatório
        </button>
      </header>

      <AICopilotSection activeTab={activeTab} startMonth={startMonth} startYear={startYear} endMonth={endMonth} endYear={endYear} />

      <div className="report-body" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Grid de Métricas Principais (No Dashboard aparece PRIMEIRO) */}
        <section className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <DashboardMetricCard title="Sessões Finalizadas" value={data.statusSummary.finalizado} icon={<Calendar />} color={color} history={history} dataKey="statusSummary.finalizado" type={type} />
          <DashboardMetricCard title="Qtd. Pacientes" value={data.uniquePatientsCount} icon={<Users />} color="#6366f1" history={history} dataKey="uniquePatientsCount" type={type} />
          <DashboardMetricCard title="Arrecadação Bruta" value={data.grossValue} icon={<DollarSign />} color="#10b981" isCurrency history={history} dataKey="grossValue" type={type} />
          <DashboardMetricCard title="Porcentagem da Clínica" value={data.clinicProfit} icon={<TrendingUp />} color="#8b5cf6" isCurrency history={history} dataKey="clinicProfit" type={type} />
          <DashboardMetricCard title="Faltas (Pacientes)" value={data.statusSummary.faltas} icon={<Activity />} color="#ef4444" history={history} dataKey="statusSummary.faltas" type={type} />
          <DashboardMetricCard title="Ticket Médio" value={data.ticketAverage || 0} icon={<Activity />} color="#f59e0b" isCurrency history={history} dataKey="ticketAverage" type={type} />
          <DashboardMetricCard title="Média Sessões / Pac." value={Number((data.avgSessionsPerPatient || 0).toFixed(1))} icon={<Activity />} color="#06b6d4" history={history} dataKey="avgSessionsPerPatient" type={type} isDecimal />
          <DashboardMetricCard title="Atendimentos no Ano" value={accSessionsCurrent} icon={<BarChart3 />} color="#ec4899" history={history} dataKey="statusSummary.finalizado" type={type} isAccumulated />
        </section>

        {/* CONTAINER DE RESUMO (No Dashboard aparece DEPOIS das métricas) */}
        <div className="summary-row" style={{ display: 'contents' }}>
          {/* Seção de Análise Clínica e Assiduidade */}
          <section className="analysis-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '40px' }}>
            <div className="card">
              <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Assiduidade e Status</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                {ClientStatsService.getAttendanceStatusSummary(data).map((status, i) => (
                  <StatusBox key={i} label={status.label} count={status.count} color={status.color} />
                ))}
              </div>
            </div>
            
            {data.stratification?.length > 0 && (
              <div className="card stratification-section">
                <h3 style={{ marginBottom: '20px' }}>Detalhamento de Serviços</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Categoria</th>
                        <th style={{ textAlign: 'center' }}>Qtd.</th>
                        <th style={{ textAlign: 'right' }}>Bruto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.stratification.slice(0, 5).map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: '600' }}>{item.name}</td>
                          <td style={{ textAlign: 'center' }}>{item.count}</td>
                          <td style={{ textAlign: 'right' }}>R$ {item.grossValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* Seção de Comparativo Temporal */}
          <section className="card comparison-section" style={{ marginBottom: '40px' }}>
            <h3 style={{ marginBottom: '24px', fontSize: '1.1rem' }}>Comparativo Temporal</h3>
            <TemporalComparisonGrid data={data} compLastMonth={compLastMonth} compLastYear={compLastYear} ytd={ytd} accSessionsCurrent={accSessionsCurrent} accSessionsPrev={accSessionsPrev} />
          </section>
        </div>
      </div>

      {/* Histórico de Altas e Frequência de Diagnósticos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '40px' }} className="no-print">
        
        {/* Grid de Colunas para Frequências e Média (50% de largura cada) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          
          {/* Frequência de Diagnósticos */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '350px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Activity style={{ color: 'var(--primary)' }} size={22} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Frequência de Diagnósticos (Mes)</h3>
            </div>
            
            {loadingFrequency ? (
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Loader2 className="animate-spin" style={{ color: 'var(--primary)' }} size={24} />
              </div>
            ) : diagnosticsFrequency.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>
                  Nenhum diagnóstico novo registrado para este profissional no período.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '250px', paddingRight: '4px' }}>
                {groupFrequencyBySegment(diagnosticsFrequency).map((group, gIdx) => {
                  const isExpanded = !!expandedSegments[`diag-${group.segmentName}`];
                  return (
                    <div key={`g-diag-${gIdx}`} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div 
                        onClick={() => toggleSegment(`diag-${group.segmentName}`)}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          padding: '0.75rem 1rem', 
                          background: 'linear-gradient(135deg, #fef2f2 0%, #fff 100%)', 
                          borderRadius: '12px', 
                          border: '1px solid #fee2e2',
                          cursor: 'pointer',
                          userSelect: 'none',
                          transition: 'all 0.2s ease',
                          fontWeight: '700',
                          color: '#9d1d1d',
                          fontSize: '0.875rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          <span>{group.segmentName}</span>
                        </div>
                        <span style={{ fontWeight: '800', background: '#A31621', color: 'white', borderRadius: '10px', padding: '2px 8px', fontSize: '0.725rem' }}>
                          {group.total} {group.total === 1 ? 'caso' : 'casos'} ({group.percentage}%)
                        </span>
                      </div>
                      
                      {isExpanded && (
                        <div style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px', borderLeft: '1.5px dotted #fee2e2', marginLeft: '20px' }}>
                          {group.items.map((item, idx) => (
                            <div 
                              key={`g-diag-item-${idx}`} 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between', 
                                padding: '4px 8px',
                                fontSize: '0.8rem',
                                color: 'var(--text-secondary)'
                              }}
                            >
                              <span>• {item.diagnosis}</span>
                              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                {item.count} {item.count === 1 ? 'caso' : 'casos'} ({item.segmentPercentage}% no segmento / {item.totalPercentage}% no total)
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Frequência de Casos */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '350px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Users style={{ color: '#8b5cf6' }} size={22} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Frequência de Casos (Mes)</h3>
            </div>
            
            {loadingCases ? (
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Loader2 className="animate-spin" style={{ color: '#8b5cf6' }} size={24} />
              </div>
            ) : casesFrequency.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>
                  Nenhum caso ativo registrado para este profissional no período.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '250px', paddingRight: '4px' }}>
                {groupFrequencyBySegment(casesFrequency).map((group, gIdx) => {
                  const isExpanded = !!expandedSegments[`cases-${group.segmentName}`];
                  return (
                    <div key={`g-cases-${gIdx}`} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div 
                        onClick={() => toggleSegment(`cases-${group.segmentName}`)}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          padding: '0.75rem 1rem', 
                          background: 'linear-gradient(135deg, #f5f3ff 0%, #fff 100%)', 
                          borderRadius: '12px', 
                          border: '1px solid #e0e7ff',
                          cursor: 'pointer',
                          userSelect: 'none',
                          transition: 'all 0.2s ease',
                          fontWeight: '700',
                          color: '#5b21b6',
                          fontSize: '0.875rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          <span>{group.segmentName}</span>
                        </div>
                        <span style={{ fontWeight: '800', background: '#6d28d9', color: 'white', borderRadius: '10px', padding: '2px 8px', fontSize: '0.725rem' }}>
                          {group.total} {group.total === 1 ? 'caso' : 'casos'} ({group.percentage}%)
                        </span>
                      </div>
                      
                      {isExpanded && (
                        <div style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px', borderLeft: '1.5px dotted #e0e7ff', marginLeft: '20px' }}>
                          {group.items.map((item, idx) => (
                            <div 
                              key={`g-cases-item-${idx}`} 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between', 
                                padding: '4px 8px',
                                fontSize: '0.8rem',
                                color: 'var(--text-secondary)'
                              }}
                            >
                              <span>• {item.diagnosis}</span>
                              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                {item.count} {item.count === 1 ? 'caso' : 'casos'} ({item.segmentPercentage}% no segmento / {item.totalPercentage}% no total)
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Média de Atendimentos por Diagnóstico */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '350px', gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <TrendingUp style={{ color: '#10b981' }} size={22} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Média de Atendimentos por Diagnóstico (Todo período)</h3>
            </div>
            
            {loadingAvgSessions ? (
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Loader2 className="animate-spin" style={{ color: '#10b981' }} size={24} />
              </div>
            ) : averageSessions.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>
                  Nenhuma média calculada (sem altas concluídas) no período.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '250px', paddingRight: '4px' }}>
                {groupAverageSessionsBySegment(averageSessions).map((group, gIdx) => {
                  const isExpanded = !!expandedSegments[`avg-${group.segmentName}`];
                  return (
                    <div key={`g-avg-${gIdx}`} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div 
                        onClick={() => toggleSegment(`avg-${group.segmentName}`)}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          padding: '0.75rem 1rem', 
                          background: 'linear-gradient(135deg, #ecfdf5 0%, #fff 100%)', 
                          borderRadius: '12px', 
                          border: '1px solid #d1fae5',
                          cursor: 'pointer',
                          userSelect: 'none',
                          transition: 'all 0.2s ease',
                          fontWeight: '700',
                          color: '#065f46',
                          fontSize: '0.875rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          <span>{group.segmentName}</span>
                        </div>
                        <span style={{ fontWeight: '800', background: '#059669', color: 'white', borderRadius: '10px', padding: '2px 8px', fontSize: '0.725rem' }}>
                          Média: {group.averageSessions} {group.averageSessions === 1 ? 'sessão' : 'sessões'} ({group.totalCases} {group.totalCases === 1 ? 'alta' : 'altas'} - {group.percentage}%)
                        </span>
                      </div>
                      
                      {isExpanded && (
                        <div style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px', borderLeft: '1.5px dotted #d1fae5', marginLeft: '20px' }}>
                          {group.items.map((item, idx) => (
                            <div 
                              key={`g-avg-item-${idx}`} 
                              style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '2px',
                                padding: '4px 8px',
                                fontSize: '0.8rem',
                                color: 'var(--text-secondary)'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span>• {item.diagnosis}</span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                  ({item.casesCount} {item.casesCount === 1 ? 'alta' : 'altas'} - {item.segmentCasesPercentage}% no segmento / {item.totalCasesPercentage}% no total)
                                </span>
                              </div>
                              <div style={{ paddingLeft: '8px' }}>
                                <span style={{ background: '#f0fdf4', color: '#166534', fontWeight: '700', borderRadius: '6px', padding: '1px 6px', fontSize: '0.725rem', border: '1px solid #bbf7d0' }}>
                                  {item.averageSessions} {item.averageSessions === 1 ? 'sessão/alta' : 'sessões/alta'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Altas Realizadas */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <CheckCircle2 style={{ color: '#10b981' }} size={24} />
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>Altas Realizadas (Mes)</h3>
          </div>
          
          {loadingDischarged ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Loader2 className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto' }} size={24} />
              <p style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>Carregando histórico de altas...</p>
            </div>
          ) : dischargedDiagnoses.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
              Nenhuma alta clínica registrada para este profissional no período selecionado.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Segmento</th>
                    <th>Diagnóstico</th>
                    <th>Data de Início</th>
                    <th>Data de Alta</th>
                    <th style={{ textAlign: 'center' }}>Sessões</th>
                  </tr>
                </thead>
                <tbody>
                  {dischargedDiagnoses.map((diag) => (
                    <tr key={diag.id}>
                      <td style={{ fontWeight: '600' }}>{diag.patientName}</td>
                      <td>
                        <span style={{ padding: '2px 8px', borderRadius: '8px', background: 'rgba(0,0,0,0.04)', color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.75rem' }}>
                          {diag.segment}
                        </span>
                      </td>
                      <td style={{ fontWeight: '600' }}>{diag.diagnosis}</td>
                      <td>{new Date(diag.startDate).toLocaleDateString('pt-BR')}</td>
                      <td style={{ fontWeight: '600' }}>
                        {diag.dischargeDate ? new Date(diag.dischargeDate).toLocaleDateString('pt-BR') : 'N/A'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ background: '#eff6ff', color: '#1e40af', fontWeight: '800', borderRadius: '8px', padding: '2px 8px', fontSize: '0.75rem', border: '1px solid #bfdbfe' }}>
                          {diag.sessionCount} {diag.sessionCount === 1 ? 'sessão' : 'sessões'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// Sub-componentes internos para limpeza do arquivo
function TabButton({ active, onClick, icon, label, isPrimary }: any) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: isPrimary ? '12px 24px' : '8px 16px', borderRadius: '12px', border: 'none', background: active ? 'white' : 'transparent', color: active ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: active ? '700' : '500', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: active ? '0 4px 12px rgba(0,0,0,0.08)' : 'none', fontSize: isPrimary ? '0.95rem' : '0.85rem', flexShrink: 0 }}>
      <span style={{ display: 'flex', color: active ? 'var(--primary)' : 'inherit', opacity: active ? 1 : 0.7 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function DashboardMetricCard({ title, value, icon, color, history, dataKey, type, isCurrency, isDecimal, isAccumulated }: any) {
  return (
    <MetricCard title={title} value={value} icon={icon} color={color} isCurrency={isCurrency}>
      <MetricChart history={history} dataKey={dataKey} type={type} isCurrency={isCurrency} isDecimal={isDecimal} isAccumulated={isAccumulated} />
    </MetricCard>
  );
}

function AICopilotSection({ activeTab, startMonth, startYear, endMonth, endYear }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [customInstructions, setCustomInstructions] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchInstructions = async () => {
      try {
        const res = await fetch("/api/gestao/copilot");
        if (res.ok) {
          const data = await res.json();
          setCustomInstructions(data.instructions || "");
        }
      } catch (e) {
        console.error("Erro ao carregar diretrizes:", e);
      }
    };
    fetchInstructions();
  }, []);

  const handleSaveInstructions = async () => {
    setSavingSettings(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/gestao/copilot", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions: customInstructions })
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const data = await res.json();
        throw new Error(data.error || "Erro ao salvar as diretrizes.");
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Não foi possível salvar as diretrizes.");
    } finally {
      setSavingSettings(false);
    }
  };

  const suggestions = [
    { label: "🔍 Assiduidade vs Dor", query: "Analise a correlação entre o número de faltas dos pacientes e os níveis de dor relatados nos diários no período selecionado, listando casos que precisam de atenção." },
    { label: "💰 Insights Financeiros", query: "Analise os dados de faturamento e repasse deste período. Aponte quais profissionais ou serviços (Fisioterapia vs Pilates) estão com melhor desempenho e dê recomendações de otimização de lucro." },
    { label: "📈 Diagnóstico do Mês", query: "Gere um relatório mensal resumido com os principais pontos fortes clínicos/financeiros observados e 3 sugestões de melhorias na gestão da clínica." }
  ];

  const handleAsk = async (userPrompt: string) => {
    if (!userPrompt.trim()) return;
    setLoading(true);
    setError("");
    setResponse("");
    try {
      const res = await fetch("/api/gestao/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userPrompt,
          activeTab,
          startMonth,
          startYear,
          endMonth,
          endYear
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao consultar o Copilot.");
      }
      setResponse(data.text);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Erro na comunicação com a IA.");
    } finally {
      setLoading(false);
    }
  };

  const formattedResponse = useMemo(() => {
    if (!response) return "";
    let html = response
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/`([^`]+)`/g, "<code style='background: rgba(0,0,0,0.05); padding: 2px 6px; border-radius: 4px; font-family: monospace;'>$1</code>");

    const lines = html.split('\n');
    let inList = false;
    let inTable = false;
    
    const formattedLines = lines.map(line => {
      const trimmed = line.trim();
      
      // Table parser
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        if (/^[|\s-]+$/.test(trimmed)) {
          return '';
        }
        const cells = trimmed.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
        let prefix = '';
        if (!inTable) {
          prefix = '<div style="overflow-x:auto; margin: 16px 0;"><table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.8rem; border: 1px solid rgba(0,0,0,0.06); border-radius: 8px;">';
          inTable = true;
          const headerCells = cells.map(c => `<th style="padding:10px; border-bottom:2px solid rgba(0,0,0,0.08); background: rgba(0,0,0,0.02); font-weight:700;">${c}</th>`).join('');
          return `${prefix}<thead><tr>${headerCells}</tr></thead><tbody>`;
        }
        const rowCells = cells.map(c => `<td style="padding:10px; border-bottom:1px solid rgba(0,0,0,0.06);">${c}</td>`).join('');
        return `<tr>${rowCells}</tr>`;
      } else {
        let suffix = '';
        if (inTable) {
          suffix = '</tbody></table></div>';
          inTable = false;
        }
        
        // Bullet list parser
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const content = trimmed.substring(2);
          let prefixList = '';
          if (!inList) {
            prefixList = '<ul style="margin: 8px 0; padding-left: 20px; list-style-type: disc;">';
            inList = true;
          }
          return `${suffix}${prefixList}<li style="margin: 6px 0;">${content}</li>`;
        } else {
          let suffixList = '';
          if (inList) {
            suffixList = '</ul>';
            inList = false;
          }
          return `${suffix}${suffixList}${line}`;
        }
      }
    });

    if (inTable) formattedLines.push('</tbody></table></div>');
    if (inList) formattedLines.push('</ul>');

    return formattedLines.filter(line => line !== '').join('<br />')
      .replace(/<\/ul><br \/>/g, "</ul>")
      .replace(/<br \/><ul/g, "<ul")
      .replace(/<\/div><br \/>/g, "</div>")
      .replace(/<br \/><div/g, "<div");
  }, [response]);

  return (
    <>
      {/* Botão Flutuante do Copilot */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Sparkles size={24} />
      </button>

      {/* Drawer do Copilot */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            width: '100%',
            maxWidth: '460px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-10px 0 25px -5px rgba(0, 0, 0, 0.1)',
            borderLeft: '1px solid #cbd5e1'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #f8fafc 0%, #f5f3ff 100%)'
            }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <TrendingUp size={18} style={{ transform: 'rotate(45deg)', color: '#8b5cf6' }} />
                  Kinesis AI Copilot
                </h3>
                <p style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', margin: '2px 0 0 0' }}>Inteligência Analítica Integrada</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px', fontSize: '1.1rem' }}
                  title="Ajustar Diretrizes"
                >
                  ⚙️
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              backgroundColor: '#f8fafc'
            }}>
              {/* Settings Area if open */}
              {isSettingsOpen && (
                <div style={{
                  background: '#ffffff',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#4c1d95' }}>Diretrizes Personalizadas</span>
                  <textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="Regras adicionais para o Copilot..."
                    style={{
                      width: '100%',
                      height: '80px',
                      padding: '8px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.75rem',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {saveSuccess && <span style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: '700' }}>Salvo!</span>}
                    <button
                      onClick={handleSaveInstructions}
                      disabled={savingSettings}
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      {savingSettings ? "Salvando..." : "Salvar"}
                    </button>
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {!response && !loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Perguntas Sugeridas:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setPrompt(s.query);
                          handleAsk(s.query);
                        }}
                        style={{
                          background: '#eff6ff',
                          color: '#1e40af',
                          border: '1px solid #bfdbfe',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Response/Loading Area */}
              {(response || loading || error) && (
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8rem',
                  lineHeight: '1.6',
                  color: '#1e293b'
                }}>
                  {loading && (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', color: '#64748b' }}>
                      <Loader2 className="animate-spin" size={14} />
                      <span>Analisando banco de dados clínico...</span>
                    </div>
                  )}
                  {error && <span style={{ color: '#ef4444' }}>⚠️ {error}</span>}
                  {response && (
                    <div 
                      style={{ whiteSpace: 'pre-wrap' }}
                      dangerouslySetInnerHTML={{ __html: formattedResponse }} 
                    />
                  )}
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleAsk(prompt); }} style={{
              padding: '16px 20px',
              borderTop: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              display: 'flex',
              gap: '10px',
              alignItems: 'center'
            }}>
              <input 
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Pergunte sobre assiduidade, dor, repasses..."
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  outline: 'none',
                  background: '#f8fafc'
                }}
              />
              <button 
                type="submit"
                disabled={loading || !prompt.trim()}
                style={{
                  backgroundColor: prompt.trim() && !loading ? '#8b5cf6' : '#cbd5e1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  cursor: prompt.trim() && !loading ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
