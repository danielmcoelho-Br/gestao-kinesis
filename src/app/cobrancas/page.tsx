"use client";

import { useEffect, useState, useMemo } from "react";
import { usePeriod } from "@/context/PeriodContext";
import { 
  CheckCircle2, 
  Search, 
  MessageSquare, 
  Copy, 
  RotateCcw, 
  Users, 
  DollarSign, 
  Calendar,
  Activity
} from "lucide-react";
import { MetricCard } from "@/components/DashboardComponents";

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function CobrançasPage() {
  const { startMonth, startYear, setStartMonth, setStartYear } = usePeriod();
  // Usamos o início do período como referência para as cobranças individuais
  const selectedMonth = startMonth;
  const selectedYear = startYear;
  const setSelectedMonth = setStartMonth;
  const setSelectedYear = setStartYear;
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sentPatients, setSentPatients] = useState<Set<string>>(new Set());

  // Chave única para persistência baseada no período
  const storageKey = `sent-patients-${selectedMonth}-${selectedYear}`;

  // Carregar status do localStorage ao mudar o período
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setSentPatients(new Set(JSON.parse(saved)));
      } catch (e) {
        setSentPatients(new Set());
      }
    } else {
      setSentPatients(new Set());
    }
  }, [storageKey]);

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/cobrancas?month=${selectedMonth}&year=${selectedYear}`)
      .then(res => res.json())
      .then(json => {
        setData(Array.isArray(json) ? json : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  // Filtragem e Ordenação Alfabética
  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    
    return data
      .filter(p => p.patientName.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.patientName.localeCompare(b.patientName));
  }, [data, searchTerm]);

  // Estatísticas de Resumo
  const stats = useMemo(() => {
    const totalToCollect = data.reduce((acc, p) => acc + p.totalValue, 0);
    const totalSessions = data.reduce((acc, p) => acc + p.sessionCount, 0);
    const patientCount = data.length;
    const ticketAverage = patientCount > 0 ? totalToCollect / patientCount : 0;
    const sentCount = sentPatients.size;
    const pendingCount = Math.max(0, patientCount - sentCount);

    return { totalToCollect, totalSessions, patientCount, ticketAverage, sentCount, pendingCount };
  }, [data, sentPatients]);

  const generateMessage = (p: any) => {
    const datesStr = p.dates.join('\n');
    return `RELATÓRIO DE COBRANÇAS

Prezado(a) Sr. (a). ${p.patientName}, segue relatório das sessões de Fisioterapia do corrente mês, incluindo as previstas nesta última semana, em caso de dúvidas entrar em contato por este número ou presencialmente.

