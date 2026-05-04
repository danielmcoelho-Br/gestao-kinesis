"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2, ChevronRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao fazer login");
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '20px'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '420px', 
        background: 'white', 
        padding: '40px', 
        borderRadius: '24px', 
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid rgba(255,255,255,0.8)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            background: 'var(--primary)', 
            borderRadius: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 20px',
            boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)'
          }}>
            <Lock color="white" size={28} />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b', letterSpacing: '-0.5px' }}>Gestão Kinesis</h1>
          <p style={{ color: '#64748b', marginTop: '8px', fontSize: '0.95rem' }}>Acesse sua conta para gerenciar a clínica</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>E-mail</label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@kinesis.com.br"
                style={{ 
                  width: '100%', 
                  padding: '12px 12px 12px 40px', 
                  borderRadius: '12px', 
                  border: '1.5px solid #e2e8f0', 
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Senha</label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ 
                  width: '100%', 
                  padding: '12px 12px 12px 40px', 
                  borderRadius: '12px', 
                  border: '1.5px solid #e2e8f0', 
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          </div>

          {error && (
            <div style={{ 
              padding: '12px', 
              background: '#fef2f2', 
              border: '1px solid #fee2e2', 
              borderRadius: '10px', 
              color: '#ef4444', 
              fontSize: '0.85rem',
              fontWeight: '500',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              marginTop: '10px',
              padding: '14px', 
              background: 'var(--primary)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '12px', 
              fontSize: '1rem', 
              fontWeight: '700', 
              cursor: loading ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.4)',
              transition: 'transform 0.2s, background 0.2s'
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <>Entrar <ChevronRight size={18} /></>}
          </button>
        </form>

        <div style={{ marginTop: '30px', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Problemas com acesso? <br /> Entre em contato com o suporte.
          </p>
        </div>
      </div>
    </div>
  );
}
