"use client";

import { useEffect, useState } from "react";

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

import { usePeriod } from "@/context/PeriodContext";

export default function CobrançasPage() {
  const { month: selectedMonth, year: selectedYear, setMonth: setSelectedMonth, setYear: setSelectedYear } = usePeriod();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredData = data.filter(p => 
    p.patientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  return (
    <div>
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1>Módulo de Cobranças</h1>
          <p>Gere e envie relatórios mensais para pacientes</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
          >
            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
        </div>
      </header>

      <div className="card" style={{ marginBottom: '24px' }}>
        <input 
          type="text" 
          placeholder="Buscar paciente por nome..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
        />
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Carregando dados de cobrança...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
          {filteredData.map((p, idx) => (
            <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h3 style={{ color: 'var(--primary)', marginBottom: '4px' }}>{p.patientName}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {p.sessionCount} sessões em {months[selectedMonth]}
                </p>
              </div>

              <div style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '8px', fontSize: '0.85rem', whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)' }}>
                {generateMessage(p)}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                <button 
                  onClick={() => handleCopy(p)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', cursor: 'pointer' }}
                >
                  Copiar Mensagem
                </button>
                <button 
                  onClick={() => handleWhatsApp(p)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#25D366', color: 'white', fontWeight: '600', cursor: 'pointer' }}
                >
                  WhatsApp
                </button>
              </div>
            </div>
          ))}
          {filteredData.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Nenhum paciente encontrado com sessões neste período.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
