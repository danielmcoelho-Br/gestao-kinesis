"use client";

import Link from "next/link";
import { usePeriod } from "@/context/PeriodContext";
import { usePathname } from "next/navigation";

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export function Sidebar() {
  const { 
    startMonth, startYear, endMonth, endYear, 
    setStartMonth, setStartYear, setEndMonth, setEndYear 
  } = usePeriod();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="sidebar">
      <div className="logo">
        <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>Gestão Kinesis</h2>
      </div>

      <div style={{ padding: '0 20px 20px 20px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Análise por Período</p>
        
        {/* Início */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>INÍCIO</label>
          <div style={{ display: 'flex', gap: '4px' }}>
            <select 
              value={startMonth} 
              onChange={(e) => setStartMonth(parseInt(e.target.value))}
              style={{ flex: 2, padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select 
              value={startYear} 
              onChange={(e) => setStartYear(parseInt(e.target.value))}
              style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              {Array.from({ length: 10 }, (_, i) => 2026 - i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Fim */}
        <div>
          <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>FIM (INCLUSO)</label>
          <div style={{ display: 'flex', gap: '4px' }}>
            <select 
              value={endMonth} 
              onChange={(e) => setEndMonth(parseInt(e.target.value))}
              style={{ flex: 2, padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select 
              value={endYear} 
              onChange={(e) => setEndYear(parseInt(e.target.value))}
              style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              {Array.from({ length: 10 }, (_, i) => 2026 - i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <nav className="nav-menu">
        <Link href="/" className={isActive("/") ? "active" : ""}>Dashboard</Link>
        <Link href="/pacientes" className={isActive("/pacientes") ? "active" : ""}>Perfil Pacientes</Link>
        <Link href="/financeiro" className={isActive("/financeiro") ? "active" : ""}>Financeiro Clínica</Link>
        <Link href="/cobrancas" className={isActive("/cobrancas") ? "active" : ""}>Cobranças</Link>
        <Link href="/producao" className={isActive("/producao") ? "active" : ""}>Produção</Link>
        <Link href="/upload" className={isActive("/upload") ? "active" : ""}>Importar Dados</Link>
        <Link href="/profissionais" className={isActive("/profissionais") ? "active" : ""}>Profissionais (regras)</Link>
      </nav>
    </aside>
  );
}
