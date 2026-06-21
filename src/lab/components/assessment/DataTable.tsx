"use client";

import { memo } from "react";
import { CheckCircle2 } from "lucide-react";
import { useParams } from "next/navigation";
import DataTableCell from "./DataTableCell";
import { useAssessmentContext } from "@/lab/contexts/AssessmentContext";
import { getEnduranceThreshold, getPatientProfileString, getHandStrengthReference, isValueBelowStandard } from "@/lab/utils/clinicalThresholds";
import { Section, TableRow } from "@/lab/types/clinical";

interface DataTableProps {
    section: Section; 
    isPrint?: boolean;
}

const DataTable = memo(({ section, isPrint: overrideIsPrint }: DataTableProps) => {
    const params = useParams();
    const state = useAssessmentContext();
    const { patientGender, patientAge, patientActivityLevel } = state;
    
    const answers = state.answers;
    const isEditing = state.isEditing;
    const handleInputChange = state.handleInputChange;
    const onImageClick = state.setSelectedImage;
    const onAnalyzeImage = state.handleAnalyzeImage;
    const assessmentDate = state.assessmentDate;
    const onOpenDynamo = (fieldId: string, label: string) => state.setDynamoModal({ fieldId, label });
    const handleHeaderAction = state.handleHeaderAction;
    const type = state.type || (params.type as string);
    
    const isPrint = overrideIsPrint !== undefined ? overrideIsPrint : state.isPrint;

    const reflexOptions = ['Normal', 'Aumentado', 'Diminuído', 'Abolido'];
    
    const hasValue = (val: any) => val !== undefined && val !== null && val !== "" && val !== "null" && val !== false;

    return (
        <div className="table-responsive" style={{ 
            marginTop: '0.5rem', 
            width: '100%',
            borderRadius: '1.25rem', 
            border: isPrint ? '1px solid #e2e8f0' : '1px solid var(--border)', 
            overflowX: 'auto',
            backgroundColor: 'white',
            boxShadow: isPrint ? 'none' : '0 4px 6px -1px rgba(163, 22, 33, 0.05), 0 2px 4px -1px rgba(163, 22, 33, 0.03)'
        }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ 
                        backgroundColor: 'var(--bg-secondary)',
                        borderTop: '3px solid var(--primary)' // PREMIUM ACCENT
                    }}>
                        {section.columns?.map((col, idx) => (
                            <th 
                                key={idx} 
                                style={{ 
                                    padding: isPrint ? '0.35rem 0.5rem' : '0.8rem 0.6rem', 
                                    textAlign: idx === 0 ? 'left' : 'center', 
                                    fontSize: isPrint ? '0.6rem' : '0.72rem', 
                                    fontWeight: '800', 
                                    color: 'var(--primary)', // BRAND RED TEXT
                                    letterSpacing: '0.01em',
                                    textTransform: 'uppercase', 
                                    borderBottom: '1px solid var(--border)',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: idx === 0 ? 'flex-start' : 'center', gap: '0.5rem' }}>
                                    <span>{typeof col === "string" ? col : col.label}</span>
                                    {isEditing && typeof col !== "string" && col.action?.type === 'fill' && (
                                        <button
                                            type="button"
                                            onClick={() => handleHeaderAction(col.action, idx, section)}
                                            title={`Preencher tudo como ${col.action.value}`}
                                            className="fill-all-btn"
                                            style={{
                                                background: 'var(--primary-light)',
                                                border: '1px solid var(--primary)',
                                                color: 'var(--primary)',
                                                borderRadius: '30px',
                                                padding: '2px 8px',
                                                fontSize: '0.65rem',
                                                fontWeight: '900',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                boxShadow: 'var(--shadow-sm)',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <CheckCircle2 size={12} />
                                            {col.action.value}
                                        </button>
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                    {section.description && (
                        <tr>
                            <th 
                                colSpan={section.columns?.length || 1}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#fffbeb', // LIGHT YELLOW FOR REFERENCE
                                    borderBottom: '1px solid #fef3c7',
                                    fontSize: '0.7rem',
                                    fontWeight: '700',
                                    color: '#92400e', // DARK AMBER
                                    textAlign: 'left',
                                    fontStyle: 'italic'
                                }}
                            >
                                💡 {section.description}
                            </th>
                        </tr>
                    )}
                </thead>
                <tbody>
                    {section.rows?.filter((row: TableRow) => {
                        if (isEditing) return true;
                        return row.fields.some(f => {
                            const fid = typeof f === "string" ? f : (f as any).id;
                            return hasValue(answers[fid]);
                        });
                    }).map((row: TableRow, rIdx) => {
                        let displayLabel = row.label;
                        
                        if (type === 'afLombar' || type === 'afCervical' || type === 'afMmii') {
                            const mainField = row.fields[0];
                            const fieldId = typeof mainField === 'string' ? mainField : (mainField as any)?.id;
                            
                            if (['flexao_60', 'sorensen', 'resist_flexora', 'resist_extensora', 'prancha', 'prancha_lat_esq', 'prancha_lat_dir'].includes(fieldId)) {
                                const threshold = getEnduranceThreshold({
                                    testId: fieldId,
                                    gender: patientGender,
                                    age: patientAge,
                                    activityLevel: patientActivityLevel
                                });
                                const profile = getPatientProfileString(patientGender, patientAge, patientActivityLevel);
                                displayLabel = `${displayLabel} (Ref: ${threshold}s - ${profile})`;
                            }
                        } else if (type === 'afMao' && section.id === 'forca_preensao') {
                            const mainField = row.fields[0];
                            const fieldId = typeof mainField === 'string' ? mainField : (mainField as any)?.id;
                            const referenceValue = getHandStrengthReference(fieldId, patientGender, patientAge);
                            if (referenceValue) {
                                displayLabel = `${displayLabel} (Ref: ${referenceValue})`;
                            }
                        }

                        return (
                            <tr key={rIdx} style={{ transition: 'background-color 0.2s' }}>
                                <td style={{ 
                                    padding: isPrint ? '0.3rem 0.5rem' : '0.6rem 0.6rem', 
                                    fontSize: isPrint ? '0.7rem' : '0.78rem', 
                                    fontWeight: '700', 
                                    color: 'var(--secondary)', 
                                    borderBottom: '1px solid #f8fafc',
                                    backgroundColor: '#fafafa', // SUBTLE CONTRAST
                                    width: row.fields.length >= 4 ? '22%' : '35%',
                                    minWidth: row.fields.length >= 4 ? '120px' : '180px',
                                    lineHeight: '1.2'
                                }}>
                                    {displayLabel}
                                </td>
                                {row.fields.map((f, fIdx) => {
                                    const fieldId = typeof f === "string" ? f : (f as any).id;
                                    const fieldType = typeof f === "string" ? "number" : ((f as any).type || "number");
                                    const fieldOptions = typeof f === "string" ? (fieldType === 'select' ? reflexOptions : []) : (f as any).options || [];
                                    const min = typeof f === "string" ? undefined : (f as any).min;
                                    const max = typeof f === "string" ? undefined : (f as any).max;

                                    let calculatedValue = answers[fieldId];
                                    const isCalculated = fieldId.includes('_deficit') || fieldId.includes('_def') || 
                                                       fieldId.includes('_ratio') || fieldId.includes('_res_global') || 
                                                       fieldId.includes('_iq_') || fieldId.includes('_pct') ||
                                                       fieldId.includes('_res_lom') ||
                                                       fieldId.endsWith('_res');

                                    if (isCalculated && !answers[fieldId] && (fieldId.endsWith('_deficit') || fieldId.endsWith('_def'))) {
                                        const sidePrefix = fieldId.replace('_deficit', '').replace('_def', '');
                                        const valE = parseFloat(String(answers[`${sidePrefix}_esq`] || '0').replace(',', '.'));
                                        const valD = parseFloat(String(answers[`${sidePrefix}_dir`] || '0').replace(',', '.'));
                                        
                                        if (valE > 0 || valD > 0) {
                                            const maxVal = Math.max(valE, valD);
                                            const minVal = Math.min(valE, valD);
                                            if (maxVal > 0) {
                                                const diff = maxVal - minVal;
                                                calculatedValue = ((diff / maxVal) * 100).toFixed(1) + '%';
                                            } else {
                                                calculatedValue = '0%';
                                            }
                                        }
                                    } else if (!answers[fieldId] && (fieldId.endsWith('_res') || fieldId.endsWith('_res_esq') || fieldId.endsWith('_res_dir'))) {
                                        const sourceValFieldId = fieldId.replace('_res_esq', '').replace('_res_dir', '').replace('_res', '');
                                        const valStr = answers[sourceValFieldId];
                                        
                                        if (valStr && valStr.trim() !== '') {
                                            const numVal = parseFloat(valStr.replace(',', '.'));
                                            const threshold = getEnduranceThreshold({
                                                testId: sourceValFieldId,
                                                gender: patientGender,
                                                age: patientAge,
                                                activityLevel: patientActivityLevel
                                            });

                                            if (threshold > 0) {
                                                const isNormal = numVal >= threshold;
                                                calculatedValue = isNormal ? 'NORMAL' : 'ABAIXO';
                                            } else {
                                                // Check for other types of thresholds (e.g. static tests in geriatrics)
                                                if (['pes_juntos', 'semi_tandem', 'tandem', 'unipodal_dir', 'unipodal_esq'].includes(sourceValFieldId)) {
                                                    const ref = sourceValFieldId.includes('tandem') ? 17.56 : (sourceValFieldId.includes('unipodal') ? 10 : 30);
                                                    calculatedValue = numVal >= ref ? 'NORMAL' : 'ABAIXO';
                                                } else if (sourceValFieldId === 'tug') {
                                                    calculatedValue = numVal <= 12.47 ? 'NORMAL' : 'ABAIXO';
                                                } else if (sourceValFieldId === 'vel_marcha') {
                                                    calculatedValue = numVal >= 0.8 ? 'NORMAL' : 'ABAIXO';
                                                } else if (type === 'afMao' && (sourceValFieldId.includes('preensao') || sourceValFieldId.includes('lateral') || sourceValFieldId.includes('polpa') || sourceValFieldId.includes('tripode'))) {
                                                    if (!isNaN(numVal)) {
                                                        const isBelow = isValueBelowStandard(sourceValFieldId, numVal, patientGender, patientAge);
                                                        calculatedValue = isBelow ? 'ABAIXO' : 'NORMAL';
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    return (
                                        <td key={fIdx} style={{ 
                                            padding: isPrint ? '0.2rem' : '0.3rem', 
                                            borderBottom: '1px solid #f8fafc',
                                            textAlign: 'center'
                                        }}>
                                            <DataTableCell 
                                                fieldId={fieldId}
                                                fieldType={fieldType}
                                                fieldOptions={fieldOptions}
                                                value={calculatedValue}
                                                isPrint={isPrint}
                                                rowLabel={row.label}
                                                isCalculated={isCalculated}
                                                min={min}
                                                max={max}
                                            />
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {section.footer && (
                <div style={{ 
                    padding: isPrint ? '0.25rem 0.5rem' : '0.75rem 1rem', 
                    backgroundColor: '#f8fafc', 
                    borderTop: '1px solid var(--border)',
                    fontSize: isPrint ? '0.6rem' : '0.7rem',
                    fontWeight: '700',
                    color: 'var(--text-muted)',
                    fontStyle: 'italic',
                    textAlign: 'left'
                }}>
                    * {section.footer}
                </div>
            )}
        </div>
    );
});

export default DataTable;
