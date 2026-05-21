"use client";

import { useEffect, useState } from "react";
import { usePeriod } from "@/gestao/context/PeriodContext";
import { CreditCard, TrendingUp, TrendingDown, DollarSign, Loader2, FileSpreadsheet } from "lucide-react";
import Link from "next/link";

export default function FinanceiroPageContent() {
  const { startMonth, startYear, endMonth, endYear, initialized } = usePeriod();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!initialized) return;
    setLoading(true);
    fetch(`/api/financeiro?startMonth=${startMonth}&startYear=${startYear}&endMonth=${endMonth}&endYear=${endYear}`)
      .then(res => res.json())
      .then(data => {
        setTransactions(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setTransactions([]);
        setLoading(false);
      });
  }, [startMonth, startYear, endMonth, endYear, initialized]);

  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}><Loader2 className="animate-spin" /> Carregando financeiro...</div>;

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--success)' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Entradas</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
            <TrendingUp color="var(--success)" size={24} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--success)' }}>R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
          </div>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--danger)' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Saídas</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
            <TrendingDown color="var(--danger)" size={24} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--danger)' }}>R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
          </div>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--primary)' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Saldo Período</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
            <DollarSign color="var(--primary)" size={24} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CreditCard color="var(--primary)" size={24} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Fluxo de Caixa (Banco)</h3>
          </div>
          
          <Link 
            href="/financeiro/conciliador" 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', padding: '10px 20px', fontWeight: '800' }}
          >
            <FileSpreadsheet size={16} />
            Conciliar Extrato BB
          </Link>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Banco</th>
                <th>Tipo</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t: any) => (
                <tr key={t.id}>
                  <td style={{ fontWeight: '600' }}>{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                  <td>{t.description}</td>
                  <td><span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>{t.category}</span></td>
                  <td>{t.bank}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '6px', 
                      fontSize: '0.7rem', 
                      fontWeight: '800',
                      background: t.type === 'INCOME' ? '#dcfce7' : '#fee2e2',
                      color: t.type === 'INCOME' ? '#166534' : '#991b1b',
                    }}>
                      {t.type === 'INCOME' ? 'ENTRADA' : 'SAÍDA'}
                    </span>
                  </td>
                  <td style={{ 
                    fontWeight: '800', 
                    color: t.type === 'INCOME' ? '#166534' : '#991b1b',
                    textAlign: 'right'
                  }}>
                    {t.type === 'INCOME' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
              Nenhuma transação encontrada para este período.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
