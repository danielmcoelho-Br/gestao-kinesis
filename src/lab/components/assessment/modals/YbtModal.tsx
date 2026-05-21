"use client";

import { motion } from "framer-motion";
import { Calculator, X, ArrowUp, ArrowDownLeft, ArrowDownRight, Ruler } from "lucide-react";
import { toast } from "sonner";

interface YbtModalProps {
  ybtValues: {
    anterior: string;
    postMedial: string;
    postLateral: string;
    limbLength: string;
    side: 'esq' | 'dir';
  };
  setYbtValues: (values: any) => void;
  onClose: () => void;
  onSave: (fieldId: string, value: string) => void;
}

export default function YbtModal({
  ybtValues,
  setYbtValues,
  onClose,
  onSave,
}: YbtModalProps) {
  const { anterior, postMedial, postLateral, limbLength, side } = ybtValues;
  const sum = Number(anterior) + Number(postMedial) + Number(postLateral);
  const len = Number(limbLength);
  const hasValidValues = sum > 0 && len > 0;
  const currentResult = hasValidValues ? ((sum / (3 * len)) * 100).toFixed(1) + '%' : '0.0%';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: '1rem' }}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="modal-content"
        style={{ 
          backgroundColor: 'white', 
          padding: '2rem', 
          borderRadius: '1.5rem', 
          width: '100%', 
          maxWidth: '500px', 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          border: '1px solid var(--border)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calculator size={24} className="text-primary" />
            <span>Calculadora Y-Balance Test</span>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.5rem' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', backgroundColor: 'var(--bg-secondary)', padding: '4px', borderRadius: '1rem', marginBottom: '0.5rem' }}>
          <button 
            onClick={() => setYbtValues((prev: any) => ({ ...prev, side: 'esq' }))}
            style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: 'none', backgroundColor: side === 'esq' ? 'white' : 'transparent', color: side === 'esq' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '700', boxShadow: side === 'esq' ? 'var(--shadow-sm)' : 'none', transition: 'all 0.2s' }}
          >
            Membro Esquerdo
          </button>
          <button 
            onClick={() => setYbtValues((prev: any) => ({ ...prev, side: 'dir' }))}
            style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: 'none', backgroundColor: side === 'dir' ? 'white' : 'transparent', color: side === 'dir' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '700', boxShadow: side === 'dir' ? 'white' : 'none', transition: 'all 0.2s' }}
          >
            Membro Direito
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative', padding: '1rem 0' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '120px', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <ArrowUp size={16} className="text-primary" />
                <label style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--secondary)' }}>Anterior</label>
              </div>
              <input 
                type="number" 
                value={anterior}
                onChange={(e) => setYbtValues((prev: any) => ({ ...prev, anterior: e.target.value }))}
                placeholder="0.0"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '2px solid var(--border)', fontSize: '1.1rem', textAlign: 'center', fontWeight: '800' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <div style={{ width: '140px', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <ArrowDownLeft size={16} className="text-primary" />
                <label style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--secondary)' }}>Post-Lateral</label>
              </div>
              <input 
                type="number" 
                value={postLateral}
                onChange={(e) => setYbtValues((prev: any) => ({ ...prev, postLateral: e.target.value }))}
                placeholder="0.0"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '2px solid var(--border)', fontSize: '1.1rem', textAlign: 'center', fontWeight: '800' }}
              />
            </div>
            <div style={{ width: '140px', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <ArrowDownRight size={16} className="text-primary" />
                <label style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--secondary)' }}>Post-Medial</label>
              </div>
              <input 
                type="number" 
                value={postMedial}
                onChange={(e) => setYbtValues((prev: any) => ({ ...prev, postMedial: e.target.value }))}
                placeholder="0.0"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '2px solid var(--border)', fontSize: '1.1rem', textAlign: 'center', fontWeight: '800' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', border: '1px solid var(--border)' }}>
            <Ruler size={20} className="text-muted" />
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Tamanho do Membro (cm)</label>
              <input 
                type="number" 
                value={limbLength}
                onChange={(e) => setYbtValues((prev: any) => ({ ...prev, limbLength: e.target.value }))}
                placeholder="Ex: 85.0"
                style={{ width: '100%', padding: '0.5rem 0', background: 'transparent', border: 'none', borderBottom: '2px solid var(--primary)', fontSize: '1.25rem', fontWeight: '800', outline: 'none' }}
              />
            </div>
          </div>
        </div>

        <div style={{ padding: '1.25rem', backgroundColor: 'var(--primary-light)', borderRadius: '1.5rem', textAlign: 'center', border: '2px solid var(--primary)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '800' }}>Resultado Final YBT</div>
          <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--primary)', letterSpacing: '-1px' }}>
            {currentResult}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button 
            onClick={() => {
              if (hasValidValues) {
                const result = ((sum / (3 * len)) * 100).toFixed(1);
                onSave(`ybt_${side}`, result);
                toast.success(`Resultado ${side === 'esq' ? 'Esquerdo' : 'Direito'} inserido!`);
                onClose();
              } else {
                toast.error("Preencha todos os valores para calcular.");
              }
            }}
            className="btn-primary"
            style={{ width: '100%', padding: '1.1rem', borderRadius: '1.25rem', fontWeight: '900', fontSize: '1.1rem' }}
          >
            Confirmar e Salvar
          </button>
          <button onClick={onClose} className="btn-action-outline" style={{ width: '100%', padding: '1rem', borderRadius: '1.25rem', fontWeight: '700' }}>
            Cancelar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
