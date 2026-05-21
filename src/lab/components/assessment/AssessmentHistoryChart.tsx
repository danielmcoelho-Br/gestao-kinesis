"use client";

import { Image as ImageIcon } from "lucide-react";
import Bar from "./Bar";

interface AssessmentHistoryChartProps {
    currentValue: number;
    fieldId?: string;
    chartTitle: string;
    unit?: string;
    history?: any[];
    isPrint?: boolean;
    referenceValue?: number;
    referenceLabel?: string;
    assessmentId?: string | null;
    currentDate?: string;
    isEndurance?: boolean;
    useScoreData?: boolean;
    maxWidth?: string;
}

const AssessmentHistoryChart = ({ 
    currentValue, 
    fieldId,
    chartTitle,
    unit = 'seg',
    history = [], 
    isPrint = false,
    referenceValue,
    referenceLabel,
    assessmentId,
    currentDate = new Date().toLocaleDateString('pt-BR'),
    isEndurance = false,
    useScoreData = false,
    maxWidth: overrideMaxWidth
}: AssessmentHistoryChartProps) => {
    
    // Safer number parsing for questionnaires (handles "40%" or empty strings)
    const parseVal = (v: any) => {
        if (!v && v !== 0) return 0;
        const clean = String(v).replace('%', '').replace(',', '.').trim();
        const num = parseFloat(clean);
        return isNaN(num) ? 0 : num;
    };

    // Filter history for the specific field, score > 0, and NOT the current assessment being viewed
    const validHistory = history.filter(h => {
        const val = useScoreData ? parseVal(h.scoreData?.percentage || h.scoreData?.score) : parseVal(h.answers?.[fieldId || '']);
        return val > 0 && h.id !== assessmentId;
    });

    const parsedCurrentValue = parseVal(currentValue);
    const totalDataPoints = validHistory.length + (parsedCurrentValue > 0 ? 1 : 0);
    
    // EXCLUSION LOGIC: Hide chart if there's only 1 measurement and no reference threshold (e.g., questionnaires)
    if (totalDataPoints < 2 && !referenceValue) return null;

    const maxValue = Math.max(
        parsedCurrentValue,
        referenceValue || 0,
        ...validHistory.map(h => {
            const val = useScoreData ? parseVal(h.scoreData?.percentage || h.scoreData?.score) : parseVal(h.answers?.[fieldId || '']);
            return val || 0;
        })
    ) * 1.2 || 60;
    
    const validHistoryData = validHistory.map(h => ({
        id: h.id,
        value: useScoreData ? parseVal(h.scoreData?.percentage || h.scoreData?.score) : parseVal(h.answers?.[fieldId || '']),
        date: new Date(h.created_at).toLocaleDateString('pt-BR'),
        timestamp: new Date(h.created_at).getTime()
    })).sort((a, b) => a.timestamp - b.timestamp);

    const totalBars = validHistoryData.length + (parsedCurrentValue > 0 ? 1 : 0) + (referenceValue ? 1 : 0);
    
    // ALWAYS FILL THE GRID CELL
    const chartMaxWidth = overrideMaxWidth || '100%';

    // DETERMINISTIC OFFSET: matches Bar.tsx (gap: 8px + label block: 32px = 40px)
    const labelOffset = 40; 

    return (
        <div className="chart-container">
            <h4 className="chart-title">
                {chartTitle}
            </h4>
            <div className="chart-scroll-wrapper">
                <div className="chart-bars-container" style={{ position: 'relative' }}>
                    {referenceValue && (
                        <div style={{ 
                            position: 'absolute', 
                            left: 0, 
                            right: 0, 
                            bottom: `calc(${(referenceValue / (maxValue || 1)) * 140}px + ${labelOffset}px)`, 
                            borderTop: '2px dashed #475569',
                            zIndex: 5,
                            pointerEvents: 'none'
                        }}>
                            <span style={{ 
                                position: 'absolute', 
                                top: '-1.5rem', 
                                right: '10px', 
                                fontSize: '0.85rem', 
                                fontWeight: '900', 
                                color: '#1e293b',
                                backgroundColor: 'rgba(255,255,255,0.95)',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                boxShadow: 'var(--shadow-sm)',
                                border: '1px solid #cbd5e1',
                                whiteSpace: 'nowrap'
                            }}>
                                {referenceLabel || 'Normalidade'}: {referenceValue}{unit}
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

                    {(() => {
                        const dateCounts = new Map();
                        validHistoryData.forEach(item => {
                            dateCounts.set(item.date, (dateCounts.get(item.date) || 0) + 1);
                        });

                        const currentCounts = new Map();
                        return validHistoryData.map((d: any) => {
                            const count = (currentCounts.get(d.date) || 0) + 1;
                            currentCounts.set(d.date, count);
                            const hasMultiple = dateCounts.get(d.date) > 1;
                            const displayDate = hasMultiple ? `${d.date} (${count})` : d.date;

                            return (
                                <Bar 
                                    key={d.id} 
                                    value={d.value} 
                                    maxValue={maxValue}
                                    label={displayDate}
                                    unit={unit}
                                    color={isPrint ? "#fee2e2" : "var(--primary-light)"} 
                                    isPrint={isPrint}
                                />
                            );
                        });
                    })()}

                    {parsedCurrentValue > 0 && (
                        <Bar 
                            value={parsedCurrentValue} 
                            maxValue={maxValue}
                            label={assessmentId ? currentDate : new Date().toLocaleDateString('pt-BR')} 
                            unit={unit}
                            color={isPrint ? "#8B0000" : "var(--primary)"} 
                            isPrint={isPrint}
                        />
                    )}
                </div>
            </div>
            <style jsx>{`
                .chart-container {
                    margin-top: 1rem;
                    margin-bottom: 1.5rem;
                    background-color: white;
                    border-radius: 1rem;
                    border: 1px solid var(--border);
                    box-shadow: ${isPrint ? 'none' : 'var(--shadow-sm)'};
                    width: 100%;
                    max-width: ${chartMaxWidth};
                    padding: ${isPrint ? '0.75rem' : '1.25rem'};
                    overflow-x: ${isPrint ? 'hidden' : 'auto'};
                    -webkit-overflow-scrolling: touch;
                }
                .chart-title {
                    font-size: ${isPrint ? '0.75rem' : '1rem'};
                    font-weight: 800;
                    margin-bottom: 0.75rem;
                    color: var(--secondary);
                    display: flex;
                    align-items: center;
                    border-left: 4px solid var(--primary);
                    padding-left: 0.75rem;
                    line-height: 1.2;
                    word-break: break-word;
                }
                .chart-scroll-wrapper {
                    overflow-x: ${isPrint ? 'hidden' : 'auto'};
                    padding-bottom: 0.5rem;
                }
                .chart-bars-container {
                    display: flex;
                    gap: 12px;
                    align-items: flex-end;
                    min-height: 150px;
                    min-width: ${isPrint ? 'auto' : '200px'};
                    width: 100%; 
                    justify-content: flex-start;
                }
            `}</style>
        </div>
    );
};

export default AssessmentHistoryChart;
