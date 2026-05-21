"use client";

import { useEffect } from "react";
import { AlertOctagon, RotateCcw } from "lucide-react";
import Header from "@/lab/components/Header";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard Erro capturado pelo Error Boundary:", error);
  }, [error]);

  return (
    <div className="dashboard-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '3rem', borderRadius: '1.5rem', maxWidth: '600px', width: '100%', textAlign: 'center', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
          <AlertOctagon size={64} style={{ margin: '0 auto 1.5rem', opacity: 0.9 }} />
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '1rem', letterSpacing: '-0.025em' }}>
            Oops! Algo não saiu como o esperado.
          </h2>
          <p style={{ marginBottom: '2rem', fontSize: '1.1rem', opacity: 0.8, lineHeight: '1.6' }}>
            Tivemos um problema técnico inesperado ao carregar esta página do painel. Mas não se preocupe, isso é temporário.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => reset()}
              className="btn-primary"
              style={{ padding: '0.875rem 2rem', fontSize: '1.1rem', backgroundColor: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RotateCcw size={20} />
              Tentar Novamente
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="btn-action-outline"
              style={{ padding: '0.875rem 2rem', fontSize: '1.1rem', borderColor: '#ef4444', color: '#dc2626' }}
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
