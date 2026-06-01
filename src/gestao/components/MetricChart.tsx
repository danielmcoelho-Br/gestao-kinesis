"use client";

import React, { useMemo, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList
} from 'recharts';

const monthsNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const YEAR_COLORS: Record<number, string> = {
  2026: '#6366f1',
  2025: '#8b5cf6',
  2024: '#f59e0b',
  2023: '#10b981',
  2022: '#ef4444',
  2021: '#3b82f6',
  2020: '#ec4899',
  2019: '#64748b',
};

interface MetricChartProps {
  history: any[];
  dataKey: string;
  type: string;
  isCurrency?: boolean;
  isDecimal?: boolean;
  isAccumulated?: boolean;
}

export function MetricChart({ history, dataKey, type, isCurrency, isDecimal, isAccumulated }: MetricChartProps) {
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const years = useMemo(() => history.map((h: any) => h.year), [history]);
  const [selectedYears, setSelectedYears] = useState<number[]>([currentYear, currentYear - 1]);

  const chartData = useMemo(() => {
    return Array.from({ length: 12 }, (_, m) => {
      const entry: any = { month: m };
      history.forEach((h: any) => {
        if (isAccumulated) {
          let sum = 0;
          let lastMonthWithData = -1;
          for (let i = 0; i < 12; i++) {
            const mData = h.data[i][type];
            const keys = dataKey.split('.');
            let val = mData;
            for (const k of keys) { if (val) val = val[k]; }
            if (val > 0) lastMonthWithData = i;
          }

          if (m > lastMonthWithData) {
            entry[`year_${h.year}`] = null;
          } else {
            for (let i = 0; i <= m; i++) {
              const mData = h.data[i][type];
              const keys = dataKey.split('.');
              let val = mData;
              for (const k of keys) { if (val) val = val[k]; }
              sum += (val || 0);
            }
            entry[`year_${h.year}`] = sum;
          }
        } else {
          const mData = h.data[m][type];
          const keys = dataKey.split('.');
          let val = mData;
          for (const k of keys) { if (val) val = val[k]; }
          entry[`year_${h.year}`] = val > 0 ? val : null;
        }
      });
      return entry;
    });
  }, [history, type, dataKey, isAccumulated]);

  const toggleYear = (y: number) => {
    setSelectedYears(prev => prev.includes(y) ? prev.filter(a => a !== y) : [...prev, y]);
  };

  return (
    <div style={{ display: 'flex', gap: '24px', height: '100%' }}>
      {/* Painel Lateral de Filtros */}
      <div style={{ width: '140px', borderRight: '1px solid var(--border-color)', paddingRight: '16px' }}>
        <p style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '16px', color: 'var(--text-secondary)', letterSpacing: '1px' }}>Comparar Anos</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {years.map((y: number) => (
            <label key={y} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '6px 8px', borderRadius: '8px', background: selectedYears.includes(y) ? `${YEAR_COLORS[y] || '#ccc'}10` : 'transparent', transition: 'all 0.2s' }}>
              <input type="checkbox" checked={selectedYears.includes(y)} onChange={() => toggleYear(y)} style={{ width: '16px', height: '16px', accentColor: YEAR_COLORS[y] || '#666' }} />
              <span style={{ fontWeight: selectedYears.includes(y) ? '700' : '500', color: selectedYears.includes(y) ? (YEAR_COLORS[y] || '#666') : 'var(--text-secondary)', fontSize: '0.9rem' }}>{y}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Área do Gráfico */}
      <div style={{ flex: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 35, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="month" tickFormatter={(m) => monthsNames[m]} fontSize={11} tick={{ fill: 'var(--text-secondary)' }} />
            <YAxis fontSize={11} tick={{ fill: 'var(--text-secondary)' }} tickFormatter={(v) => isCurrency ? `R$${Math.round(v/1000)}k` : v} />
            <Tooltip 
              formatter={(value: any, name: any) => [
                value ? (isCurrency ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : isDecimal ? value.toFixed(1) : value) : 'N/A',
                `Ano ${(name as string).replace('year_', '')}`
              ]}
              labelFormatter={(m: any) => `Mês: ${monthsNames[m]}`}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '12px' }}
            />
            {selectedYears.map((y) => {
              const yearColor = YEAR_COLORS[y] || '#cbd5e1';
              return (
                <Line 
                  key={y} 
                  type="monotone" 
                  dataKey={`year_${y}`} 
                  name={`Ano ${y}`} 
                  stroke={yearColor} 
                  strokeWidth={y === currentYear ? 4 : 2} 
                  dot={{ r: 4, fill: yearColor, strokeWidth: 1, stroke: '#fff' }} 
                  activeDot={{ r: 6 }} 
                  connectNulls={false}
                  isAnimationActive={false}
                >
                  <LabelList 
                    dataKey={`year_${y}`} 
                    position="top" 
                    fontSize={10} 
                    offset={12} 
                    formatter={(v: any) => !v ? '' : isCurrency ? `R$${Math.round(v).toLocaleString('pt-BR')}` : isDecimal ? v.toFixed(1) : v} 
                    style={{ fill: yearColor, fontWeight: '700' }} 
                  />
                </Line>
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
