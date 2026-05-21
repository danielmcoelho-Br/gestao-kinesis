"use client";

import { useState } from "react";
import { Users, ShieldCheck } from "lucide-react";
import UsuariosPageContent from "./usuarios/page_content";
import ProfissionaisPageContent from "../profissionais/page_content";
import { ReportHeader } from "@/gestao/components/ReportHeader";

export default function AdminCentralPage() {
  const [activeTab, setActiveTab] = useState<'usuarios' | 'regras'>('usuarios');

  const tabs = [
    { id: 'usuarios', label: 'Gestão de Usuários', icon: Users, color: '#6366f1' },
    { id: 'regras', label: 'Regras de Profissionais', icon: ShieldCheck, color: '#8b5cf6' },
  ] as const;

  return (
    <div className="dashboard-container">
      <div style={{ marginBottom: '40px' }}>
        <ReportHeader title="Configurações do Sistema" />
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '8px' }}>
          Gerencie permissões de acesso e regras financeiras dos profissionais.
        </p>
      </div>
      
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '40px',
        padding: '8px',
        background: 'rgba(0,0,0,0.02)',
        borderRadius: '20px',
        width: 'fit-content'
      }}>
        {tabs.map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 28px',
              borderRadius: '16px',
              border: 'none',
              background: activeTab === tab.id ? 'white' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: activeTab === tab.id ? '0 10px 15px -3px rgba(0,0,0,0.05)' : 'none',
              fontSize: '0.95rem'
            }}
          >
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '8px', 
              background: activeTab === tab.id ? `${tab.color}15` : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: activeTab === tab.id ? tab.color : 'inherit'
            }}>
              <tab.icon size={20} />
            </div>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="admin-content-fade">
        {activeTab === 'usuarios' && <UsuariosPageContent />}
        {activeTab === 'regras' && <ProfissionaisPageContent />}
      </div>

      <style jsx>{`
        .admin-content-fade {
          animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
