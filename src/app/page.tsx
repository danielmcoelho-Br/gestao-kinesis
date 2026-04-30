"use client";

import { useEffect, useState } from "react";
import { usePeriod } from "@/context/PeriodContext";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, Users, DollarSign, Calendar, Activity, Home, Heart, Target } from 'lucide-react';
import { MetricCard, ComparisonItem, StatusBox } from "@/components/DashboardComponents";

const monthsNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function Dashboard() {
  const { month, year } = usePeriod();
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('geral'); // 'geral', 'fisioterapia', 'pilates', or professionalId
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    // Para profissionais, passamos o profId. Para as abas fixas, pegamos o geral e filtramos no front ou passamos flag.
    // Mas nossa API já retorna tudo separado. Se for um profissional, a API retorna o filtrado para ele.
    const isProf = !['geral', 'fisioterapia', 'pilates'].includes(activeTab);
    const profParam = isProf ? `&profId=${activeTab}` : "";
    
    try {
      const res = await fetch(`/api/stats?month=${month}&year=${year}${profParam}`);
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error("Erro ao buscar estatísticas", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [month, year, activeTab]);

  if (loading || !stats) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '20px' }}>
      <div className="loader"></div>
      <p style={{ color: 'var(--text-secondary)', animation: 'pulse 1.5s infinite' }}>Sincronizando dados da clínica...</p>
    </div>
  );

  const { current, comparisons, yearData, history, professionals } = stats;

  // Determinar qual "bloco" de dados exibir baseado na aba
  let displayData = current.consolidated;
  let displayTitle = "Visão Geral";
  let displayColor = "var(--primary)";
  let displayComparison = comparisons;
  let showStratification = true;

  if (activeTab === 'fisioterapia') {
    displayData = current.fisioterapia;
    displayTitle = "Fisioterapia";
    displayColor = "#3b82f6";
    displayComparison = { lastMonth: comparisons.lastMonth.fisioterapia, lastYear: comparisons.lastYear.fisioterapia };
  } else if (activeTab === 'pilates') {
    displayData = current.pilates;
    displayTitle = "Pilates";
    displayColor = "#10b981";
    displayComparison = { lastMonth: comparisons.lastMonth.pilates, lastYear: comparisons.lastYear.pilates };
  } else if (!['geral', 'fisioterapia', 'pilates'].includes(activeTab)) {
    const prof = professionals.find((p: any) => p.id === activeTab);
    displayTitle = prof ? prof.name.trim().split(' ')[0] : "Profissional";
    displayColor = "#8b5cf6";
    showStratification = true;
  }

  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* NAVEGAÇÃO EM DUAS LINHAS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
        {/* Linha 1: Grandes Pilares */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          padding: '4px', 
          background: 'rgba(0,0,0,0.02)', 
          borderRadius: '16px',
          width: 'fit-content'
        }}>
          <TabButton active={activeTab === 'geral'} onClick={() => setActiveTab('geral')} icon={<Home size={20} />} label="Visão Geral" isPrimary />
          <TabButton active={activeTab === 'fisioterapia'} onClick={() => setActiveTab('fisioterapia')} icon={<Activity size={20} />} label="Fisioterapia" isPrimary />
          <TabButton active={activeTab === 'pilates'} onClick={() => setActiveTab('pilates')} icon={<Target size={20} />} label="Pilates" isPrimary />
        </div>

        {/* Linha 2: Equipe */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          padding: '4px', 
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          scrollbarWidth: 'none'
        }}>
          <span style={{ 
            alignSelf: 'center', 
            fontSize: '0.75rem', 
            fontWeight: 'bold', 
            textTransform: 'uppercase', 
            color: 'var(--text-secondary)', 
            marginRight: '8px',
            letterSpacing: '1px'
          }}>Equipe:</span>
          {professionals.map((p: any) => (
            <TabButton 
              key={p.id} 
              active={activeTab === p.id} 
              onClick={() => setActiveTab(p.id)} 
              icon={<Users size={16} />} 
              label={p.name.trim().split(' ')[0]} 
            />
          ))}
        </div>
      </div>

      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.4rem', fontWeight: '800', letterSpacing: '-1px' }}>
          {displayTitle} <span style={{ color: displayColor, opacity: 0.6 }}>/ {monthsNames[month]} {year}</span>
        </h1>
      </header>

      <DashboardSection 
        data={displayData}
        comparison={displayComparison}
        yearData={yearData}
        type={activeTab === 'geral' || !['fisioterapia', 'pilates'].includes(activeTab) ? 'consolidated' : activeTab}
        color={displayColor}
        showStratification={showStratification}
        history={activeTab === 'geral' ? history : null}
      />
    </div>
  );
}

function TabButton({ active, onClick, icon, label, isPrimary }: any) {
  return (
    <button 
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: isPrimary ? '12px 24px' : '8px 16px',
        borderRadius: '12px',
        border: 'none',
        background: active ? 'white' : 'transparent',
        color: active ? 'var(--primary)' : 'var(--text-secondary)',
        fontWeight: active ? '700' : '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: active ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
        fontSize: isPrimary ? '0.95rem' : '0.85rem',
        flexShrink: 0, // Garante que o botão não esprema
        minWidth: 'fit-content'
      }}
    >
      <span style={{ display: 'flex', color: active ? 'var(--primary)' : 'inherit', opacity: active ? 1 : 0.7 }}>
        {icon}
      </span>
      <span style={{ whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  );
}

