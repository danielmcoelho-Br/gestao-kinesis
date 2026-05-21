"use client";

import { useEffect } from "react";
import { CopyX, Activity, ArrowLeft } from "lucide-react";

export default function AssessmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Assessment Erro capturado:", error);
  }, [error]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-secondary)' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ backgroundColor: 'white', padding: '3rem', borderRadius: '1.5rem', maxWidth: '600px', width: '100%', textAlign: 'center', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', position: 'relative' }}>
            <Activity size={64} style={{ color: 'var(--primary)', opacity: 0.2 }} />
            <CopyX size={32} style={{ color: '#ef4444', position: 'absolute', bottom: -5, right: '50%', marginRight: '-30px' }} />
          </div>
          
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--secondary)' }}>
            Falha ao Processar a Avaliação
          </h2>
          <p style={{ marginBottom: '2rem', fontSize: '1rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            Não conseguimos processar o formulário estrutural ou os cálculos de diagnóstico neste momento devido a um erro inesperado. Tente recarregar a interface clínica.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '0 auto' }}>
            <button
              onClick={() => reset()}
              className="btn-primary"
              style={{ padding: '1rem', fontSize: '1.05rem', fontWeight: '700' }}
            >
              Recarregar Avaliação
            </button>
            <button
              onClick={() => window.history.back()}
              className="btn-action-outline"
              style={{ padding: '0.8rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <ArrowLeft size={18} />
              Voltar ao Paciente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
