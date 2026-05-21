"use client";

import { motion } from "framer-motion";
import { Activity, Info, Zap, Move, Lightbulb } from "lucide-react";
import { getTherapeuticSuggestions, SuggestionGroup } from "@/lab/utils/therapeuticRules";

interface SmartSuggestionsProps {
  questionnaireId: string;
  answers: Record<string, any>;
  isPrint?: boolean;
}

const categoryIcons: Record<string, any> = {
  'Fortalecimento': <Activity size={20} />,
  'Mobilidade': <Move size={20} />,
  'Manual': <Zap size={20} />,
  'Educação': <Info size={20} />
};

const categoryColors: Record<string, string> = {
  'Fortalecimento': '#8b0000',
  'Mobilidade': '#0ea5e9',
  'Manual': '#8b5cf6',
  'Educação': '#f59e0b'
};

export default function SmartSuggestions({ questionnaireId, answers, isPrint = false }: SmartSuggestionsProps) {
  const groups = getTherapeuticSuggestions(questionnaireId, answers);

  if (groups.length === 0) return null;

  return (
    <div className="smart-suggestions" style={{ 
      marginTop: isPrint ? '2rem' : '3rem',
      marginBottom: '2rem',
      pageBreakInside: 'avoid'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          borderRadius: '10px', 
          backgroundColor: '#8b000015', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#8b0000'
        }}>
          <Lightbulb size={24} />
        </div>
        <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--text)', margin: 0 }}>
          Sugestão Terapêutica Inteligente
        </h3>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isPrint ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '1.25rem' 
      }}>
        {groups.map((group, gIdx) => (
          <motion.div
            key={group.category}
            initial={isPrint ? {} : { opacity: 0, y: 20 }}
            animate={isPrint ? {} : { opacity: 1, y: 0 }}
            transition={{ delay: gIdx * 0.1 }}
            style={{
              padding: '1.5rem',
              borderRadius: '1.25rem',
              backgroundColor: isPrint ? '#f8fafc' : 'white',
              border: '1px solid #e2e8f0',
              boxShadow: isPrint ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              borderTop: `4px solid ${categoryColors[group.category] || '#ccc'}`
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              color: categoryColors[group.category], 
              marginBottom: '1rem',
              fontWeight: '800',
              fontSize: '0.9rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {categoryIcons[group.category]}
              {group.category}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {group.items.map((item) => (
                <div key={item.id}>
                  <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text)', marginBottom: '0.25rem' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                    {item.description}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
      
      {!isPrint && (
        <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          * Estas sugestões são baseadas nos achados clínicos desta avaliação e servem apenas como apoio à decisão fisioterapêutica.
        </p>
      )}
    </div>
  );
}
