"use client";

import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  isCurrency?: boolean;
  color: string;
}

export function MetricCard({ title, value, icon, isCurrency, color }: MetricCardProps) {
  return (
    <div className="card" style={{ borderLeft: `4px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{title}</span>
        <div style={{ color }}>{icon}</div>
      </div>
      <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
        {isCurrency ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : value}
      </div>
    </div>
  );
}

interface ComparisonItemProps {
  label: string;
  current: number;
  prev: number;
  isQty?: boolean;
}

export function ComparisonItem({ label, current, prev, isQty }: ComparisonItemProps) {
  const diff = current - prev;
  const pct = prev !== 0 ? (diff / prev) * 100 : 0;
  const isPositive = diff >= 0;

  return (
    <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>
          {isPositive ? '+' : ''}{isQty ? diff : `R$ ${diff.toLocaleString('pt-BR')}`}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isPositive ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold', fontSize: '0.8rem' }}>
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
}

export function StatusBox({ label, count, color }: StatusBoxProps) {
  return (
    <div style={{ padding: '12px', borderRadius: '12px', border: `1px solid ${color}44`, background: `${color}08`, textAlign: 'center' }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color }}>{count}</div>
    </div>
  );
}
