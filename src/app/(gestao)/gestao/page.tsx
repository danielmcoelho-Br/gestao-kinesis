"use client";

import { useEffect, useState, useMemo } from "react";
import { usePeriod } from "@/gestao/context/PeriodContext";
import { TrendingUp, Users, DollarSign, Calendar, Activity, Home, Target, BarChart3, Download } from 'lucide-react';
import { 
  MetricCard, 
  StatusBox, 
  TemporalComparisonGrid 
} from "@/gestao/components/DashboardComponents";
import { MetricChart } from "@/gestao/components/MetricChart";
import { ReportHeader } from "@/gestao/components/ReportHeader";
import { DashboardResponse } from "@/gestao/types";
import { ClientStatsService } from "@/gestao/services/clientStatsService";

const monthsNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function Dashboard() {
  const { startMonth, startYear, endMonth, endYear, initialized } = usePeriod();
  const [stats, setStats] = useState<DashboardResponse | null>(null);
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
          prefix = '<div style="overflow-x:auto; margin: 16px 0;"><table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.9rem; border: 1px solid rgba(0,0,0,0.06); border-radius: 8px;">';
          inTable = true;
          const headerCells = cells.map(c => `<th style="padding:12px; border-bottom:2px solid rgba(0,0,0,0.08); background: rgba(0,0,0,0.02); font-weight:700;">${c}</th>`).join('');
          return `${prefix}<thead><tr>${headerCells}</tr></thead><tbody>`;
        }
        const rowCells = cells.map(c => `<td style="padding:12px; border-bottom:1px solid rgba(0,0,0,0.06);">${c}</td>`).join('');
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
    <div className="card no-print" style={{ 
      marginBottom: '40px', 
      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
      border: '1px solid rgba(139, 92, 246, 0.15)',
      borderRadius: '24px',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background glowing blur sphere */}
      <div style={{
        position: 'absolute',
        top: '-50px',
        right: '-50px',
        width: '150px',
        height: '150px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
        filter: 'blur(20px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: 'white',
              borderRadius: '12px',
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
            }}>
              <TrendingUp size={22} style={{ transform: 'rotate(45deg)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                Kinesis AI Copilot
                <span style={{ 
                  fontSize: '0.65rem', 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '100px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Gemini Powered</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                Inteligência analítica integrada. Pergunte sobre correlações de dor, faltas ou faturamento.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {isOpen && (
              <button 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="btn" 
                style={{ 
                  background: isSettingsOpen ? 'rgba(139, 92, 246, 0.1)' : 'white', 
                  border: isSettingsOpen ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(0,0,0,0.08)',
                  color: isSettingsOpen ? '#6d28d9' : 'var(--text-primary)',
                  borderRadius: '12px', 
                  padding: '8px 12px',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                }}
              >
                ⚙️ Ajustar Prompt
              </button>
            )}
            <button 
              onClick={() => {
                setIsOpen(!isOpen);
                if (isOpen) setIsSettingsOpen(false);
              }} 
              className="btn" 
              style={{ 
                background: 'white', 
                border: '1px solid rgba(0,0,0,0.08)',
                color: 'var(--text-primary)',
                borderRadius: '12px', 
                padding: '8px 16px',
                fontWeight: '600',
                fontSize: '0.85rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}
            >
              {isOpen ? "Ocultar Painel" : "Abrir Copilot"}
            </button>
          </div>
        </div>

        {isOpen && (
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(139, 92, 246, 0.1)' }}>
            {/* Settings Area */}
            {isSettingsOpen && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
                position: 'relative'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#4c1d95' }}>
                  ⚙️ Diretrizes Personalizadas do Prompt
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0 0 16px 0', lineHeight: '1.4' }}>
                  Escreva regras, termos preferidos ou instruções específicas (ex: "Não utilize abreviações clínicas", "Sempre sugira estratégias de retenção para Pilates"). O Copilot aplicará essas regras com prioridade máxima em todas as respostas.
                </p>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Escreva aqui suas diretrizes ou regras adicionais..."
                  style={{
                    width: '100%',
                    height: '120px',
                    background: 'white',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    fontSize: '0.85rem',
                    fontFamily: 'inherit',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    resize: 'vertical',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#8b5cf6'; e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.15)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(139, 92, 246, 0.2)'; e.target.style.boxShadow = 'none'; }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                  {saveSuccess && (
                    <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: '600' }}>
                      ✓ Diretrizes salvas e aplicadas!
                    </span>
                  )}
                  <button
                    onClick={handleSaveInstructions}
                    disabled={savingSettings}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '8px 16px',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      opacity: savingSettings ? 0.6 : 1,
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)'
                    }}
                  >
                    {savingSettings ? "Salvando..." : "Salvar Diretrizes"}
                  </button>
                </div>
              </div>
            )}

            {/* Suggestions Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(s.query);
                    handleAsk(s.query);
                  }}
                  disabled={loading}
                  style={{
                    background: 'rgba(139, 92, 246, 0.06)',
                    border: '1px solid rgba(139, 92, 246, 0.1)',
                    color: '#6d28d9',
                    borderRadius: '100px',
                    padding: '8px 16px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.12)';
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.06)';
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.1)';
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Response Box */}
            {(response || loading || error) && (
              <div style={{ 
                background: 'white',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px',
                maxHeight: '400px',
                overflowY: 'auto',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)'
              }}>
                {loading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0' }}>
                    <div className="loader" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', animation: 'pulse 1.5s infinite' }}>
                      Analisando banco de dados Kinesis e cruzando informações...
                    </span>
                  </div>
                )}
                
                {error && (
                  <div style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: '500', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ margin: 0 }}>⚠️ {error}</p>
                  </div>
                )}
                
                {response && (
                  <div 
                    style={{ fontSize: '0.92rem', lineHeight: '1.6', color: '#1e293b' }}
                    dangerouslySetInnerHTML={{ __html: formattedResponse }} 
                  />
                )}
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleAsk(prompt); }} style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Pergunte ao Copilot (ex: Quais pacientes tiveram maior média de dor neste mês?)"
                disabled={loading}
                style={{
                  flex: 1,
                  background: 'white',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '14px',
                  padding: '12px 20px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#8b5cf6'; e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.15)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(139, 92, 246, 0.2)'; e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
              />
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '0 24px',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  opacity: (loading || !prompt.trim()) ? 0.6 : 1,
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)'
                }}
              >
                Perguntar
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
