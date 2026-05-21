"use client";

import { usePeriod } from "@/gestao/context/PeriodContext";

const monthsNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export function ReportHeader({ title = "Relatório de Gestão Clínica" }) {
  const { startMonth, startYear, endMonth, endYear } = usePeriod();
  const now = new Date();

  return (
    <div className="print-only-header" style={{ display: 'none', width: '100%', marginBottom: '40px', borderBottom: '2px solid var(--primary)', paddingBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ color: 'var(--primary)', fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>KinesisLab</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '4px 0' }}>Fisioterapia & Performance</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>{title}</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0' }}>
            Período: {monthsNames[startMonth]} {startYear} 
            { (startMonth !== endMonth || startYear !== endYear) && ` até ${monthsNames[endMonth]} ${endYear}` }
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Gerado em: {now.toLocaleDateString('pt-BR')} às {now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </div>
  );
}
