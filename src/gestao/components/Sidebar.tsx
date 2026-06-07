"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePeriod } from "@/gestao/context/PeriodContext";
import { usePathname, useRouter } from "next/navigation";
import { 
  Check, Filter, LogOut, Settings, User as UserIcon, 
  Shield, Loader2, LayoutDashboard, Users, 
  CreditCard, BarChart3, UploadCloud, Home
} from "lucide-react";

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export function Sidebar() {
  const { 
    startMonth, startYear, endMonth, endYear, 
    updatePeriod 
  } = usePeriod();
  
  const [lStartMonth, setLStartMonth] = useState(startMonth);
  const [lStartYear, setLStartYear] = useState(startYear);
  const [lEndMonth, setLEndMonth] = useState(endMonth);
  const [lEndYear, setLEndYear] = useState(endYear);
  const [isPeriodExpanded, setIsPeriodExpanded] = useState(() => startMonth !== endMonth || startYear !== endYear);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Sync dropdown values with context when it loads from localStorage
  useEffect(() => {
    setLStartMonth(startMonth);
    setLStartYear(startYear);
    setLEndMonth(endMonth);
    setLEndYear(endYear);
    setIsPeriodExpanded(startMonth !== endMonth || startYear !== endYear);
  }, [startMonth, startYear, endMonth, endYear]);

  useEffect(() => {
    setLoading(true);
    fetch("/api/profile")
      .then(res => res.json())
      .then(data => {
        if (data.id) setUser(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const isActive = (path: string) => pathname === path;
  const isAdmin = ['ADMIN', 'ADMINISTRADOR', 'ADMINISTRATOR'].includes(String(user?.role || '').toUpperCase());
  const hasChanges = lStartMonth !== startMonth || lStartYear !== startYear || lEndMonth !== endMonth || lEndYear !== endYear;

  const handleApply = () => {
    updatePeriod(lStartMonth, lStartYear, lEndMonth, lEndYear);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const menuItems = [
    { href: "/gestao", label: "Dashboard", icon: LayoutDashboard },
    { href: "/pacientes", label: "Pacientes", icon: Users },
    { href: "/cobrancas", label: "Cobranças", icon: CreditCard },
    { href: "/upload", label: "Importar Dados", icon: UploadCloud },
  ];

  return (
    <aside className="sidebar-modern">
      <div className="logo-container">
        <div className="logo-icon">K</div>
        <h2 className="logo-text">Gestão Kinesis</h2>
      </div>

      {loading ? (
        <div className="loading-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#94a3b8' }}>
          <Loader2 className="animate-spin" size={24} />
          <span style={{ fontSize: '0.75rem' }}>Carregando...</span>
        </div>
      ) : (
        <div className="sidebar-content">
          <div className="period-card">
            {!isPeriodExpanded ? (
              <>
                <p className="section-title" style={{ marginBottom: '8px' }}>SELECIONAR MÊS</p>
                <div className="selector-group" style={{ marginBottom: '4px' }}>
                  <div className="select-row">
                    <select value={lStartMonth} onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setLStartMonth(val);
                      setLEndMonth(val);
                    }}>
                      {months.map((m, i) => <option key={i} value={i}>{m.substring(0,3)}</option>)}
                    </select>
                    <select value={lStartYear} onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setLStartYear(val);
                      setLEndYear(val);
                    }}>
                      {Array.from({ length: 5 }, (_, i) => 2026 - i).map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="section-title" style={{ marginBottom: '8px' }}>PERÍODO</p>
                <div className="selector-group">
                  <label>INÍCIO</label>
                  <div className="select-row">
                    <select value={lStartMonth} onChange={(e) => setLStartMonth(parseInt(e.target.value))}>
                      {months.map((m, i) => <option key={i} value={i}>{m.substring(0,3)}</option>)}
                    </select>
                    <select value={lStartYear} onChange={(e) => setLStartYear(parseInt(e.target.value))}>
                      {Array.from({ length: 5 }, (_, i) => 2026 - i).map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>

                <div className="selector-group" style={{ marginTop: '10px', marginBottom: '4px' }}>
                  <label>FIM</label>
                  <div className="select-row">
                    <select value={lEndMonth} onChange={(e) => setLEndMonth(parseInt(e.target.value))}>
                      {months.map((m, i) => <option key={i} value={i}>{m.substring(0,3)}</option>)}
                    </select>
                    <select value={lEndYear} onChange={(e) => setLEndYear(parseInt(e.target.value))}>
                      {Array.from({ length: 5 }, (_, i) => 2026 - i).map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            <button 
              onClick={() => setIsPeriodExpanded(!isPeriodExpanded)}
              style={{ 
                background: 'none', border: 'none', padding: 0, 
                color: '#64748b', fontSize: '0.65rem', 
                fontWeight: '800', cursor: 'pointer', 
                marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              {isPeriodExpanded ? '▲ MENOS OPÇÕES' : '▼ PERÍODO'}
            </button>

            <button onClick={handleApply} disabled={!hasChanges} className={`filter-btn ${hasChanges ? 'active' : ''}`}>
              {hasChanges ? <Filter size={14} /> : <Check size={14} />}
              {hasChanges ? "Filtrar" : "Validado"}
            </button>
          </div>

          <nav className="main-nav">
            <Link href="/" className="nav-item hub-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <Home size={18} />
              <span>Central Hub</span>
            </Link>
            <p className="nav-label">Menu Principal</p>
            {menuItems.filter(item => {
              if (user?.role?.toUpperCase() === 'SECRETARIA') {
                return item.href === '/cobrancas' || item.href === '/upload';
              }
              return true;
            }).map((item) => (
              <Link key={item.href} href={item.href} className={`nav-item ${isActive(item.href) ? 'active' : ''}`}>
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            ))}

            {isAdmin && (
              <Link href="/financeiro" className={`nav-item ${isActive("/financeiro") ? 'active' : ''}`}>
                <CreditCard size={18} />
                <span>Financeiro Clínica</span>
              </Link>
            )}


          </nav>
        </div>
      )}

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="avatar">
            <UserIcon size={18} />
          </div>
          <div className="user-info">
            <p className="user-name">{user?.name || 'Usuário'}</p>
            <p className="user-role">{user?.role?.toLowerCase() || '...'}</p>
          </div>
        </div>
        
        <div className="footer-actions">
          <Link href="/perfil" className="footer-btn" title="Meu Perfil">
            <Settings size={18} />
          </Link>
          <button onClick={handleLogout} className="footer-btn logout" title="Sair">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
