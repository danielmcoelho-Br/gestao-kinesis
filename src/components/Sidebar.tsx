"use client";

import Link from "next/link";
import { usePeriod } from "@/context/PeriodContext";
import { usePathname } from "next/navigation";

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export function Sidebar() {
  const { month, year, setMonth, setYear } = usePeriod();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="sidebar">
      <div className="logo">
        <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>Gestão Kinesis</h2>
      </div>

      <div style={{ padding: '0 20px 20px 20px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>Período de Referência</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <select 
            value={month} 
            onChange={(e) => setMonth(parseInt(e.target.value))}
            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)', fontSize: '0.9rem', cursor: 'pointer' }}
          >
            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select 
            value={year} 
            onChange={(e) => setYear(parseInt(e.target.value))}
            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)', fontSize: '0.9rem', cursor: 'pointer' }}
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
        </div>
      </div>

      <nav className="nav-menu">
        <Link href="/" className={isActive("/") ? "active" : ""}>Dashboard</Link>
        <Link href="/profissionais" className={isActive("/profissionais") ? "active" : ""}>Profissionais (Regras)</Link>
        <Link href="/producao" className={isActive("/producao") ? "active" : ""}>Produção</Link>
        <Link href="/financeiro" className={isActive("/financeiro") ? "active" : ""}>Financeiro Clínica</Link>
        <Link href="/upload" className={isActive("/upload") ? "active" : ""}>Importar Dados</Link>
        <Link href="/cobrancas" className={isActive("/cobrancas") ? "active" : ""}>Cobranças</Link>
      </nav>
    </aside>
  );
}
