"use client";

import { motion } from "framer-motion";
import { AlertTriangle, ChevronRight, ArrowLeft } from "lucide-react";

interface MyelopathyModalProps {
  onConfirmNegative: () => void;
  onCancel: () => void;
}

export default function MyelopathyModal({ onConfirmNegative, onCancel }: MyelopathyModalProps) {
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
        style={{ maxWidth: '480px', width: '90%', padding: '2rem', textAlign: 'center', backgroundColor: 'white', borderRadius: '1.5rem', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}
      >
        <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <AlertTriangle size={30} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem', color: '#1e293b' }}>Atenção: Hiperreflexia Detectada</h2>
        <p style={{ color: '#475569', marginBottom: '2rem', lineHeight: '1.6', fontSize: '0.95rem' }}>
          Você selecionou <strong>Hiperreflexia</strong>. É altamente recomendável avaliar e registrar os reflexos patológicos e testes especiais (Hoffmann, Babinski, Clonus, Claudicação Neurogênica).
          <br /><br />
          Você realizou estes testes e eles deram negativos?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button 
            onClick={onConfirmNegative}
            className="btn-primary"
            style={{ width: '100%', padding: '1rem', borderRadius: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#ef4444' }}
          >
            <ChevronRight size={18} /> Sim, Testados e Negativos
          </button>
          <button 
            onClick={onCancel}
            className="btn-action-outline"
            style={{ width: '100%', padding: '1rem', borderRadius: '1rem', fontWeight: '700', color: '#475569', borderColor: '#cbd5e1' }}
          >
            <ArrowLeft size={18} style={{ marginRight: '8px' }} /> Voltar para Avaliar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
