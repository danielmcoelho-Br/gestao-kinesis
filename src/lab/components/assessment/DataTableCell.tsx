"use client";

import { memo } from "react";
import { Calculator } from "lucide-react";
import ImageUpload from "./ImageUpload";
import { useAssessmentContext } from "@/lab/contexts/AssessmentContext";
import { isValueBelowStandard } from "@/lab/utils/clinicalThresholds";

interface DataTableCellProps {
    fieldId: string; 
    fieldType: string; 
    fieldOptions: any[];
    value?: any; 
    isPrint?: boolean;
    rowLabel?: string;
    isCalculated?: boolean;
    min?: number;
    max?: number;
}

const DataTableCell = memo(({ 
    fieldId, 
    fieldType, 
    fieldOptions,
    value: propValue, 
    isPrint: overrideIsPrint,
    rowLabel,
    isCalculated = false,
    min,
    max
}: DataTableCellProps) => {
    const state = useAssessmentContext();
    const isEditing = state.isEditing;
    const handleInputChange = state.handleInputChange;
    const onImageClick = state.setSelectedImage;
    const onAnalyzeImage = state.handleAnalyzeImage;
    const onOpenDynamo = (fieldId: string, label: string) => state.setDynamoModal({ fieldId, label });
    
    const isPrint = overrideIsPrint !== undefined ? overrideIsPrint : state.isPrint;
    const value = propValue !== undefined ? propValue : state.answers[fieldId];
    
    const reflexOptions = ['Normal', 'Aumentado', 'Diminuído', 'Abolido'];
    const numValue = value !== undefined && value !== "" ? parseFloat(String(value).replace(',', '.')) : NaN;
    const isOutOfRange = !isNaN(numValue) && (
        (min !== undefined && numValue < min) ||
        (max !== undefined && numValue > max)
    );

    if (fieldId.endsWith('_res') || fieldId.endsWith('_res_esq') || fieldId.endsWith('_res_dir') || fieldId.endsWith('_res_e') || fieldId.endsWith('_res_d') || fieldId.endsWith('_result_esq') || fieldId.endsWith('_result_dir') || fieldId.endsWith('_res_global') || fieldId.endsWith('_class') || fieldId.endsWith('_status') || fieldId.endsWith('_deficit_res') || fieldId.includes('ratio') || fieldId.includes('_res_lom')) {
        let displayValue = value || "-";
        
        // Dynamic status for ratio if missing
        if (fieldId.includes('ratio') && displayValue !== "-" && !displayValue.includes('-')) {
            const ratioNum = parseFloat(displayValue.replace('%', ''));
            if (!isNaN(ratioNum)) {
                displayValue = `${ratioNum}% - ${ratioNum >= 76 ? 'Normal' : 'Abaixo'}`;
            }
        }

        const val = String(displayValue).toUpperCase();
        const isNormal = val.includes('NORMAL') || val === 'SIM';
        const isLeve = val.includes('LEVE');
        const isModerado = val.includes('MODERADO');
        const isGrave = val.includes('GRAVE') || val.includes('ABAIXO') || val.includes('DÉFICIT') || val.includes('DEFICIT') || val.includes('ALTERADO') || val === 'NÃO' || val === 'NAO' || val.includes('DESEQUILÍBRIO') || val.includes('DESEQUILIBRIO');
        
        const isGeriatria = state.type === 'afGeriatria';
        let bgColor = '#f1f5f9';
        let textColor = '#64748b';
        let borderColor = '#cbd5e1';

        if (isNormal) {
            bgColor = '#ecfdf5';
            textColor = '#059669';
            borderColor = '#10b981';
        } else if (isLeve) {
            bgColor = '#fffbeb';
            textColor = '#b45309';
            borderColor = '#fbbf24';
        } else if (isModerado) {
            bgColor = '#fff7ed';
            textColor = '#c2410c';
            borderColor = '#f97316';
        } else if (isGrave) {
            if (isGeriatria) {
                // SPECIAL YELLOW FOR GERIATRICS
                bgColor = '#fef08a';
                textColor = '#854d0e';
                borderColor = '#eab308';
            } else {
                bgColor = '#fef2f2';
                textColor = '#991b1b';
                borderColor = '#ef4444';
            }
        }

        return (
            <div style={{ textAlign: 'center' }}>
                <span style={{ 
                    color: textColor, 
                    fontWeight: '800',
                    fontSize: isPrint ? '0.6rem' : '0.68rem',
                    textTransform: 'uppercase',
                    backgroundColor: bgColor,
                    padding: isPrint ? '2px 3px' : '2px 4px',
                    borderRadius: '4px',
                    border: `1px solid ${borderColor}`,
                    display: 'inline-block',
                    minWidth: isPrint ? '35px' : '50px',
                    textAlign: 'center'
                }}>
                    {displayValue}
                </span>
            </div>
        );
    }

    if (isCalculated) {
        const isRatio = fieldId.includes('ratio');
        const isRatioBelow = isRatio && (value && parseInt(String(value)) < 72);
        const isDeficit = fieldId.includes('deficit') || fieldId.includes('def');
        const isDeficitHigh = isDeficit && (value && parseFloat(String(value).replace('%', '')) > 20);
        const isNegativeValue = typeof value === 'string' && value.startsWith('-');

        return (
            <div style={{ 
                textAlign: 'center', 
                padding: isPrint ? '0.1rem 0.1rem' : '0.4rem', 
                backgroundColor: (isRatioBelow || isDeficitHigh || isNegativeValue) ? '#fef2f2' : (isCalculated ? '#f8fafc' : 'var(--bg-secondary)'), 
                borderRadius: '0.4rem',
                border: `1px solid ${(isRatioBelow || isDeficitHigh || isNegativeValue) ? '#fee2e2' : 'var(--border)'}`,
                fontWeight: '800',
                color: (isRatioBelow || isDeficitHigh || isNegativeValue) ? '#b91c1c' : 'var(--primary)',
                fontSize: isPrint ? '0.7rem' : '0.78rem'
            }}>
                {value || "-"}
            </div>
        );
    }

    if (fieldType === 'checkbox') {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {isPrint ? (
                    value ? (
                        <span style={{ color: 'var(--primary)', fontWeight: '900', fontSize: '1.2rem' }}>✓</span>
                    ) : (
                        <span style={{ color: '#ccc' }}>-</span>
                    )
                ) : (
                    <input 
                        type="checkbox" 
                        checked={!!value}
                        onChange={(e) => handleInputChange(fieldId, e.target.checked)}
                        disabled={!isEditing}
                        style={{ width: '18px', height: '18px', cursor: isEditing ? 'pointer' : 'not-allowed' }}
                    />
                )}
            </div>
        );
    }

    if (fieldType === 'select') {
        return isPrint ? (
            <div style={{ textAlign: 'center', fontSize: '0.78rem' }}>
                <span style={{ fontWeight: '600' }}>{value || "-"}</span>
            </div>
        ) : (
            <select
                value={value || ""}
                onChange={(e) => handleInputChange(fieldId, e.target.value)}
                disabled={!isEditing}
                style={{ 
                    width: '100%', 
                    padding: '0.3rem 0.4rem', 
                    borderRadius: '0.4rem', 
                    border: '1px solid var(--border)',
                    backgroundColor: isEditing ? 'white' : 'transparent',
                    fontSize: '0.82rem',
                    textAlign: 'center'
                }}
            >
                <option value="">-</option>
                {(fieldOptions.length > 0 ? fieldOptions : reflexOptions).map((opt: string | { id: string, value: string }) => {
                    const optValue = typeof opt === 'string' ? opt : opt.value;
                    return <option key={typeof opt === 'string' ? opt : opt.id} value={optValue}>{optValue}</option>;
                })}
            </select>
        );
    }

    if (fieldType === 'image-upload') {
        return (
            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {isPrint ? (
                    (() => {
                        const imgs = Array.isArray(value) ? value : (value ? [value] : []);
                        return imgs.length > 0 ? imgs.map((img: string, i: number) => (
                            <img key={i} src={img} style={{ height: '60px', borderRadius: '4px' }} alt="Upload" />
                        )) : <span style={{ color: '#ccc' }}>-</span>;
                    })()
                ) : (
                    <ImageUpload 
                        value={value}
                        isEditing={isEditing}
                        onChange={(val: any) => handleInputChange(fieldId, val)}
                        onImageClick={onImageClick}
                        onAnalyzeImage={onAnalyzeImage ? (img, idx) => onAnalyzeImage(img, fieldId, idx) : undefined}
                        isTable={true}
                        isPrint={isPrint}
                    />
                )}
            </div>
        );
    }

    if (fieldType === 'static') {
        return (
            <div style={{ textAlign: 'center', fontWeight: '800', color: '#64748b', fontSize: isPrint ? '0.75rem' : '0.82rem' }}>
                {fieldOptions.find((o: string | { id: string, value: string }) => typeof o !== 'string' && o.id === fieldId)?.value || (fieldId.includes('obj') ? fieldId.split('_obj')[0] : value) || '-'} 
            </div>
        );
    }


    return isPrint ? (
        <div style={{ textAlign: 'center', fontSize: '0.78rem' }}>
            <span style={{ fontWeight: '600' }}>{value || "-"}</span>
        </div>
    ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}>
            <input 
                type={fieldType === 'number' ? 'number' : 'text'}
                value={value || ""}
                onChange={(e) => handleInputChange(fieldId, e.target.value)}
                disabled={!isEditing}
                placeholder="-"
                style={{ 
                    flex: 1, 
                    maxWidth: '85px',
                    padding: isPrint ? '0.1rem 0.2rem' : '0.2rem 0.3rem', 
                    borderRadius: '0.4rem', 
                    border: isEditing ? (isOutOfRange ? '2px solid #f97316' : (isValueBelowStandard(fieldId, numValue, state.patientGender, state.patientAge) && state.type !== 'afMao' ? '2px solid #eab308' : '1px solid var(--border)')) : '1px solid transparent',
                    backgroundColor: isEditing ? (isOutOfRange ? '#fff7ed' : (isValueBelowStandard(fieldId, numValue, state.patientGender, state.patientAge) && state.type !== 'afMao' ? '#fef08a' : 'white')) : 'transparent',
                    fontSize: isPrint ? '0.7rem' : '0.78rem',
                    textAlign: 'center',
                    boxShadow: (isOutOfRange || (isValueBelowStandard(fieldId, numValue, state.patientGender, state.patientAge) && state.type !== 'afMao')) ? (isOutOfRange ? '0 0 0 2px #ffedd5' : '0 0 0 2px #fef9c3') : 'none',
                    color: (isValueBelowStandard(fieldId, numValue, state.patientGender, state.patientAge) && state.type !== 'afMao') ? '#854d0e' : 'inherit',
                    fontWeight: (isValueBelowStandard(fieldId, numValue, state.patientGender, state.patientAge) && state.type !== 'afMao') ? '800' : 'inherit'
                }}
            />
            {isEditing && state.type !== 'afLombar' && state.type !== 'afCervical' && fieldType === 'number' && (fieldId.includes('forca') || fieldId.startsWith('f_') || fieldId.includes('preensao') || fieldId.includes('polpa') || fieldId.includes('lateral') || fieldId.includes('tripode') || fieldId.includes('resist')) && onOpenDynamo && (
                <button
                    type="button"
                    onClick={() => onOpenDynamo(fieldId, rowLabel || "")}
                    title="Inserir medidas"
                    style={{ 
                        padding: '4px', 
                        borderRadius: '4px', 
                        border: '1px solid var(--border)', 
                        background: 'var(--bg-secondary)', 
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                    }}
                >
                    <Calculator size={14} />
                </button>
            )}
        </div>
    );
});

export default DataTableCell;
