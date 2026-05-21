"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { 
  Home, 
  Shield, 
  Layout, 
  User, 
  LogOut,
  ChevronLeft
} from "lucide-react";
import { toast } from "sonner";

interface HeaderProps {
    showBackButton?: boolean;
}

export default function Header({ showBackButton = false }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogout = () => {
    toast.info("Até logo!");
    localStorage.removeItem("user");
    window.location.href = '/login';
  };

  return (
    <header className="header-container print:hidden">
      <div className="header-inner">
        
        <div 
          onClick={() => router.push('/dashboard')}
          className="logo-section"
        >
          <div className="logo-wrapper logo-blend-multiply">
              <Image 
                  src="/logo-kinesis.png" 
                  alt="KinesisLab Logo" 
                  fill
                  priority
                  sizes="(max-width: 768px) 80px, (max-width: 1024px) 100px, 134px"
                  style={{ objectFit: 'contain' }}
              />
          </div>
          <h1 className="logo-text">
            Kinesis<span style={{ color: 'var(--primary)' }}>Lab</span>
          </h1>
        </div>

        <div className="nav-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              
              {user?.role !== 'FISIOTERAPEUTA' && (
                <button 
                  onClick={() => router.push('/')}
                  className="no-print nav-btn"
                  style={{ color: 'var(--primary)', fontWeight: '700' }}
                >
                  <Home size={18} />
                  <span className="hidden-tablet">Central Hub</span>
                </button>
              )}

              {pathname !== '/dashboard' && (
                <div className="hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginRight: '0.5rem' }}>
                  <button 
                    onClick={() => router.push('/dashboard')}
                    className="no-print nav-btn"
                  >
                    <Home size={18} />
                    <span className="hidden-tablet">Início</span>
                  </button>
                  <button 
                    onClick={() => router.back()}
                    className="no-print nav-btn"
                  >
                    <ChevronLeft size={18} />
                    <span className="hidden-tablet">Voltar</span>
                  </button>
                  <div className="no-print divider" />
                </div>
              )}
              {['Administrador', 'ADMINISTRADOR', 'ADMIN', 'admin', 'administrator'].includes(user?.role) && (
                <div className="hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <button 
                    onClick={() => router.push('/dashboard/admin/users')}
                    className="no-print nav-btn"
                  >
                    <Shield size={18} />
                    <span className="hidden-tablet">Usuários</span>
                  </button>
                  <button 
                    onClick={() => router.push('/dashboard/admin/assessments')}
                    className="no-print nav-btn"
                  >
                    <Layout size={18} />
                    <span className="hidden-tablet">Modelos</span>
                  </button>
                  <div className="no-print divider" />
                </div>
              )}

              {user && (
                <div className="no-print user-profile">
                  <div className="user-info hide-on-mobile" style={{ cursor: 'pointer' }} onClick={() => router.push('/dashboard/profile')}>
                    <div className="user-name">{user.name}</div>
                    <div className="user-role">{user.role}</div>
                  </div>
                  <div className="user-avatar" style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }} onClick={() => router.push('/dashboard/profile')} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                    <User size={20} />
                  </div>
                </div>
              )}

              <button 
                className="no-print nav-btn logout-btn" 
                onClick={handleLogout}
              >
                <LogOut size={18} />
                <span className="hidden-tablet">Sair</span>
              </button>
            </nav>
          </div>
        </div>
      </div>

      <style jsx>{`
        .header-container {
          position: sticky;
          top: 0;
          z-index: 1000;
          background-color: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
          padding: 0.75rem 1.5rem;
          width: 100%;
        }
        .header-inner {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .logo-section {
          display: flex;
          align-items: center;
          gap: 1.2rem;
          cursor: pointer;
          padding-right: 1.5rem;
          border-right: 1px solid var(--border);
        }
        .logo-wrapper {
          position: relative;
          width: 134px;
          height: 80px;
        }
        .logo-text {
          font-size: 1.68rem;
          font-weight: 800;
          margin: 0;
          color: var(--secondary);
          letter-spacing: -0.02em;
        }
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        .btn-dashboard {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1.25rem;
          borderRadius: 12px;
          border: 1px solid var(--border);
          background-color: white;
          color: var(--text);
          font-weight: 700;
          cursor: pointer;
          font-size: 0.9rem;
          box-shadow: var(--shadow-sm);
        }
        .nav-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 0.75rem;
          border-radius: 12px;
          border: none;
          background-color: transparent;
          color: var(--text-muted);
          font-weight: 600;
          cursor: pointer;
        }
        .divider {
          width: 1px;
          height: 1.25rem;
          background-color: var(--border);
          margin: 0 0.5rem;
        }
        .user-profile {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding-right: 0.75rem;
          border-right: 1px solid var(--border);
          margin-right: 0.25rem;
        }
        .user-info {
          text-align: right;
        }
        .user-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text);
          white-space: nowrap;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .user-role {
          font-size: 0.7rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: var(--primary-light);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          font-weight: bold;
          font-size: 1rem;
        }

        @media (max-width: 1024px) {
          .hidden-tablet {
            display: none;
          }
          .logo-text {
            font-size: 1.4rem;
          }
          .logo-wrapper {
            width: 100px;
            height: 60px;
          }
        }

        @media (max-width: 768px) {
          .header-container {
            padding: 0.5rem 1rem;
          }
          .logo-section {
            gap: 0.5rem;
            padding-right: 0.75rem;
            border-right: none;
          }
          .logo-text {
            display: none;
          }
          .logo-wrapper {
            width: 80px;
            height: 50px;
          }
          .nav-actions {
            gap: 0.5rem;
          }
          .desktop-nav {
            display: none;
          }
          .user-profile {
            border-right: none;
            padding-right: 0;
            margin-right: 0;
          }
          .hide-on-mobile {
            display: none !important;
          }
        }

        @media print {
          .no-print {
            display: none !important;
          }
          header {
            position: relative !important;
            padding: 0 !important;
            border: none !important;
          }
        }
      `}</style>
    </header>
  );
}
