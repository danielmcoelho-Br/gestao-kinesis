"use client";

import { motion } from "framer-motion";
import { History as HistoryIcon } from "lucide-react";

interface DraftModalProps {
  onRecover: () => void;
  onDiscard: () => void;
}

export default function DraftModal({ onRecover, onDiscard }: DraftModalProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="modal-content" 
        style={{ maxWidth: '450px', width: '90%', padding: '2rem', textAlign: 'center', backgroundColor: 'white', borderRadius: '1.5rem', boxShadow: 'var(--shadow-lg)' }}
      >
        <div style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <HistoryIcon size={30} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--secondary)' }}>Rascunho Detectado</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
          Identificamos um rascunho de avaliação que não foi finalizado. Como deseja prosseguir?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button 
            onClick={onRecover}
            className="btn-primary"
            style={{ width: '100%', padding: '0.85rem' }}
          >
            Recuperar Dados Salvos
          </button>
          <button 
            onClick={onDiscard}
            className="btn-action-outline"
            style={{ width: '100%', padding: '0.85rem', color: '#ef4444', borderColor: '#ef4444' }}
          >
            Iniciar Novo Formulário
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
