"use client";

import Bar from "./Bar";
import { getMuscleStrengthReference } from "@/lab/utils/clinicalThresholds";

interface MuscleStrengthRowChartProps {
    row: any;
    answers: Record<string, any>;
    history: any[];
    assessmentId?: string | null;
    assessmentDate?: string;
    gender: string;
    age: number;
    activityLevel: string;
    isPrint?: boolean;
}

const MuscleStrengthRowChart = ({
    row,
    answers,
    history,
    assessmentId,
    assessmentDate = new Date().toLocaleDateString('pt-BR'),
    gender,
    age,
    activityLevel,
    isPrint = false
}: MuscleStrengthRowChartProps) => {
    
    // 1. Identify Field IDs for this row (Esq, Dir)
    const fieldE = typeof row.fields[0] === 'string' ? row.fields[0] : row.fields[0]?.id;
    const fieldD = typeof row.fields[1] === 'string' ? row.fields[1] : row.fields[1]?.id;
    
    // 2. Fetch Values
    const parseVal = (v: any) => {
        if (!v && v !== 0) return 0;
        return parseFloat(String(v).replace(',', '.')) || 0;
    };

    const currE = parseVal(answers[fieldE]);
    const currD = parseVal(answers[fieldD]);

    // 3. Get Reference
    const reference = getMuscleStrengthReference(row.id, gender, age, activityLevel);

    // 4. Get Most Recent Previous Assessment
    const previousAssessment = history
        .filter(h => h.id !== assessmentId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    const prevE = previousAssessment ? parseVal(previousAssessment.answers?.[fieldE]) : 0;
    const prevD = previousAssessment ? parseVal(previousAssessment.answers?.[fieldD]) : 0;
    const prevDate = previousAssessment ? new Date(previousAssessment.created_at).toLocaleDateString('pt-BR') : '';

    // Skip if all values are 0 (except reference)
    if (currE === 0 && currD === 0 && prevE === 0 && prevD === 0) return null;

    const maxValue = Math.max(reference, currE, currD, prevE, prevD, 1) * 1.2;
    const labelOffset = 40; 

    return (
        <div style={{ 
            marginTop: '1.5rem', 
            padding: '1.25rem', 
            backgroundColor: 'white', 
            borderRadius: '1.25rem', 
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            width: '100%',
            pageBreakInside: 'avoid'
        }}>
            <h5 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--secondary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '4px', height: '18px', backgroundColor: 'var(--primary)', borderRadius: '2px' }} />
                {row.label}
            </h5>

            <div style={{ position: 'relative', display: 'flex', gap: '0.75rem', alignItems: 'flex-end', height: '180px', paddingBottom: '0.5rem' }}>
                {/* REFERENCE LINE */}
                <div style={{ 
                    position: 'absolute', 
                    left: 0, 
                    right: 0, 
                    bottom: `calc(${(reference / maxValue) * 140}px + ${labelOffset}px)`, 
                    borderTop: '2px dashed #475569',
                    zIndex: 2,
                    pointerEvents: 'none'
                }}>
                    <span style={{ 
                        position: 'absolute', 
                        top: '-1.4rem', 
                        right: '0', 
                        fontSize: '0.75rem', 
                        fontWeight: '800', 
                        color: '#475569',
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        border: '1px solid #e2e8f0',
                        whiteSpace: 'nowrap'
                    }}>
                        Ref: {reference} kgf
                    </span>
                </div>

                {/* ALL BARS IN SAME ROW FOR PERFECT ALIGNMENT */}
                <Bar value={reference} maxValue={maxValue} label="Referência" color="#cbd5e1" unit="kgf" isPrint={isPrint} />

                <div style={{ height: '140px', width: '2px', backgroundColor: '#f1f5f9', marginBottom: '40px' }} />

                {prevE > 0 && <Bar value={prevE} maxValue={maxValue} label={prevDate} subLabel="Esquerda Ant." color="#fee2e2" unit="kgf" isPrint={isPrint} />}
                <Bar value={currE} maxValue={maxValue} label={assessmentDate} subLabel="Esquerda" color="var(--primary)" unit="kgf" isPrint={isPrint} />

                <div style={{ height: '140px', width: '2px', backgroundColor: '#f1f5f9', marginBottom: '40px' }} />

                {prevD > 0 && <Bar value={prevD} maxValue={maxValue} label={prevDate} subLabel="Direita Ant." color="#fecaca" unit="kgf" isPrint={isPrint} />}
                <Bar value={currD} maxValue={maxValue} label={assessmentDate} subLabel="Direita" color="#f87171" unit="kgf" isPrint={isPrint} />
            </div>
            
            <div style={{ 
                marginTop: '1.25rem', 
                paddingTop: '0.75rem', 
                borderTop: '1px solid #f1f5f9', 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '0.65rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase'
            }}>
                <span>Normativa: {reference} kgf</span>
                {previousAssessment && (
                    <span>Evolução desde: {prevDate}</span>
                )}
            </div>
        </div>
    );
};

export default MuscleStrengthRowChart;
