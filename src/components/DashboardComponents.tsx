"use client";

import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, DollarSign, Calendar } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  isCurrency?: boolean;
  children?: React.ReactNode;
}

export function MetricCard({ title, value, icon, color, isCurrency, children }: MetricCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className={`card metric-card ${isExpanded ? 'expanded' : ''}`} 
      onClick={() => setIsExpanded(!isExpanded)}
      style={{ 
        cursor: 'pointer', 
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.5px' }}>{title}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            {isCurrency ? `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : value}
          </div>
        </div>
        <div style={{ padding: '10px', borderRadius: '12px', background: `${color}15`, color: color }}>
          {icon}
        </div>
      </div>

      {children && (
        <div 
          className={`chart-container-inner ${isExpanded ? 'is-expanded' : 'is-collapsed'}`} 
          style={!isExpanded ? {
            position: 'absolute',
            top: '-9999px',
            left: '-9999px',
            width: '800px', // Give it a base width to render
            height: '350px',
            pointerEvents: 'none',
            visibility: 'hidden'
          } : {}}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface ComparisonItemProps {
  label?: string;
  current: number;
  prev: number;
  isQty?: boolean;
}

export function ComparisonItem({ label, current, prev, isQty }: ComparisonItemProps) {
  const diff = current - prev;
  const pct = prev !== 0 ? (diff / prev) * 100 : 0;
  const isPositive = diff >= 0;

  return (
    <div style={{ padding: label ? '12px' : '0', borderRadius: '12px', background: label ? 'var(--bg-color)' : 'transparent', border: label ? '1px solid var(--border-color)' : 'none', textAlign: label ? 'left' : 'center' }}>
      {label && <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</div>}
      <div style={{ display: 'flex', justifyContent: label ? 'space-between' : 'center', alignItems: 'center', gap: '8px', flexDirection: label ? 'row' : 'column' }}>
        <div style={{ fontWeight: 'bold', fontSize: label ? '1rem' : '0.95rem' }}>
          {isPositive ? '+' : ''}{isQty ? diff : `R$ ${diff.toLocaleString('pt-BR')}`}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isPositive ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold', fontSize: '0.75rem' }}>
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(pct).toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

interface StatusBoxProps {
  label: string;
  count: number;
  color: string;
  noBorder?: boolean;
}

export function StatusBox({ label, count, color, noBorder }: StatusBoxProps) {
  return (
    <div style={{ 
      padding: '12px', 
      borderRadius: '12px', 
      border: noBorder ? 'none' : `1px solid ${color}44`, 
      background: noBorder ? 'transparent' : `${color}08`, 
      textAlign: 'center' 
    }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color }}>{count}</div>
    </div>
  );
}

interface TemporalComparisonGridProps {
  data: any;
  compLastMonth: any;
  compLastYear: any;
  ytd: any;
  accSessionsCurrent: number;
  accSessionsPrev: number;
}

export function TemporalComparisonGrid({ data, compLastMonth, compLastYear, ytd, accSessionsCurrent, accSessionsPrev }: TemporalComparisonGridProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {/* Header */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '200px repeat(3, 1fr)', 
        padding: '12px', 
        background: 'rgba(0,0,0,0.02)', 
        borderRadius: '8px', 
        marginBottom: '8px', 
        fontSize: '0.75rem', 
        fontWeight: '800', 
        textTransform: 'uppercase', 
        color: 'var(--text-secondary)', 
        letterSpacing: '0.5px' 
      }}>
        <div>Indicador</div>
        <div style={{ textAlign: 'center' }}>Vs. Mês Anterior</div>
        <div style={{ textAlign: 'center' }}>Vs. Ano Anterior (Mês)</div>
        <div style={{ textAlign: 'center' }}>Acumulado (YTD)</div>
      </div>

      {/* Linha Financeiro */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px repeat(3, 1fr)', alignItems: 'center', padding: '16px 12px', borderBottom: '1px solid var(--border-color)', background: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', color: 'var(--primary)' }}>
          <DollarSign size={18} /> Financeiro (R$)
        </div>
        <ComparisonItem current={data.grossValue} prev={compLastMonth.grossValue} />
        <ComparisonItem current={data.grossValue} prev={compLastYear.grossValue} />
        <ComparisonItem current={ytd?.current?.grossValue || 0} prev={ytd?.prev?.grossValue || 0} />
      </div>

      {/* Linha Sessões */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px repeat(3, 1fr)', alignItems: 'center', padding: '16px 12px', background: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', color: '#ec4899' }}>
          <Calendar size={18} /> Sessões (Qtd)
        </div>
        <ComparisonItem current={data.statusSummary?.finalizado || 0} prev={compLastMonth.statusSummary?.finalizado || 0} isQty />
        <ComparisonItem current={data.statusSummary?.finalizado || 0} prev={compLastYear.statusSummary?.finalizado || 0} isQty />
        <ComparisonItem current={accSessionsCurrent} prev={accSessionsPrev} isQty />
      </div>
    </div>
  );
}