function DashboardSection({ data, comparison, yearData, type, color, showStratification, history }: any) {
  const chartData = yearData.map((d: any) => ({
    month: d.month,
    grossValue: d[type].grossValue,
    clinicProfit: d[type].clinicProfit
  }));

  const compLastMonth = comparison.lastMonth.consolidated || comparison.lastMonth;
  const compLastYear = comparison.lastYear.consolidated || comparison.lastYear;

  return (
    <div className="fade-in">
      {/* GRID DE MÉTRICAS - 7 CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <MetricCard title="Total Atendimentos" value={data.count} icon={<Calendar />} color={color} />
        <MetricCard title="Qtd. Pacientes" value={data.uniquePatientsCount} icon={<Users />} color="#6366f1" />
        <MetricCard title="Arrecadação Bruta" value={data.grossValue} icon={<DollarSign />} isCurrency color="#10b981" />
        <MetricCard title="Lucro Clínica" value={data.clinicProfit} icon={<TrendingUp />} isCurrency color="#8b5cf6" />
        <MetricCard title="Repasse Profissional" value={data.profValue} icon={<Users />} isCurrency color="#f59e0b" />
        
        <div className="card" style={{ background: 'var(--surface-color)', border: `1px dashed ${color}`, padding: '15px' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Ticket Médio / Sessão</p>
          <h4 style={{ fontSize: '1.2rem' }}>R$ {data.ticketAverage?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
        </div>
        <div className="card" style={{ background: 'var(--surface-color)', border: `1px dashed ${color}`, padding: '15px' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Média Sessões / Pac.</p>
          <h4 style={{ fontSize: '1.2rem' }}>{data.avgSessionsPerPatient?.toFixed(1)} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>atend.</span></h4>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>Evolução Mensal</h3>
          <div style={{ height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="month" tickFormatter={(m) => monthsNames[m]} />
                <YAxis />
                <Tooltip formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR')}`} />
                <Bar dataKey="grossValue" fill={color} radius={[6, 6, 0, 0]} name="Faturamento Bruto" />
                <Bar dataKey="clinicProfit" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Lucro Clínica" opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card">
            <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Assiduidade e Status</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <StatusBox label="Finalizadas" count={data.statusSummary.finalizado} color="var(--success)" />
              <StatusBox label="Faltas (Pac.)" count={data.statusSummary.faltas} color="var(--danger)" />
              <StatusBox label="Ausência Prof." count={data.statusSummary.ausenciaProf} color="#f59e0b" />
              <StatusBox label="Justificadas" count={data.statusSummary.ausenciaJust} color="#8b5cf6" />
            </div>
            {data.statusSummary.ausenciaNula > 0 && (
              <div style={{ marginTop: '12px', padding: '8px', border: '1px dashed var(--border-color)', borderRadius: '8px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <strong>{data.statusSummary.ausenciaNula}</strong> Ausências Nulas
              </div>
            )}
          </div>
          <div className="card">
            <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Comparativo Temporal</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <ComparisonItem label="Vs. Mês Anterior" current={data.grossValue} prev={compLastMonth.grossValue} />
              <ComparisonItem label="Vs. Ano Anterior" current={data.grossValue} prev={compLastYear.grossValue} />
            </div>
          </div>
        </div>
      </div>

      {showStratification && data.stratification.length > 0 && (
        <div className="card" style={{ marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '20px' }}>Detalhamento de Serviços ({data.statusSummary.finalizado} sessões finalizadas)</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th style={{ textAlign: 'center' }}>Qtd.</th>
                  <th style={{ textAlign: 'right' }}>Bruto</th>
                  <th style={{ textAlign: 'right' }}>Lucro Clínica</th>
                  <th style={{ textAlign: 'right' }}>Repasse</th>
                </tr>
              </thead>
              <tbody>
                {data.stratification.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: '600' }}>{item.name}</td>
                    <td style={{ textAlign: 'center' }}>{item.count}</td>
                    <td style={{ textAlign: 'right' }}>R$ {item.grossValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td style={{ textAlign: 'right', color: color, fontWeight: '500' }}>R$ {item.clinicProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td style={{ textAlign: 'right' }}>R$ {item.profValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {history && (
        <div className="card" style={{ marginTop: '24px' }}>
          <h3 style={{ marginBottom: '20px' }}>Comparativo Anual de Faturamento</h3>
          <div style={{ height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="month" type="category" tickFormatter={(m) => monthsNames[m]} />
                <YAxis />
                <Tooltip formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR')}`} />
                <Legend />
                {history.map((s: any, idx: number) => (
                  <Line key={idx} data={s.data.map((d: any) => ({ month: d.month, grossValue: d.consolidated.grossValue }))} type="monotone" dataKey="grossValue" name={`Ano ${s.year}`} stroke={idx === 0 ? 'var(--primary)' : '#8b5cf6'} strokeWidth={3} dot={idx === 0} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
}
