"use client";

import { useEffect, useState, useMemo } from "react";
import { usePeriod } from "@/context/PeriodContext";
import { CheckCircle2, Search, MessageSquare, Copy, ExternalLink } from "lucide-react";

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function CobrançasPage() {
  const { month: selectedMonth, year: selectedYear, setMonth: setSelectedMonth, setYear: setSelectedYear } = usePeriod();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sentPatients, setSentPatients] = useState<Set<string>>(new Set());

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/cobrancas?month=${selectedMonth}&year=${selectedYear}`)
      .then(res => res.json())
      .then(json => {
        setData(json);
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
    alert("Mensagem copiada para o clipboard!");
  };

  const handleWhatsApp = (p: any) => {
    const msg = encodeURIComponent(generateMessage(p));
    
    if (p.phone) {
      // Limpar o número (apenas dígitos)
      const cleanPhone = String(p.phone).replace(/\D/g, '');
      // Adicionar DDI Brasil se não houver
      const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
      
      // Link direto que pula a tela de "Compartilhar"
      window.open(`https://wa.me/${fullPhone}?text=${msg}`, '_blank');
    } else {
      // Fallback para a tela de compartilhar se não houver telefone
      window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
    }
    
    // Sinalizar que a mensagem foi enviada
    setSentPatients(prev => {
      const next = new Set(prev);
      next.add(p.patientName);
      return next;
    });
  };

  return (
    <div style={{ paddingBottom: '60px' }}>
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '800', letterSpacing: '-1px' }}>Módulo de Cobranças</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Controle e envio de fechamentos mensais</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', background: 'var(--surface-color)', padding: '8px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: 'white', color: 'var(--text-primary)', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}
          >
            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: 'white', color: 'var(--text-primary)', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
        </div>
      </header>

      <div className="card" style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 24px' }}>
        <Search size={20} color="var(--text-secondary)" />
        <input 
          type="text" 
          placeholder="Buscar paciente por nome..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '1.1rem', color: 'var(--text-primary)' }}
        />
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <div className="loader" style={{ margin: '0 auto 20px' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Processando dados de cobrança...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '24px' }}>
          {filteredData.map((p, idx) => {
            const isSent = sentPatients.has(p.patientName);
            return (
              <div key={idx} className="card fade-in" style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '16px', 
                position: 'relative',
                border: isSent ? '2px solid var(--success)' : '1px solid var(--border-color)',
                opacity: isSent ? 0.9 : 1,
                transform: isSent ? 'scale(0.98)' : 'scale(1)',
                transition: 'all 0.3s ease'
              }}>
                {isSent && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '12px', 
                    right: '12px', 
                    background: 'var(--success)', 
                    color: 'white', 
                    padding: '4px 12px', 
                    borderRadius: '20px', 
                    fontSize: '0.7rem', 
                    fontWeight: '800', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    boxShadow: '0 4px 10px rgba(34, 197, 94, 0.3)',
                    zIndex: 2
                  }}>
                    <CheckCircle2 size={14} /> ENVIADA
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <h3 style={{ color: isSent ? 'var(--text-secondary)' : 'var(--primary)', margin: 0, fontSize: '1.25rem' }}>{p.patientName}</h3>
                    {p.phone ? (
                      <span title="Telefone Cadastrado" style={{ color: 'var(--success)', display: 'flex', alignItems: 'center' }}><CheckCircle2 size={16} /></span>
                    ) : (
                      <span title="Telefone não encontrado" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}><Search size={16} /></span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                    {p.sessionCount} sessões • Total: <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>R$ {p.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </p>
                </div>

                <div style={{ 
                  background: 'rgba(0,0,0,0.02)', 
                  padding: '20px', 
                  borderRadius: '12px', 
                  fontSize: '0.85rem', 
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap', 
                  maxHeight: '200px', 
                  overflowY: 'auto', 
                  border: '1px solid var(--border-color)',
                  color: isSent ? 'var(--text-secondary)' : 'var(--text-primary)',
                  fontFamily: 'inherit'
                }}>
                  {generateMessage(p)}
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                  <button 
                    onClick={() => handleCopy(p)}
                    className="btn"
                    style={{ flex: 1, padding: '12px', background: 'var(--surface-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                  >
                    <Copy size={18} /> Copiar
                  </button>
                  <button 
                    onClick={() => handleWhatsApp(p)}
                    className="btn"
                    style={{ 
                      flex: 1.5, 
                      padding: '12px', 
                      background: isSent ? 'var(--success)' : '#25D366', 
                      color: 'white', 
                      border: 'none', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      gap: '8px',
                      opacity: isSent ? 0.7 : 1
                    }}
                  >
                    <MessageSquare size={18} /> {isSent ? 'Enviar Novamente' : 'Enviar WhatsApp'}
                  </button>
                </div>
              </div>
            );
          })}
          
          {filteredData.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '100px 40px', textAlign: 'center', background: 'var(--surface-color)', borderRadius: '24px', border: '1px dashed var(--border-color)' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.3 }}>📁</div>
              <h3 style={{ color: 'var(--text-secondary)' }}>Nenhuma cobrança encontrada</h3>
              <p style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>Importe o arquivo de fechamento mensal para começar.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
