"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Image as ImageIcon } from "lucide-react";

export const Bar = memo(({ value, maxValue, label, color, subLabel, unit = 's', isPrint = false }: { value: number, maxValue: number, label: string, color: string, subLabel?: string, unit?: string, isPrint?: boolean }) => {
    let barColor = color;
    if (isPrint) {
        if (color === 'var(--primary)' || color.toLowerCase() === '#8b0000') barColor = '#8B0000';
        else if (color === 'var(--primary-light)' || color.toLowerCase() === '#fee2e2') barColor = '#fee2e2';
        else if (color === 'var(--secondary)') barColor = '#1e293b';
        else if (color === 'var(--secondary-light)') barColor = '#f1f5f9';
    }
    
    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ 
                height: '150px', 
                width: '100%', 
                minWidth: '60px',
                backgroundColor: 'var(--bg-secondary)', 
                borderRadius: '8px', 
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-end',
                overflow: 'hidden'
            }}>
                {isPrint ? (
                    <div style={{ 
                        height: `${(value / (maxValue || 1)) * 100}%`,
                        width: '100%', 
                        backgroundColor: barColor,
                        borderRadius: '4px 4px 0 0'
                    }} />
                ) : (
                    <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${(value / (maxValue || 1)) * 100}%` }}
                        style={{ 
                            width: '100%', 
                            backgroundColor: barColor,
                            borderRadius: '4px 4px 0 0'
                        }}
                    />
                )}
                <div style={{ 
                    position: 'absolute', 
                    top: value / (maxValue || 1) > 0.5 ? '50%' : 'auto',
                    bottom: value / (maxValue || 1) > 0.5 ? 'auto' : '10px',
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    fontSize: '0.8rem',
                    fontWeight: '800',
                    color: value / (maxValue || 1) > 0.5 ? '#fff' : 'var(--text)',
                    textShadow: value / (maxValue || 1) > 0.5 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                    zIndex: 1,
                    textAlign: 'center',
                    width: '100%'
                }}>
                    {value}{unit}
                </div>
            </div>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text)', lineHeight: 1.2 }}>{label}</div>
                {subLabel && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{subLabel}</div>}
            </div>
        </div>
    );
});

export const AssessmentHistoryChart = memo(({ 
    currentValue, 
    currentValueDir,
    fieldId,
    fieldIdDir, 
    chartTitle,
    unit = 'seg',
    history = [], 
    isPrint = false,
    referenceValue,
    referenceLabel,
    assessmentId,
    assessmentDate = new Date().toLocaleDateString('pt-BR')
}: { 
    currentValue?: number, 
    currentValueDir?: number,
    fieldId: string,
    fieldIdDir?: string,
    chartTitle: string,
    unit?: string,
    history?: any[], 
    isPrint?: boolean,
    referenceValue?: number,
    referenceLabel?: string,
    assessmentId?: string | null,
    assessmentDate?: string
}) => {
    // Current values
    const valEsq = Number(currentValue) || 0;
    const valDir = Number(currentValueDir) || 0;
    
    const validHistoryData = history
        .filter(h => h.id !== assessmentId)
        .map(h => {
            const vEsq = Number(h.answers?.[fieldId] || h.questionnaire_answers?.[fieldId]) || 0;
            const vDir = fieldIdDir ? Number(h.answers?.[fieldIdDir] || h.questionnaire_answers?.[fieldIdDir]) : 0;
            return {
                id: h.id,
                vEsq,
                vDir,
                date: new Date(h.created_at).toLocaleDateString('pt-BR'),
                timestamp: new Date(h.created_at).getTime()
            };
        })
        .filter(d => d.vEsq > 0 || d.vDir > 0)
        .sort((a, b) => a.timestamp - b.timestamp);

    if (!valEsq && !valDir && validHistoryData.length === 0) return null;

    const maxValue = Math.max(
        valEsq,
        valDir,
        referenceValue || 0,
        ...validHistoryData.map(d => Math.max(d.vEsq, d.vDir))
    ) * 1.2 || 60;

    return (
        <div className="chart-container">
            <h4 className="chart-title">
                <ImageIcon size={18} /> {chartTitle}
            </h4>
            <div className="chart-scroll-wrapper">
                <div className="chart-bars-container" style={{ position: 'relative' }}>
                    {referenceValue && (
                        <div style={{ 
                            position: 'absolute', 
                            left: 0, 
                            right: 0, 
                            bottom: `calc(${(referenceValue / (maxValue || 1)) * 150}px + 30px)`,
                            borderTop: '2px dashed #94a3b8',
                            zIndex: 5,
                            pointerEvents: 'none'
                        }}>
                            <span style={{ 
                                position: 'absolute', 
                                top: '-1.1rem', 
                                right: '10px', 
                                fontSize: '0.65rem', 
                                fontWeight: '800', 
                                color: '#64748b',
                                backgroundColor: 'rgba(255,255,255,0.9)',
                                padding: '1px 6px',
                                borderRadius: '4px'
                            }}>
                                {referenceLabel || 'Ref'}: {referenceValue}{unit}
                            </span>
                        </div>
                    )}
                    
                    {referenceValue && (
                        <Bar 
                            value={referenceValue} 
                            maxValue={maxValue}
                            label="Referência" 
                            unit={unit}
                            color="#cbd5e1" 
                            isPrint={isPrint}
                        />
                    )}

                    {validHistoryData.map((d: any) => (
                        <div key={d.id} className="history-pair" style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '100%' }}>
                            <Bar 
                                value={d.vEsq} 
                                maxValue={maxValue}
                                label={fieldIdDir ? "Esq" : "Avaliação"} 
                                subLabel={d.date}
                                unit={unit}
                                color={isPrint ? "#fee2e2" : "var(--primary-light)"} 
                                isPrint={isPrint}
                            />
                            {fieldIdDir && (
                                <Bar 
                                    value={d.vDir} 
                                    maxValue={maxValue}
                                    label="Dir" 
                                    subLabel={d.date}
                                    unit={unit}
                                    color={isPrint ? "#ef4444" : "var(--primary)"} 
                                    isPrint={isPrint}
                                />
                            )}
                        </div>
                    ))}

                    {(valEsq > 0 || valDir > 0) && (
                        <div className="history-pair current" style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '100%' }}>
                            <Bar 
                                value={valEsq} 
                                maxValue={maxValue}
                                label={fieldIdDir ? "Esq" : (assessmentId ? assessmentDate : "Hoje")} 
                                subLabel={fieldIdDir ? (assessmentId ? assessmentDate : "Hoje") : ""}
                                unit={unit}
                                color={isPrint ? "#8B0000" : (fieldIdDir ? "var(--primary-light)" : "var(--primary)")} 
                                isPrint={isPrint}
                            />
                            {fieldIdDir && (
                                <Bar 
                                    value={valDir} 
                                    maxValue={maxValue}
                                    label="Dir" 
                                    subLabel={assessmentId ? assessmentDate : "Hoje"}
                                    unit={unit}
                                    color={isPrint ? "#4B0000" : "var(--primary)"} 
                                    isPrint={isPrint}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
            <style jsx>{`
                .chart-container {
                    margin-top: 1rem;
                    margin-bottom: 1.5rem;
                    padding: 1.25rem;
                    background-color: white;
                    border-radius: 1rem;
                    border: 1px solid var(--border);
                    box-shadow: ${isPrint ? 'none' : 'var(--shadow-sm)'};
                }
                .chart-title {
                    font-size: 0.85rem;
                    font-weight: 700;
                    margin-bottom: 1.25rem;
                    color: var(--secondary);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .chart-scroll-wrapper {
                    overflow-x: auto;
                    padding-bottom: 0.5rem;
                }
                .chart-bars-container {
                    display: flex;
                    gap: 0.75rem;
                    align-items: flex-end;
                    min-height: 180px;
                    min-width: 250px;
                }
            `}</style>
        </div>
    );
});

export const FunctionalHistoryChart = memo(({ history = [], currentScore, type, isEmbedded = false, isPrint = false, assessmentId, assessmentDate = new Date().toLocaleDateString('pt-BR') }: { history: any[], currentScore: number, type: string, isEmbedded?: boolean, isPrint?: boolean, assessmentId?: string | null, assessmentDate?: string }) => {
    if (history.length === 0 && !currentScore) return null;

    const validHistory = history.filter(h => h.assessment_type === type && (h.scoreData?.percentage > 0 || h.clinical_data?.percentage > 0) && h.id !== assessmentId);

    const todayStr = new Date().toLocaleDateString('pt-BR');
    const rawData = [...validHistory.map(h => ({
        id: h.id,
        date: new Date(h.created_at).toLocaleDateString('pt-BR'),
        score: h.scoreData?.percentage || h.clinical_data?.percentage || 0,
        timestamp: new Date(h.created_at).getTime()
    })).sort((a, b) => a.timestamp - b.timestamp)];

    const isAlreadyInHistory = rawData.some(h => h.id === assessmentId || (h.date === todayStr && Math.abs(h.score - currentScore) < 0.1));
    
    if (currentScore > 0 && !isAlreadyInHistory) {
        rawData.push({ id: 'current', date: 'Hoje', score: currentScore, timestamp: Date.now() });
    }

    const dateCounts = new Map();
    rawData.forEach(item => {
        const dKey = item.date === 'Hoje' ? todayStr : item.date;
        dateCounts.set(dKey, (dateCounts.get(dKey) || 0) + 1);
    });

    const currentCounts = new Map();
    const processedData = rawData.map(item => {
        const dKey = item.date === 'Hoje' ? (assessmentId ? assessmentDate : todayStr) : item.date;
        const count = (currentCounts.get(dKey) || 0) + 1;
        currentCounts.set(dKey, count);
        let displayLabel = item.date === 'Hoje' ? (assessmentId ? assessmentDate : todayStr) : item.date;
        if (dateCounts.get(dKey) > 1) displayLabel = `${displayLabel} (${count})`;

        return { ...item, displayDate: displayLabel };
    });

    if (processedData.length === 0) return null;

    return (
        <div className={`history-chart-container ${isEmbedded ? 'embedded' : ''}`}>
            <h4 className="history-chart-title">Evolução Funcional (% Incapacidade - {type.toUpperCase()})</h4>
            <div className="history-chart-scroll">
                <div className="history-chart-bars">
                    {processedData.map((d, i) => (
                        <Bar 
                            key={i}
                            value={d.score}
                            maxValue={100}
                            label="Incap."
                            subLabel={d.displayDate}
                            color={d.id === 'current' || d.id === assessmentId ? 'var(--primary)' : 'var(--primary-light)'}
                            unit="%"
                            isPrint={isPrint}
                        />
                    ))}
                </div>
            </div>
            <style jsx>{`
                .history-chart-container { margin-top: 2rem; padding: 1.5rem; background-color: var(--bg-secondary); border-radius: 1rem; }
                .history-chart-container.embedded { margin-top: 0.5rem; padding: 1rem; background-color: var(--bg); border: 1px solid var(--border); transform-origin: top left; transform: scale(0.9); width: 111%; max-width: 600px; }
                .history-chart-title { font-size: 1rem; font-weight: 700; margin-bottom: 1.25rem; color: var(--secondary); }
                .history-chart-scroll { overflow-x: auto; padding-bottom: 0.5rem; }
                .history-chart-bars { display: flex; gap: 1rem; alignItems: flex-end; min-height: 180px; min-width: 300px; }
            `}</style>
        </div>
    );
});

export const AssessmentComparisonChart = memo(({ 
    label, leftValue, rightValue, unit = "kgF", normalityValue, isPrint = false, history = [], fieldId = '', fieldIdDir = '', assessmentId = null, assessmentDate = ''
}: { 
    label: string, leftValue: number, rightValue: number, unit?: string, normalityValue?: number, isPrint?: boolean, history?: any[], fieldId?: string, fieldIdDir?: string, assessmentId?: string | null, assessmentDate?: string
}) => {
    const validHistoryData = history
        .filter(h => h.id !== assessmentId)
        .map(h => ({
            id: h.id,
            vEsq: Number(String(h.answers?.[fieldId] || h.questionnaire_answers?.[fieldId] || '0').replace(',', '.')) || 0,
            vDir: fieldIdDir ? (Number(String(h.answers?.[fieldIdDir] || h.questionnaire_answers?.[fieldIdDir] || '0').replace(',', '.')) || 0) : 0,
            date: new Date(h.created_at).toLocaleDateString('pt-BR'),
            timestamp: new Date(h.created_at).getTime()
        }))
        .filter(d => d.vEsq > 0 || d.vDir > 0)
        .sort((a, b) => a.timestamp - b.timestamp);

    const allEsq = [...validHistoryData.map(d => ({ val: d.vEsq, label: d.date })), { val: leftValue, label: 'Atual' }].filter(d => d.val > 0);
    const allDir = [...validHistoryData.map(d => ({ val: d.vDir, label: d.date })), { val: rightValue, label: 'Atual' }].filter(d => d.val > 0);
    const maxValue = Math.max(leftValue, rightValue, normalityValue || 0, ...validHistoryData.map(d => Math.max(d.vEsq, d.vDir)), 1);

    return (
        <div className="comparison-chart-container" style={{ backgroundColor: 'white', padding: isPrint ? '0.75rem' : '1.25rem', borderRadius: '1rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
            <h5 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--secondary)', textAlign: 'center', fontWeight: '800' }}>{label}</h5>
            <div style={{ display: 'flex', height: isPrint ? '140px' : '180px', alignItems: 'flex-end', justifyContent: 'center', gap: '1rem', padding: '0.5rem 1rem', overflowX: 'auto' }}>
                {normalityValue && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '50px', height: '100%', opacity: 0.7 }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                            <div style={{ height: `${(normalityValue / maxValue) * 100}%`, width: '100%', backgroundColor: '#94a3b8', borderRadius: '4px 4px 0 0', position: 'relative', display: 'flex', justifyContent: 'center' }}>
                                <span style={{ position: 'absolute', top: '-18px', fontSize: '0.65rem', fontWeight: '800', color: '#64748b' }}>{normalityValue}{unit}</span>
                            </div>
                        </div>
                        <span style={{ fontSize: '0.55rem', marginTop: '0.4rem', fontWeight: '700', color: '#64748b' }}>NORMAL</span>
                    </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', borderLeft: '1px solid var(--border)', padding: '0 8px' }}>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', flex: 1 }}>
                        {allEsq.map((d, i) => (
                            <div key={`esq-${i}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '35px', height: '100%' }}>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                                    <div style={{ height: `${(d.val / maxValue) * 100}%`, width: '100%', backgroundColor: i === allEsq.length - 1 ? 'var(--primary-light)' : '#f3f4f6', border: i === allEsq.length - 1 ? '1px solid var(--primary-light)' : '1px solid #e5e7eb', borderRadius: '4px 4px 0 0', position: 'relative', display: 'flex', justifyContent: 'center' }}>
                                        <span style={{ position: 'absolute', top: '-18px', fontSize: '0.6rem', fontWeight: '800', color: 'var(--primary)' }}>{d.val}{unit}</span>
                                    </div>
                                </div>
                                <span style={{ fontSize: '0.45rem', marginTop: '0.4rem', color: 'var(--text-muted)' }}>{d.label === 'Atual' ? assessmentDate : d.label}</span>
                            </div>
                        ))}
                    </div>
                    <span style={{ fontSize: '0.55rem', fontWeight: '900', color: 'var(--primary)', marginTop: '4px' }}>ESQUERDA</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', borderLeft: '1px solid var(--border)', padding: '0 8px' }}>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', flex: 1 }}>
                        {allDir.map((d, i) => (
                            <div key={`dir-${i}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '35px', height: '100%' }}>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                                    <div style={{ height: `${(d.val / maxValue) * 100}%`, width: '100%', backgroundColor: i === allDir.length - 1 ? 'var(--primary)' : '#cbd5e0', borderRadius: '4px 4px 0 0', position: 'relative', display: 'flex', justifyContent: 'center' }}>
                                        <span style={{ position: 'absolute', top: '-18px', fontSize: '0.6rem', fontWeight: '800', color: 'white' }}>{d.val}{unit}</span>
                                    </div>
                                </div>
                                <span style={{ fontSize: '0.45rem', marginTop: '0.4rem', color: 'var(--text-muted)' }}>{d.label === 'Atual' ? assessmentDate : d.label}</span>
                            </div>
                        ))}
                    </div>
                    <span style={{ fontSize: '0.55rem', fontWeight: '900', color: 'var(--primary)', marginTop: '4px' }}>DIREITA</span>
                </div>
            </div>
        </div>
    );
});