- Quantidade de sessões feitas: ${p.sessionCount} Sessões
Valor total: R$ ${p.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

${datesStr}

Att,
Clínica Kinesis Fisioterapia`;
  };

  const handleCopy = (p: any) => {
    const msg = generateMessage(p);
    navigator.clipboard.writeText(msg);
    // Feedback visual opcional aqui
  };

  const markAsSent = (patientName: string) => {
    setSentPatients(prev => {
      const next = new Set(prev);
      next.add(patientName);
      localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleWhatsApp = (p: any) => {
    const msg = encodeURIComponent(generateMessage(p));
    
    if (p.phone) {
      const cleanPhone = String(p.phone).replace(/\D/g, '');
      const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
      window.open(`https://wa.me/${fullPhone}?text=${msg}`, '_blank');
    } else {
      window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
    }
    
    markAsSent(p.patientName);
  };

  const handleReset = () => {
    if (confirm("Deseja resetar o status de envio para este mês?")) {
      setSentPatients(new Set());
      localStorage.removeItem(storageKey);
    }
  };

  return (
    <div style={{ paddingBottom: '60px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1.5px', margin: 0, color: 'var(--text-primary)' }}>
            Módulo <span style={{ color: 'var(--primary)' }}>Cobranças</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '4px' }}>Gestão de fechamentos e envios de WhatsApp</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', background: 'rgba(0,0,0,0.03)', padding: '6px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            style={{ padding: '10px 16px', borderRadius: '12px', border: 'none', background: 'white', color: 'var(--text-primary)', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
          >
            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{ padding: '10px 16px', borderRadius: '12px', border: 'none', background: 'white', color: 'var(--text-primary)', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
          <button 
            onClick={handleReset}
            title="Resetar Status"
            style={{ padding: '10px', borderRadius: '12px', border: 'none', background: 'white', color: 'var(--danger)', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center' }}
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </header>

      {/* Grid de Métricas */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <MetricCard title="Qtd. Pacientes" value={stats.patientCount} icon={<Users />} color="#6366f1" />
        <MetricCard title="Envios Realizados" value={`${stats.sentCount} / ${stats.patientCount}`} icon={<MessageSquare />} color="#10b981" />
      </section>

      {/* Busca e Filtros */}
      <div className="card" style={{ 
        marginBottom: '32px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '15px', 
        padding: '18px 28px',
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0,0,0,0.05)',
        borderRadius: '24px'
      }}>
        <Search size={22} color="var(--text-secondary)" />
        <input 
          type="text" 
          placeholder="Buscar paciente por nome..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: '500' }}
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm("")} style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 'bold' }}>Limpar</button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '80px', textAlign: 'center' }}>
          <div className="loader" style={{ margin: '0 auto 24px' }}></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Compilando dados de cobrança...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: '28px' }}>
          {filteredData.map((p, idx) => {
            const isSent = sentPatients.has(p.patientName);
            return (
              <div key={idx} className="card fade-in" style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '20px', 
                position: 'relative',
                padding: '24px',
                border: isSent ? '2px solid #22c55e' : '1px solid var(--border-color)',
                background: isSent ? 'rgba(34, 197, 94, 0.02)' : 'white',
                boxShadow: isSent ? '0 10px 30px rgba(34, 197, 94, 0.08)' : 'var(--shadow)',
                transform: isSent ? 'translateY(2px)' : 'translateY(0)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                {isSent && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '-12px', 
                    right: '24px', 
                    background: '#22c55e', 
                    color: 'white', 
                    padding: '6px 16px', 
                    borderRadius: '30px', 
                    fontSize: '0.75rem', 
                    fontWeight: '900', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)',
                    zIndex: 2,
                    letterSpacing: '0.5px'
                  }}>
                    <CheckCircle2 size={14} /> COBRANÇA ENVIADA
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ 
                      color: 'var(--text-primary)', 
                      margin: 0, 
                      fontSize: '1.4rem', 
                      fontWeight: '800',
                      letterSpacing: '-0.5px'
                    }}>
                      {p.patientName}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <span style={{ 
                        fontSize: '0.85rem', 
                        background: 'rgba(0,0,0,0.04)', 
                        padding: '3px 10px', 
                        borderRadius: '6px', 
                        fontWeight: '700',
                        color: 'var(--text-secondary)'
                      }}>
                        {p.sessionCount} SESSÕES
                      </span>
                      {p.phone && (
                        <span style={{ fontSize: '0.8rem', color: '#22c55e', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={14} /> WHATSAPP
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>Valor Total</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary)' }}>
                      R$ {p.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                <div style={{ 
                  background: 'rgba(0,0,0,0.015)', 
                  padding: '20px', 
                  borderRadius: '16px', 
                  fontSize: '0.9rem', 
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap', 
                  maxHeight: '180px', 
                  overflowY: 'auto', 
                  border: '1px solid rgba(0,0,0,0.05)',
                  color: 'var(--text-secondary)',
                  fontFamily: 'monospace',
                  scrollbarWidth: 'thin'
                }}>
                  {generateMessage(p)}
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                  <button 
                    onClick={() => handleCopy(p)}
                    className="btn"
                    style={{ 
                      flex: 1, 
                      padding: '14px', 
                      background: 'white', 
                      color: 'var(--text-primary)', 
                      border: '1px solid var(--border-color)', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      gap: '8px',
                      borderRadius: '14px',
                      fontWeight: '700'
                    }}
                  >
                    <Copy size={18} /> Copiar
                  </button>
                  <button 
                    onClick={() => handleWhatsApp(p)}
                    className="btn"
                    style={{ 
                      flex: 1.5, 
                      padding: '14px', 
                      background: isSent ? '#1a9e4e' : '#25D366', 
                      color: 'white', 
                      border: 'none', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      gap: '8px',
                      borderRadius: '14px',
                      fontWeight: '800',
                      boxShadow: '0 4px 15px rgba(37, 211, 102, 0.2)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <MessageSquare size={20} /> {isSent ? 'Reenviar' : 'Enviar WhatsApp'}
                  </button>
                </div>
              </div>
            );
          })}
          
          {filteredData.length === 0 && (
            <div style={{ 
              gridColumn: '1 / -1', 
              padding: '120px 40px', 
              textAlign: 'center', 
              background: 'rgba(0,0,0,0.02)', 
              borderRadius: '32px', 
              border: '2px dashed var(--border-color)' 
            }}>
              <div style={{ fontSize: '64px', marginBottom: '24px', opacity: 0.2 }}>🔍</div>
              <h3 style={{ color: 'var(--text-secondary)', fontSize: '1.5rem', fontWeight: '700' }}>Nenhum paciente encontrado</h3>
              <p style={{ color: 'var(--text-secondary)', opacity: 0.7, fontSize: '1.1rem' }}>Ajuste os filtros ou importe novos dados no menu de Upload.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
