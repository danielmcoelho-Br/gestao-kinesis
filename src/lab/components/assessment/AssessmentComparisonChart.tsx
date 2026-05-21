"use client";

import { memo } from "react";

interface AssessmentComparisonChartProps {
    label: string; 
    leftValue: number; 
    rightValue: number;
    unit?: string;
    isPrint?: boolean;
    normValue?: number;
    history?: any[];
    fieldIdPrefix?: string;
}

const AssessmentComparisonChart = memo(({ 
    label, 
    leftValue, 
    rightValue,
    unit = "kgF",
    isPrint = false,
    normValue,
    history = [],
    fieldIdPrefix = ""
}: AssessmentComparisonChartProps) => {
    const maxValue = Math.max(leftValue, rightValue, normValue || 0, 1) * 1.1;
    const leftHeight = (leftValue / maxValue) * 100;
    const rightHeight = (rightValue / maxValue) * 100;
    const normHeight = normValue ? (normValue / maxValue) * 100 : 0;

    return (
        <div className="comparison-chart-container" style={{ 
            backgroundColor: 'white', 
            padding: isPrint ? '1rem' : '1.5rem', 
            borderRadius: '1.25rem', 
            border: '1px solid #e2e8f0',
            boxShadow: isPrint ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            width: '100%',
            maxWidth: '500px',
            margin: '0 auto',
            position: 'relative',
            pageBreakInside: 'avoid'
        }}>
            <h5 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--secondary)', textAlign: 'center', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
            </h5>
            
            <div style={{ position: 'relative', display: 'flex', height: '180px', alignItems: 'flex-end', justifyContent: 'center', gap: '2rem', padding: '1rem 0.5rem', marginTop: '1rem' }}>
                {/* Normative Bar (Far Left) */}
                {normValue && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px', height: '100%', zIndex: 2 }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                            <div 
                                style={{ 
                                    height: `${normHeight}%`,
                                    width: '100%', 
                                    backgroundColor: '#94a3b8', 
                                    borderRadius: '8px 8px 0 0',
                                    position: 'relative',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                                }}
                            >
                                <span style={{ position: 'absolute', top: '-25px', fontSize: '0.85rem', fontWeight: '900', color: '#64748b' }}>{normValue}</span>
                            </div>
                        </div>
                        <span style={{ fontSize: '0.75rem', marginTop: '0.75rem', fontWeight: '800', color: '#64748b' }}>NORMAL</span>
                    </div>
                )}

                {/* Left Bar */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px', height: '100%', zIndex: 2 }}>
                     <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                        <div 
                            style={{ 
                                height: `${leftHeight}%`,
                                width: '100%', 
                                backgroundColor: 'var(--primary)', 
                                borderRadius: '8px 8px 0 0',
                                position: 'relative',
                                display: 'flex',
                                justifyContent: 'center',
                                boxShadow: '0 4px 6px -1px rgba(139, 0, 0, 0.1)'
                            }}
                        >
                            <span style={{ position: 'absolute', top: '-28px', fontSize: '0.9rem', fontWeight: '900', color: 'var(--primary)' }}>{leftValue}</span>
                        </div>
                     </div>
                     <span style={{ fontSize: '0.85rem', marginTop: '0.75rem', fontWeight: '900', color: 'var(--secondary)' }}>ESQUERDA</span>
                </div>

                {/* Right Bar */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px', height: '100%', zIndex: 2 }}>
                     <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                        <div 
                            style={{ 
                                height: `${rightHeight}%`,
                                width: '100%', 
                                backgroundColor: '#f87171', 
                                borderRadius: '8px 8px 0 0',
                                position: 'relative',
                                display: 'flex',
                                justifyContent: 'center',
                                boxShadow: '0 4px 6px -1px rgba(139, 0, 0, 0.2)'
                            }}
                        >
                            <span style={{ position: 'absolute', top: '-28px', fontSize: '0.9rem', fontWeight: '900', color: '#b91c1c' }}>{rightValue}</span>
                        </div>
                     </div>
                     <span style={{ fontSize: '0.85rem', marginTop: '0.75rem', fontWeight: '900', color: 'var(--secondary)' }}>DIREITA</span>
                </div>
            </div>

            {/* Historical Legend/Trend if available */}
            {history.length > 1 && (
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>
                    * Gráfico comparativo baseado na avaliação atual e metas clínicas.
                </div>
            )}
        </div>
    );
});

export default AssessmentComparisonChart;
