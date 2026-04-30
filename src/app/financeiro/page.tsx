"use client";

import { useEffect, useState } from "react";

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

import { usePeriod } from "@/context/PeriodContext";

export default function FinanceiroPage() {
  const { month, year, setMonth, setYear } = usePeriod();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/financeiro?month=${month}&year=${year}`)
      .then(res => res.json())
      .then(data => {
        setTransactions(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [month, year]);

  return (
    <div>
      <header className="header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>Fluxo de Caixa (Banco)</h1>
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
          <p>Carregando movimentações...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>Data</th>
                  <th style={{ padding: '12px' }}>Descrição</th>
                  <th style={{ padding: '12px' }}>Categoria</th>
                  <th style={{ padding: '12px' }}>Banco</th>
                  <th style={{ padding: '12px' }}>Tipo</th>
                  <th style={{ padding: '12px' }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t: any) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px' }}>{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding: '12px' }}>{t.description}</td>
                    <td style={{ padding: '12px' }}>{t.category}</td>
                    <td style={{ padding: '12px' }}>{t.bank}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        color: t.type === 'INCOME' ? 'var(--success)' : 'var(--danger)',
                        fontWeight: '600'
                      }}>
                        {t.type === 'INCOME' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: t.type === 'INCOME' ? 'var(--success)' : 'var(--danger)' }}>
                      {t.type === 'INCOME' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions.length === 0 && <p style={{ textAlign: 'center', padding: '24px' }}>Nenhuma transação encontrada para este período.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
