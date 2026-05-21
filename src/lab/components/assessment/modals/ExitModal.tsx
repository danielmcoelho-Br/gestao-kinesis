"use client";

import { motion } from "framer-motion";
import { X, Save } from "lucide-react";

interface ExitModalProps {
  onConfirmSave: () => void;
  onConfirmDiscard: () => void;
  onCancel: () => void;
}

export default function ExitModal({ onConfirmSave, onConfirmDiscard, onCancel }: ExitModalProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)' }}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="modal-content" 
        style={{ maxWidth: '450px', width: '90%', padding: '2rem', textAlign: 'center', backgroundColor: 'white', borderRadius: '1.5rem', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}
      >
        <div style={{ backgroundColor: '#fef3c7', color: '#d97706', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <X size={30} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--secondary)' }}>Sair da Avaliação?</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2.25rem', lineHeight: '1.6' }}>
          Você possui alterações que ainda não foram salvas permanentemente. Deseja salvar um rascunho para continuar depois?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button 
            onClick={onConfirmSave}
            className="btn-primary"
            style={{ width: '100%', padding: '1rem', borderRadius: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Save size={18} /> Sim, Salvar Rascunho
          </button>
          <button 
            onClick={onConfirmDiscard}
            className="btn-action-outline"
            style={{ width: '100%', padding: '1rem', borderRadius: '1rem', fontWeight: '700', color: '#ef4444', borderColor: '#ef4444' }}
          >
            Não, Descartar e Sair
          </button>
          <button 
            onClick={onCancel}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: '600', cursor: 'pointer', marginTop: '0.5rem', padding: '0.5rem' }}
          >
            Cancelar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
