"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Home, LogOut, User } from "lucide-react";
import { toast } from "sonner";

export default function MarketingHeader() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then(res => res.json())
      .then(data => {
        if (data.id) setUser(data);
      });
  }, []);

  const handleLogout = async () => {
    toast.info("Até logo!");
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #e2e8f0',
      padding: '1rem 2rem',
      width: '100%'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Logo Section */}
        <div 
          onClick={() => router.push('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: 'var(--primary, #A31621)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '1.2rem'
          }}>
            K
          </div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>
            Kinesis<span style={{ color: 'var(--primary, #A31621)' }}>Marketing IA</span>
          </h1>
        </div>

        {/* Navigation Actions */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => router.push('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#475569',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            <Home size={16} />
            <span>Central Hub</span>
          </button>

          {user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              paddingRight: '12px',
              borderRight: '1px solid #e2e8f0'
            }}>
              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748b' }}>
                <div style={{ fontWeight: 700, color: '#334155' }}>{user.name}</div>
                <div>{user.role}</div>
              </div>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-light, #fee2e2)',
                color: 'var(--primary, #A31621)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <User size={16} />
              </div>
            </div>
          )}

          <button 
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#ef4444',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            <LogOut size={16} />
            <span>Sair</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
