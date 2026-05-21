"use client";

import { motion } from "framer-motion";
import { Calculator, X } from "lucide-react";
import { toast } from "sonner";

interface DynamoModalProps {
  label: string;
  fieldId: string;
  dynamoValues: [string, string, string];
  setDynamoValues: (values: [string, string, string]) => void;
  onClose: () => void;
  onSave: (fieldId: string, value: string) => void;
}

export default function DynamoModal({
  label,
  fieldId,
  dynamoValues,
  setDynamoValues,
  onClose,
  onSave,
}: DynamoModalProps) {
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
          maxWidth: '400px', 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          border: '1px solid var(--border)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calculator size={24} className="text-primary" />
            <span>Inserir Medidas</span>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.5rem' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          Calculando média para: <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{label}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {dynamoValues.map((val, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--secondary)' }}>Medida {i + 1} (kgF)</label>
              <input 
                type="number" 
                step="0.01"
                value={val}
                onChange={(e) => {
                  const newVals: [string, string, string] = [...dynamoValues];
                  newVals[i] = e.target.value;
                  setDynamoValues(newVals);
                }}
                placeholder="0.00"
                autoFocus={i === 0}
                style={{ 
                  width: '100%', 
                  padding: '0.85rem', 
                  borderRadius: '0.75rem', 
                  border: '2px solid var(--border)',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  textAlign: 'center',
                  color: 'var(--secondary)',
                  outline: 'none',
                }}
              />
            </div>
          ))}
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button 
            onClick={() => {
              const values = dynamoValues.filter(v => v !== '' && !isNaN(Number(v))).map(Number);
              if (values.length > 0) {
                const avg = values.reduce((a, b) => a + b, 0) / values.length;
                onSave(fieldId, avg.toFixed(2));
                toast.success("Média calculada e inserida!");
                onClose();
              } else {
                toast.error("Insira ao menos uma medida válida.");
              }
            }}
            className="btn-primary"
            style={{ width: '100%', padding: '1rem', borderRadius: '1rem', fontWeight: '800', fontSize: '1rem' }}
          >
            Calcular Média e Inserir
          </button>
          <button 
            onClick={onClose}
            className="btn-action-outline"
            style={{ width: '100%', padding: '1rem', borderRadius: '1rem', fontWeight: '600' }}
          >
            Cancelar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
