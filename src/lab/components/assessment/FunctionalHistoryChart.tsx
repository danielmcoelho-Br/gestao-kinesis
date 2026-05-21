"use client";

import Bar from "./Bar";

interface FunctionalHistoryChartProps {
    history: any[];
    currentScore: number;
    type: string;
    isEmbedded?: boolean;
    isPrint?: boolean;
    assessmentId?: string | null;
    assessmentDate?: string;
}

const FunctionalHistoryChart = ({ 
    history = [], 
    currentScore, 
    type, 
    isEmbedded = false, 
    isPrint = false, 
    assessmentId, 
    assessmentDate = new Date().toLocaleDateString('pt-BR') 
}: FunctionalHistoryChartProps) => {
    if (history.length === 0 && !currentScore && !isPrint) return null;

    // Filter history for the specific type, which has score, and is NOT the current assessment being viewed (to avoid duplication)
    const validHistory = history.filter(h => h.assessment_type === type && h.scoreData?.percentage > 0 && h.id !== assessmentId);

    const todayStr = new Date().toLocaleDateString('pt-BR');
    const rawData = [...validHistory.slice().map(h => ({
        id: h.id,
        date: new Date(h.created_at).toLocaleDateString('pt-BR'),
        score: h.scoreData?.percentage || 0,
        timestamp: new Date(h.created_at).getTime()
    })).sort((a, b) => a.timestamp - b.timestamp)];

    // Add current if it has a score and it's not already in history (by ID or same score today)
    const isAlreadyInHistory = rawData.some(h => 
        h.id === assessmentId || 
        (h.date === todayStr && Math.abs(h.score - currentScore) < 0.1)
    );
    
    if (currentScore > 0 && !isAlreadyInHistory) {
        rawData.push({
            id: 'current',
            date: 'Hoje',
            score: currentScore,
            timestamp: Date.now()
        });
    }

    // Add numbering suffix if multiple evaluations exist for the same date
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
        const hasMultiple = dateCounts.get(dKey) > 1;
        
        let displayLabel = item.date === 'Hoje' ? (assessmentId ? assessmentDate : todayStr) : item.date;
        if (hasMultiple) {
            displayLabel = `${displayLabel} (${count})`;
        }

        return {
            ...item,
            displayDate: displayLabel
        };
    });

    if (processedData.length < 2) return null;

    return (
        <div className={`history-chart-container ${isEmbedded ? 'embedded' : ''}`}>
            <h4 className="history-chart-title">
                Evolução Funcional (% Incapacidade - {type.toUpperCase()})
            </h4>
            <div className="history-chart-scroll">
                <div className="history-chart-bars" style={{ display: 'flex', gap: isPrint ? '0.6rem' : '1rem', alignItems: 'flex-end', minHeight: '180px' }}>
                    {processedData.map((d, i) => {
                        const isCurrent = d.id === 'current' || d.id === assessmentId;
                        return (
                            <Bar 
                                key={i}
                                value={d.score}
                                maxValue={100}
                                label="Incap."
                                subLabel={d.displayDate}
                                color={isCurrent ? 'var(--primary)' : 'var(--primary-light)'}
                                unit="%"
                                isPrint={isPrint}
                            />
                        );
                    })}
                </div>
            </div>
            <style jsx>{`
                .history-chart-container {
                    margin-top: 2rem;
                    padding: 1.5rem;
                    background-color: var(--bg-secondary);
                    border-radius: 1rem;
                }
                .history-chart-container.embedded {
                    margin-top: 0.5rem;
                    padding: 1rem;
                    background-color: var(--bg);
                    border: 1px solid var(--border);
                    transform-origin: top left;
                    transform: ${isPrint ? 'none' : 'scale(0.9)'};
                    width: ${isPrint ? '100%' : '111%'};
                    max-width: 600px;
                }
                .history-chart-title {
                    font-size: 1rem;
                    font-weight: 700;
                    margin-bottom: 1.5rem;
                    color: var(--secondary);
                }
                .embedded .history-chart-title {
                    font-size: 0.85rem;
                }
                .history-chart-scroll {
                    overflow-x: ${isPrint ? 'hidden' : 'auto'};
                    padding-bottom: 0.5rem;
                }
                .history-chart-bars {
                    display: flex;
                    gap: ${isPrint ? '0.6rem' : '1rem'};
                    align-items: flex-end;
                    height: 200px;
                    min-width: ${isPrint ? 'auto' : '300px'};
                    width: ${isPrint ? '100%' : 'auto'};
                }
                @media (max-width: 600px) {
                    .history-chart-container {
                        padding: 1rem;
                        overflow-x: auto;
                    }
                    .history-chart-bars {
                        min-width: 400px;
                    }
                }
            `}</style>
        </div>
    );
};

export default FunctionalHistoryChart;
