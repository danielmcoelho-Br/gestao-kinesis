"use client";

import { memo } from "react";
import FunctionalHistoryChart from "./FunctionalHistoryChart";
import localforage from "localforage";

interface FunctionalQuestionnaireBlockProps {
    questType: string; 
    title: string; 
    history: any[]; 
    answers: any; 
    isEditing: boolean; 
    patientId: string; 
    type: string; 
    router: any;
    assessmentId: string | null;
    assessmentDate: string;
    isPrint: boolean;
}

const FunctionalQuestionnaireBlock = ({ 
    questType, 
    title, 
    history, 
    answers, 
    isEditing, 
    patientId, 
    type, 
    router,
    assessmentId,
    assessmentDate,
    isPrint
}: FunctionalQuestionnaireBlockProps) => {
    const scoreKey = `${questType}_score`;
    const currentScoreRaw = answers[scoreKey];
    const currentScore = typeof currentScoreRaw === 'string' 
        ? parseFloat(currentScoreRaw.replace(',', '.').replace('%', '').replace(' pts', '')) 
        : (typeof currentScoreRaw === 'number' ? currentScoreRaw : 0);
    
    // Filter history for THIS specific questionnaire type
    const validHistory = history.filter(h => h.assessment_type === questType).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const handleNavigate = () => {
        // Explicitly save draft before redirecting to sub-questionnaire
        const draftKey = `assessment_draft_${patientId}_${type}`;
        
        // Smart Storage: Filter out heavy base64 images to avoid QuotaExceededError
        const cleanAnswers: Record<string, any> = {};
        Object.keys(answers).forEach(k => {
            const val = answers[k];
            // Allow area_dor (Body Schema) to be saved in draft even if base64/heavy
            if (k === 'area_dor') {
                cleanAnswers[k] = val;
                return;
            }
            if (typeof val === 'string' && val.startsWith('data:image')) return;
            if (Array.isArray(val)) {
                cleanAnswers[k] = val.filter(v => typeof v !== 'string' || !v.startsWith('data:image'));
                if (cleanAnswers[k].length === 0) delete cleanAnswers[k];
                return;
            }
            cleanAnswers[k] = val;
        });

        localforage.setItem(draftKey, JSON.stringify(cleanAnswers)).catch(() => localforage.removeItem(draftKey));
        router.push(`/dashboard/assessment/${patientId}/${questType}?returnTo=${type}${assessmentId ? `&id=${assessmentId}` : ''}`);
    };

    return (
        <div className="functional-block">
            <div className="functional-block-header">
                <h3 className="functional-block-title">{title}</h3>
            </div>
            
            <div style={{ 
                display: isPrint ? 'grid' : 'block', 
                gridTemplateColumns: isPrint ? '1fr 1fr' : 'none', 
                gap: isPrint ? '2rem' : '0' 
            }}>
                <div className="functional-history-section">
                    <h4 className="section-subtitle">Histórico de Avaliações</h4>
                    {validHistory.length > 0 ? (
                        <div className="history-table-wrapper">
                            <table className="history-table">
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Pontuação</th>
                                        <th>Classificação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {validHistory.map((h, i) => (
                                        <tr key={i}>
                                            <td>{new Date(h.created_at).toLocaleDateString('pt-BR')}</td>
                                            <td>{h.scoreData?.percentage !== undefined ? `${h.scoreData.percentage}%` : `${h.scoreData?.score || 0} pts`}</td>
                                            <td>
                                                <span className="status-badge" style={{ 
                                                    backgroundColor: 'var(--primary-light)', 
                                                    color: 'var(--primary)',
                                                    padding: '4px 10px',
                                                    borderRadius: '20px',
                                                    fontWeight: '600',
                                                    fontSize: '0.75rem'
                                                }}>
                                                    {h.scoreData?.interpretation || 'Concluído'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="no-history" style={{ color: '#94a3b8', fontStyle: 'italic', margin: '1rem 0' }}>Sem avaliação prévia</p>
                    )}

                </div>

                <div className="history-chart-wrapper-print">
                    {(currentScore > 0 || !isEditing) && (
                        <div style={{ height: '100%' }}>
                            <div className="history-chart-container-wrapper" style={{ marginTop: isPrint ? '1rem' : '0' }}>
                                <FunctionalHistoryChart 
                                    history={history}
                                    currentScore={currentScore}
                                    type={questType}
                                    isEmbedded={true}
                                    assessmentId={assessmentId}
                                    assessmentDate={assessmentDate}
                                    isPrint={!isEditing}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Button removed as part of UI test to decouple functional assessment and questionnaire entry */}

            <style jsx>{`
                .functional-block {
                    background: white;
                    border-radius: 1.25rem;
                    padding: 1.5rem;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
                    margin-bottom: 2rem;
                    border: 1px solid var(--border);
                    grid-column: 1 / -1;
                }
                .functional-block-title {
                    font-size: 1.15rem;
                    font-weight: 800;
                    color: var(--secondary);
                    margin-bottom: 1.25rem;
                    padding-bottom: 0.75rem;
                    border-bottom: 2px solid var(--primary-light);
                }
                .section-subtitle {
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 0.75rem;
                }
                .history-table-wrapper {
                    overflow-x: auto;
                    margin-bottom: 1.25rem;
                }
                .history-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.85rem;
                }
                .history-table th {
                    text-align: left;
                    padding: 0.6rem;
                    background: var(--bg-secondary);
                    color: var(--secondary);
                    font-weight: 700;
                }
                .history-table td {
                    padding: 0.6rem;
                    border-bottom: 1px solid var(--border);
                }
                .btn-premium-red {
                    width: 100%;
                    padding: 0.85rem;
                    background-color: var(--primary);
                    color: white;
                    border: none;
                    border-radius: 0.75rem;
                    font-weight: 700;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-premium-red:hover {
                    background-color: #720000;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(139,0,0,0.2);
                }
            `}</style>
        </div>
    );
};

export default FunctionalQuestionnaireBlock;
