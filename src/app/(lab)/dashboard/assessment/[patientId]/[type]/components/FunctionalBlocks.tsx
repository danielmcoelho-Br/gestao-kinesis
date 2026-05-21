"use client";

import { memo } from "react";
import { FunctionalHistoryChart } from "./AssessmentCharts";

export const FunctionalQuestionnaireBlock = memo(({ 
    questType, title, history, answers, isEditing, patientId, type, router, assessmentId, assessmentDate
}: { 
    questType: string, title: string, history: any[], answers: any, isEditing: boolean, patientId: string, type: string, router: any, assessmentId: string | null, assessmentDate: string
}) => {
    const scoreKey = `${questType}_score`;
    const currentScoreRaw = answers[scoreKey];
    const currentScore = typeof currentScoreRaw === 'string' 
        ? parseFloat(currentScoreRaw.replace('%', '').replace(' pts', '')) 
        : (typeof currentScoreRaw === 'number' ? currentScoreRaw : 0);
    
    const validHistory = history.filter(h => h.assessment_type === questType).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const handleNavigate = () => {
        const draftKey = `assessment_draft_${patientId}_${type}`;
        localStorage.setItem(draftKey, JSON.stringify(answers));
        if (assessmentId) {
            const checkpointKey = `checkpoint_${patientId}_${type}`;
            localStorage.setItem(checkpointKey, JSON.stringify({ assessmentId, answers }));
        }
        router.push(`/dashboard/assessment/${patientId}/${questType}?returnTo=${type}${assessmentId ? `&id=${assessmentId}` : ''}`);
    };

    return (
        <div className="functional-block">
            <h3 className="functional-block-title">{title}</h3>
            <div className="functional-history-section">
                <h4 className="section-subtitle">Histórico</h4>
                {validHistory.length > 0 ? (
                    <table className="history-table">
                        <thead><tr><th>Data</th><th>Score</th><th>Status</th></tr></thead>
                        <tbody>
                            {validHistory.map((h, i) => (
                                <tr key={i}>
                                    <td>{new Date(h.created_at).toLocaleDateString('pt-BR')}</td>
                                    <td>{h.scoreData?.percentage !== undefined ? `${h.scoreData.percentage}%` : `${h.scoreData?.score || 0} pts`}</td>
                                    <td>{h.scoreData?.interpretation || 'Concluído'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <p className="no-history">Sem avaliação prévia</p>}
            </div>
            {isEditing && <button type="button" onClick={handleNavigate} className="btn-premium-red">Novo Questionário</button>}
            {currentScore > 0 && (
                <div className="current-results-section">
                    <div className="result-main"><span className="result-label">Resultado Atual:</span> <span className="result-value">{currentScoreRaw}</span></div>
                    <FunctionalHistoryChart history={history} currentScore={currentScore} type={questType} isEmbedded={true} assessmentId={assessmentId} assessmentDate={assessmentDate} />
                </div>
            )}
            <style jsx>{`
                .functional-block { background: white; border-radius: 1.25rem; padding: 1.5rem; margin-bottom: 2rem; border: 1px solid var(--border); grid-column: 1 / -1; }
                .functional-block-title { font-size: 1.15rem; font-weight: 800; color: var(--secondary); margin-bottom: 1.25rem; border-bottom: 2px solid var(--primary-light); }
                .history-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-bottom: 1rem; }
                .history-table th { text-align: left; padding: 0.6rem; background: var(--bg-secondary); }
                .history-table td { padding: 0.6rem; border-bottom: 1px solid var(--border); }
                .btn-premium-red { width: 100%; padding: 0.85rem; background: var(--primary); color: white; border: none; border-radius: 0.75rem; font-weight: 700; cursor: pointer; }
                .current-results-section { margin-top: 1.5rem; border-top: 1px dashed var(--border); padding-top: 1rem; }
            `}</style>
        </div>
    );
});
