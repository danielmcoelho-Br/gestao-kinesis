"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NotificationBanner() {
  const [status, setStatus] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // Buscar perfil do usuário para verificar a role
    fetch("/api/profile")
      .then(res => res.json())
      .then(profile => {
        if (profile.id) {
          setUser(profile);
        }
      })
      .catch(err => console.error("Erro ao buscar perfil:", err));

    // Buscar status de notificações
    fetch("/api/gestao/notifications")
      .then(res => res.json())
      .then(data => {
        setStatus(data);
      })
      .catch(err => console.error("Erro ao buscar notificações:", err))
      .finally(() => setLoading(false));

    // Verificar se foi dispensado nesta sessão
    const isDismissed = sessionStorage.getItem("weekly-notification-dismissed") === "true";
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);

  // Se o usuário for SECRETARIA, não exibe as notificações de extratos/atendimentos/perfil
  const isSecretaria = user?.role?.toUpperCase() === "SECRETARIA";

  // Não exibe se estiver carregando, se foi dispensado, se estiver na tela de upload, ou se for secretaria
  if (loading || dismissed || pathname === "/upload" || isSecretaria || !status?.hasPending) {
    return null;
  }

  const handleDismiss = () => {
    sessionStorage.setItem("weekly-notification-dismissed", "true");
    setDismissed(true);
  };

  const pendingItems = [];
  if (!status.status.extratos.uploaded) pendingItems.push("Extratos Bancários");
  if (!status.status.atendimentos.uploaded) pendingItems.push("Atendimentos (SeuFisio)");
  if (!status.status.perfil.uploaded) pendingItems.push("Perfil dos Pacientes");

  if (pendingItems.length === 0) return null;

  // Formatar data da última sexta-feira
  const lastFridayDate = new Date(status.lastFriday);
  const formattedFriday = lastFridayDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit"
  });

  return (
    <div 
      style={{
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.09) 0%, rgba(239, 68, 68, 0.03) 100%)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        borderRadius: '16px',
        padding: '16px 24px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        boxShadow: '0 4px 20px rgba(239, 68, 68, 0.05)',
        backdropFilter: 'blur(8px)',
        position: 'relative',
        transition: 'all 0.3s ease',
      }}
      className="no-print"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          color: '#ef4444',
          borderRadius: '12px',
          padding: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.1)'
        }}>
          <AlertTriangle size={20} />
        </div>
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>
            Atualização Semanal Necessária
          </h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: '1.4' }}>
            Por favor, insira os dados de <strong>{pendingItems.join(", ")}</strong> referentes à rotina de sexta-feira ({formattedFriday}).
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link 
          href="/upload" 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 18px',
            fontSize: '0.85rem',
            fontWeight: '600',
            textDecoration: 'none',
            transition: 'all 0.2s',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#dc2626';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = '#ef4444';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Importar Agora <ArrowRight size={16} />
        </Link>
        <button 
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
            e.currentTarget.style.color = '#475569';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#94a3b8';
          }}
          title="Ignorar aviso nesta sessão"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
