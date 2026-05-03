"use client";

import { useEffect, useState, useMemo } from "react";
import { usePeriod } from "@/context/PeriodContext";
import { TrendingUp, Users, DollarSign, Calendar, Activity, Home, Target, BarChart3, Download } from 'lucide-react';
import { 
  MetricCard, 
  StatusBox, 
  TemporalComparisonGrid 
} from "@/components/DashboardComponents";
import { MetricChart } from "@/components/MetricChart";
import { ReportHeader } from "@/components/ReportHeader";

const monthsNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function Dashboard() {
  const { startMonth, startYear, endMonth, endYear, initialized } = usePeriod();
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('geral');
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (initialized) {
      fetchStats();
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
      const prof = professionals.find((p: any) => p.id === activeTab);
      title = prof ? prof.name.trim().split(' ')[0] : "Profissional";
      color = "#8b5cf6";
    }

    const compLastMonth = comparisons.lastMonth[type] || comparisons.lastMonth;
    const compLastYear = comparisons.lastYear[type] || comparisons.lastYear;
    const ytdData = { 
      current: comparisons.ytdCurrent?.[type] || { grossValue: 0, statusSummary: { finalizado: 0 } }, 
      prev: comparisons.ytdPrevious?.[type] || { grossValue: 0, statusSummary: { finalizado: 0 } } 
    };

    // Cálculos Manuais de Acumulado
    let accSessionsCurrent = 0;
    let accSessionsPrev = 0;
    const currentYearHistory = history.find((h: any) => h.year === startYear);
    const prevYearHistory = history.find((h: any) => h.year === (startYear - 1));

    if (currentYearHistory) {
      for (let i = 0; i <= endMonth; i++) accSessionsCurrent += currentYearHistory.data[i][type]?.statusSummary?.finalizado || 0;
    }
    if (prevYearHistory) {
      for (let i = 0; i <= endMonth; i++) accSessionsPrev += prevYearHistory.data[i][type]?.statusSummary?.finalizado || 0;
    }

    return { 
      data: current[type], 
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
          {/* Seção de Análise Clínica e Assiduidade (Agora com 1 coluna para 100% de largura na tela) */}
          <section className="analysis-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '40px' }}>
            <div className="card">
              <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Assiduidade e Status</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                <StatusBox label="Finalizadas" count={data.statusSummary.finalizado} color="var(--success)" />
                <StatusBox label="Faltas (Pac.)" count={data.statusSummary.faltas} color="var(--danger)" />
                <StatusBox label="Ausência Prof." count={data.statusSummary.ausenciaProf} color="#f59e0b" noBorder />
                <StatusBox label="Justificadas" count={data.statusSummary.ausenciaJust} color="#8b5cf6" noBorder />
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
                          <td style={{ textAlign: 'right' }}>R$ {item.grossValue.toLocaleString('pt-BR')}</td>
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
