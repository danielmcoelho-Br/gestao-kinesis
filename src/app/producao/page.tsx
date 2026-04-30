"use client";

import { useEffect, useState } from "react";

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

import { usePeriod } from "@/context/PeriodContext";

export default function ProducaoPage() {
  const { month, year, setMonth, setYear } = usePeriod();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stats?month=${month}&year=${year}`)
      .then(res => res.json())
      .then(data => {
        // We'll add an endpoint for detailed production later if needed, 
        // for now let's fetch sessions from a separate api if available or stats
        // Actually, let's create a dedicated detailed production API
        fetch(`/api/producao?month=${month}&year=${year}`)
          .then(res => res.json())
          .then(items => {
            setSessions(items);
            setLoading(false);
          });
      })
      .catch(() => setLoading(false));
  }, [month, year]);

  return (
    <div>
      <header className="header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>Produção Detalhada</h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="card" style={{ padding: '8px' }}>
              {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="card" style={{ padding: '8px' }}>
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>
        </div>
      </header>

      <div className="card">
        {loading ? (
          <p>Carregando atendimentos...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>Data</th>
                  <th style={{ padding: '12px' }}>Paciente</th>
                  <th style={{ padding: '12px' }}>Profissional</th>
                  <th style={{ padding: '12px' }}>Serviço</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px' }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s: any) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px' }}>{new Date(s.date).toLocaleDateString('pt-BR')} {new Date(s.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={{ padding: '12px' }}>{s.patientName}</td>
                    <td style={{ padding: '12px' }}>{s.professional.name}</td>
                    <td style={{ padding: '12px' }}>{s.serviceType}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.8rem',
                        backgroundColor: s.status === 'Finalizado' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: s.status === 'Finalizado' ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>R$ {s.value.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sessions.length === 0 && <p style={{ textAlign: 'center', padding: '24px' }}>Nenhum atendimento encontrado para este período.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
