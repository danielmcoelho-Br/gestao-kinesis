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
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

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
  const isAdmin = user?.role === 'ADMIN';
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
            <p className="section-title">Período</p>
            
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

            <div className="selector-group">
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

            {isAdmin && (
              <>
                <p className="nav-label">Administração</p>
                <Link href="/admin" className={`nav-item admin-item ${isActive("/admin") ? 'active' : ''}`}>
                  <Shield size={18} />
                  <span>Painel de Controle</span>
                  <div className="badge">Config</div>
                </Link>
              </>
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
