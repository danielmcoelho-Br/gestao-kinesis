"use client";

import { memo } from "react";
import { Calculator, Sparkles } from "lucide-react";
import { generateTherapeuticText, generateDiagnosticText } from "@/lab/utils/therapeuticRules";
import BodySchema from "@/lab/components/BodySchema";
import PaintMap from "@/lab/components/PaintMap";
import FreeCanvas from "@/lab/components/FreeCanvas";
import AngleMeasurement from "@/lab/components/AngleMeasurement";
import AssessmentHistoryChart from "./AssessmentHistoryChart";
import FunctionalHistoryChart from "./FunctionalHistoryChart";
import ImageUpload from "./ImageUpload";
import FunctionalQuestionnaireBlock from "./FunctionalQuestionnaireBlock";
import { SectionField } from "@/lab/types/clinical";
import { motion, AnimatePresence } from "framer-motion";
import { useAssessmentContext } from "@/lab/contexts/AssessmentContext";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getEnduranceThreshold, getPatientProfileString } from "@/lab/utils/clinicalThresholds";

interface FormFieldProps {
    field: SectionField & { hideLabel?: boolean }; 
    isPrint?: boolean;
    value?: unknown; // To allow overriding answers manually
}

const FormField = memo(function FormField({ field, isPrint: overrideIsPrint, value: propValue }: FormFieldProps) {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const state = useAssessmentContext();
    const patientId = params.patientId as string;
    const type = (params.type as string) || state.type;
    const assessmentId = searchParams.get('id');
    const { questionnaire } = state;

    const answers = state.answers;
    const isEditing = state.isEditing;
    const handleInputChange = state.handleInputChange;
    const onImageClick = state.setSelectedImage;
    const onAnalyzeImage = state.handleAnalyzeImage;
    const onOpenYbt = () => state.setYbtModal(true);
    const patientGender = state.patientGender;
    const patientAge = state.patientAge;
    const patientAssessments = state.patientAssessments || [];
    const assessmentDate = state.assessmentDate;

    const isPrint = overrideIsPrint !== undefined ? overrideIsPrint : state.isPrint;
    const value = propValue !== undefined ? propValue : answers[field.id];

    const isQuestButton = field.type === 'button' && field.id.endsWith('_novo');
    if (isPrint && !isQuestButton) {
        if (value === undefined || value === null || value === '' || value === false) return null;
        if (Array.isArray(value) && value.length === 0) return null;
    }

    const numValue = value !== undefined && value !== "" ? parseFloat(String(value).replace(',', '.')) : NaN;
    const isOutOfRange = !isNaN(numValue) && (
        (field.min !== undefined && numValue < field.min) ||
        (field.max !== undefined && numValue > field.max)
    );

    const commonProps = {
        disabled: !isEditing,
        className: `form-input ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''} ${isOutOfRange ? 'out-of-range' : ''}`,
        style: isOutOfRange ? { borderColor: '#f97316', boxShadow: '0 0 0 2px #ffedd5' } : {}
    };

    const renderRangeWarning = () => {
        if (!isOutOfRange || !isEditing) return null;
        return (
            <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="range-warning-text"
                style={{ 
                    color: '#f97316', 
                    fontSize: '0.75rem', 
                    fontWeight: '800', 
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}
            >
                ⚠️ Valor fora do intervalo clínico esperado ({field.min} a {field.max})
            </motion.div>
        );
    };

    switch (field.type) {
      case 'textarea':
        if (field.id === 'slhrt_class' && value) {
            return (
                <div key={field.id} style={{ 
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', 
                    padding: '1.5rem', 
                    borderRadius: '1.25rem', 
                    border: '1px solid #cbd5e1', 
                    borderLeft: '6px solid var(--primary)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    marginBottom: '1.5rem',
                    gridColumn: '1 / -1',
                    marginTop: '0.5rem'
                }}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <span style={{ display: 'block', fontWeight: '950', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '1rem' }}>Single Leg Heel Raise Test</span>
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', fontSize: '1rem', color: '#334155', lineHeight: '1.8' }}>
                        {String(value || "").split('\n').map((line, idx) => {
                            if (line.includes('ESQUERDO') || line.includes('DIREITO')) {
                                const parts = line.split(': ');
                                const label = parts[0];
                                const status = parts[1] || "";
                                const isAdequate = status.includes('Adequado');
                                return (
                                    <div key={idx} style={{ 
                                        marginBottom: '10px', 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center', 
                                        padding: '10px 16px', 
                                        background: 'white', 
                                        borderRadius: '0.75rem', 
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <span style={{ fontWeight: '800', color: '#1e293b', fontSize: '0.85rem' }}>{label}</span>
                                        <span style={{ 
                                            padding: '4px 12px', 
                                            borderRadius: '9999px', 
                                            fontSize: '0.75rem', 
                                            fontWeight: '800',
                                            backgroundColor: isAdequate ? '#dcfce7' : '#fee2e2',
                                            color: isAdequate ? '#15803d' : '#991b1b',
                                            border: `1px solid ${isAdequate ? '#bbf7d0' : '#fecaca'}`
                                        }}>{status}</span>
                                    </div>
                                );
                            }
                            if (line.includes('Assimetria')) {
                                const isSim = line.includes('SIM');
                                return (
                                    <div key={idx} style={{ 
                                        marginTop: '1.25rem', 
                                        padding: '12px 16px', 
                                        background: isSim ? '#fff1f2' : '#f0fdf4', 
                                        borderRadius: '0.75rem', 
                                        border: `1px solid ${isSim ? '#fecaca' : '#bbf7d0'}`, 
                                        color: isSim ? '#991b1b' : '#15803d', 
                                        fontWeight: '800', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '12px',
                                        fontSize: '0.95rem'
                                    }}>
                                        <span style={{ fontSize: '1.2rem' }}>{isSim ? '⚠️' : '✅'}</span>
                                        <span>{line}</span>
                                    </div>
                                );
                            }
                            return <div key={idx} style={{ color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic', marginTop: '4px' }}>{line}</div>;
                        })}
                    </div>
                </div>
            );
        }
        return (
          <div key={field.id} className="form-group" style={{ width: '100%', gridColumn: (field.id === 'inspecao_text' || field.id === 'obs_perimetria' || field.type === 'textarea') ? '1 / -1' : 'auto' }}>
            {(!field.hideLabel && field.label) && <label className="form-label">{field.label}</label>}
            {!isEditing ? (
                <div style={{ 
                    width: '100%', 
                    padding: '1.25rem', 
                    borderRadius: '0.75rem', 
                    background: '#f8fafc', 
                    border: '1px solid #e2e8f0', 
                    fontSize: '0.95rem',
                    lineHeight: '1.6',
                    color: '#1e293b',
                    whiteSpace: 'pre-wrap',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                }}>
                    {value || "Nenhuma informação registrada."}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <textarea 
                        {...commonProps}
                        rows={['diagnostico', 'conclusao'].includes(field.id) ? 8 : (field.rows || 3)} 
                        value={value || ""} 
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder="Descreva aqui..."
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                    />
                    {['conclusao', 'sugestoes_obs'].includes(field.id) && isEditing && (['afLombar', 'afCervical', 'afGeriatria', 'afOmbro', 'afMmii', 'afMao'].includes(type)) && (
                        <div style={{ marginTop: '0.5rem' }}>
                            <button
                                type="button"
                                onClick={() => {
                                    const suggestedText = generateTherapeuticText(type, answers);
                                    handleInputChange(field.id, suggestedText);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    backgroundColor: 'var(--primary)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.8rem',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 6px -1px rgba(139, 0, 0, 0.2)'
                                }}
                            >
                                <Sparkles size={16} />
                                Sugerir Terapia
                            </button>
                        </div>
                    )}
                    {['diagnostico', 'diagnostico_funcional', 'risco_quedas'].includes(field.id) && isEditing && (['afLombar', 'afCervical', 'afGeriatria', 'afOmbro', 'afMmii', 'afMao'].includes(type)) && (
                        <div style={{ marginTop: '0.5rem' }}>
                            <button
                                type="button"
                                onClick={() => {
                                    const suggestedText = generateDiagnosticText(type, answers);
                                    handleInputChange(field.id, suggestedText);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    backgroundColor: 'var(--secondary)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.8rem',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.2)'
                                }}
                            >
                                <Sparkles size={16} />
                                Sugestão Diagnóstico
                            </button>
                        </div>
                    )}
                    {field.id === 'diagnostico' && questionnaire?.diagnosisRules && (
                        <button
                            type="button"
                            onClick={() => {
                                const suggestions = questionnaire.diagnosisRules
                                    ?.filter(rule => rule.criteria(answers))
                                    .map(rule => `• ${rule.message}`);
                                
                                if (suggestions && suggestions.length > 0) {
                                    handleInputChange(field.id, suggestions.join('\n'));
                                } else {
                                    handleInputChange(field.id, "Nenhuma alteração clínica significativa detectada automaticamente.");
                                }
                            }}
                            className="btn-secondary"
                            style={{ 
                                alignSelf: 'flex-start', 
                                padding: '0.5rem 1rem', 
                                fontSize: '0.75rem', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.5rem',
                                background: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                color: '#475569',
                                fontWeight: '700'
                            }}
                        >
                            <Calculator size={14} />
                            Sugerir Diagnóstico
                        </button>
                    )}
                </div>
            )}
          </div>
        );
      case 'range': {
        const isEVA = field.id === 'intensidade_dor';
        
        // MODO FORMULÁRIO (EDIÇÃO)
        if (isEditing && !isPrint) {
            return (
                <div key={field.id} className="form-group">
                    <label className="form-label">{field.label}</label>
                    <div style={{ position: 'relative', width: '100%', paddingTop: '1rem' }}>
                        <input 
                            type="range" 
                            min={field.min} 
                            max={field.max} 
                            step={field.step} 
                            value={value || 0} 
                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                            className="custom-range"
                            style={{ 
                                width: '100%', 
                                cursor: 'pointer', 
                                accentColor: '#8B0000'
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#666', fontWeight: 'bold', marginTop: '0.5rem' }}>
                            <span>0 — {isEVA ? 'SEM DOR' : 'MÍNIMO'}</span>
                            <span style={{ 
                                backgroundColor: '#8B0000', 
                                color: 'white', 
                                width: '24px', 
                                height: '24px', 
                                borderRadius: '50%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontSize: '0.85rem',
                                position: 'absolute',
                                left: `${(Number(value) || 0) * 10}%`,
                                transform: 'translateX(-50%)',
                                top: '-4px',
                                pointerEvents: 'none',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}>
                                {value || 0}
                            </span>
                            <span>10 — {isEVA ? 'DOR INSUPORTÁVEL' : 'MÁXIMO'}</span>
                        </div>
                    </div>
                </div>
            );
        }

        // MODO RESUMO / IMPRESSÃO (NUMERO APENAS NO MARKER)
        return (
            <div key={field.id} className="form-group" style={{ 
                maxWidth: '100%',
                alignSelf: 'center'
            }}>
                {!field.hideLabel && (
                    <label className="form-label" style={{ fontWeight: '800', marginBottom: isPrint ? '0.75rem' : '2.5rem', display: 'block' }}>
                        {isEVA ? 'Intensidade de Dor (EVA)' : field.label}
                    </label>
                )}
                
                <div style={{ position: 'relative', width: '100%', paddingTop: isPrint ? '0.25rem' : '0.5rem' }}>
                    <div style={{ 
                        height: '6px', 
                        width: '100%', 
                        backgroundColor: '#e5e7eb', 
                        borderRadius: '3px',
                        position: 'relative'
                    }}>
                        <div style={{ 
                            height: '100%', 
                            width: `${(Number(value) || 0) * 10}%`, 
                            backgroundColor: '#8B0000', 
                            borderRadius: '3px'
                        }} />
                        
                        {/* Marcador com o valor embutido (Sem numero acima) */}
                        <div style={{ 
                            position: 'absolute', 
                            left: `${(Number(value) || 0) * 10}%`, 
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '28px', 
                            height: '28px', 
                            borderRadius: '50%', 
                            backgroundColor: '#8B0000',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            border: '3px solid white',
                            zIndex: 2
                        }}>
                            {value || 0}
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#666', marginTop: isPrint ? '0.4rem' : '0.8rem', fontWeight: '600' }}>
                        <span>0 — {isEVA ? 'SEM DOR' : 'MÍNIMO'}</span>
                        <span>10 — {isEVA ? 'DOR INSUPORTÁVEL' : 'MÁXIMO'}</span>
                    </div>
                </div>
            </div>
        );
      }
      case 'text':
        if (field.id.endsWith('_score') && value && field.id !== 'sorensen') {
            return null; 
        }
        if (field.id.endsWith('_data_previo')) return null;
        if (field.id.endsWith('_score_previo')) return null;
        return (
          <div key={field.id} className="form-group">
            <label className="form-label">{field.label}</label>
            <input 
              type="text" 
              {...commonProps}
              value={value || ""} 
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder="..."
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
            />
            {renderRangeWarning()}
          </div>
        );
      case 'number': {
        const isEndurance = ['flexao_60', 'sorensen', 'resist_flexora', 'resist_extensora'].includes(field.id);
        const isForce = (field.id.includes('forca_') || field.id.includes('resist_')) && !isEndurance;
        const isPerimetry = field.id.includes('perimetria_');
        const isGeriatriaTest = ['pes_juntos', 'semi_tandem', 'tandem', 'toques_tempo', 'tug', 'vel_marcha', 'sentar_levantar', 'preensao'].includes(field.id) || 
                               field.id.startsWith('unipodal_');
        
        let referenceValue: number | undefined;
        let referenceLabel = 'Referência';
        let unit = isForce ? 'kgF' : isPerimetry ? 'cm' : 'seg';
        if (field.id === 'vel_marcha') unit = 'm/s';
        if (field.id === 'preensao') unit = 'kg';

        if (isForce || isPerimetry || isEndurance || isGeriatriaTest) {
            if (field.id === 'pes_juntos') referenceValue = 30;
            if (field.id === 'semi_tandem') referenceValue = 30;
            if (field.id === 'tandem') referenceValue = 17.56;
            if (field.id.startsWith('unipodal_')) referenceValue = 10.43;
            if (field.id === 'toques_tempo') referenceValue = 10;
            if (field.id === 'tug') referenceValue = 12.47;
            if (field.id === 'vel_marcha') referenceValue = 0.8;
            if (field.id === 'preensao') {
                referenceValue = (patientGender || "").toLowerCase() === 'masculino' ? 27 : 16;
                referenceLabel = `Ref (${(patientGender || "").toLowerCase() === 'masculino' ? 'Masc' : 'Fem'})`;
            }
            
            // Dynamic thresholds for endurance tests
            if (isEndurance) {
                referenceValue = getEnduranceThreshold({ 
                    testId: field.id, 
                    gender: patientGender, 
                    age: patientAge, 
                    activityLevel: state.patientActivityLevel 
                });
                const profile = getPatientProfileString(patientGender, patientAge, state.patientActivityLevel);
                referenceLabel = `Normativa (${profile})`;
                unit = 'seg';
            }
        }

        return (
          <div key={field.id} className="form-group" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <label className="form-label">
                {field.label}
                {referenceValue !== undefined && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: isPrint ? '#666' : 'var(--text-muted)', marginLeft: '0.5rem' }}>
                        ({referenceLabel}: {referenceValue}{unit})
                    </span>
                )}
            </label>
            <input 
              type="number" 
              {...commonProps}
              value={value || ""} 
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder="0"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
            />
            {renderRangeWarning()}
            {(() => {
                if (isForce || isPerimetry || isEndurance || isGeriatriaTest) {
                    let title = field.label.split('(')[0].trim();
                    const isResistencia = ['flexao_60', 'sorensen', 'resist_flexora', 'resist_extensora'].includes(field.id);
                    
                    return (
                        <div key={`chart-${field.id}`} style={{ marginTop: 'auto', width: isPrint ? (isResistencia ? '100%' : '50%') : '100%', margin: isPrint ? '0 auto' : '0' }}>
                            <AssessmentHistoryChart 
                                fieldId={field.id}
                                currentValue={Number(value) || 0}
                                chartTitle={`Evolução: ${title}`}
                                unit={unit}
                                history={patientAssessments}
                                isPrint={isPrint}
                                referenceValue={referenceValue}
                                referenceLabel={referenceLabel}
                                assessmentId={assessmentId}
                                isEndurance={isResistencia}
                            />
                        </div>
                    );
                }
                return null;
            })()}
          </div>
        );
      }
      case 'date':
        return (
          <div key={field.id} className="form-group">
            <label className="form-label">{field.label}</label>
            {(!isEditing || isPrint) ? (
                <div style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: '#f8fafc', color: '#1e293b' }}>
                    {(() => {
                        if (!value) return "---";
                        const parts = value.split("-");
                        if (parts.length === 3) {
                            return `${parts[2]}/${parts[1]}/${parts[0]}`;
                        }
                        return value;
                    })()}
                </div>
            ) : (
                <input 
                  type="date" 
                  {...commonProps}
                  value={value || ""} 
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                />
            )}
          </div>
        );
      case 'select':
        return (
          <div key={field.id} className="form-group">
            <label className="form-label">{field.label}</label>
            <select 
              {...commonProps}
              value={value || ""} 
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
            >
              <option value="">Selecione...</option>
              {(field.options || [0,1,2,3,4,5]).map((v, idx) => {
                const val = typeof v === 'object' ? v.value : v;
                const label = typeof v === 'object' ? v.id : v;
                return (
                  <option key={idx} value={val}>{label}</option>
                );
              })}
            </select>
          </div>
        );
      case 'bodyschema': {
        const isImageUrl = value && (typeof value === 'string') && (value.startsWith('data:image') || value.startsWith('http'));

        // MODO FORMULÁRIO (ADIÇÃO/EDIÇÃO)
        if (isEditing && !isPrint) {
            return (
                <div key={field.id} className="form-group">
                    <label className="form-label" style={{ marginBottom: '1.5rem', display: 'block' }}>{field.label}</label>
                    <BodySchema 
                        image={field.image || "/img/esquema_corpo_inteiro.png"}
                        value={value} 
                        onChange={(val) => handleInputChange(field.id, val)} 
                        readOnly={false}
                    />
                </div>
            );
        }

        // MODO RESUMO / IMPRESSÃO
        return (
            <div key={field.id} className="form-group" style={{ marginBottom: isPrint ? '0.75rem' : '1.5rem' }}>
                {!field.hideLabel && (
                    <label className="form-label" style={{ marginBottom: '1rem', display: 'block', fontWeight: '800', color: isPrint ? '#8b0000' : 'var(--secondary)' }}>
                        {(isPrint || !isEditing) ? field.label.split('(')[0].trim() : field.label}
                    </label>
                )}
                <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
                    {value ? (
                            <div style={{ 
                                display: 'grid',
                                gridTemplateColumns: '1fr',
                                gridTemplateRows: '1fr',
                                position: 'relative', 
                                width: '100%', 
                                maxWidth: '750px', 
                                margin: '0 auto', 
                                borderRadius: '2rem', 
                                overflow: 'hidden', 
                                border: isPrint ? '1px solid #eee' : 'none' 
                            }}>
                                <img 
                                    src={field.image || "/img/esquema_corpo_inteiro.png"} 
                                    style={{ gridArea: '1/1', width: '100%', height: 'auto', display: 'block' }} 
                                    alt="Background" 
                                />
                                <img 
                                    src={value as string} 
                                    style={{ gridArea: '1/1', width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none' }} 
                                    alt="Marks" 
                                />
                            </div>
                    ) : (
                        <div style={{ color: '#ccc', fontSize: '0.9rem', padding: '2rem', fontStyle: 'italic', textAlign: 'center', backgroundColor: 'white', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                            Nenhuma marcação realizada
                        </div>
                    )}
                </div>
            </div>
        );
      }
      case 'image-upload':
        return (
          <div key={field.id} className="form-group">
            <label className="form-label">{field.label}</label>
            <ImageUpload 
                value={value}
                isEditing={isEditing}
                onChange={(val) => handleInputChange(field.id, val)}
                onImageClick={onImageClick}
                onAnalyzeImage={onAnalyzeImage ? (img, idx) => onAnalyzeImage(img, field.id, idx) : undefined}
                isPrint={isPrint}
            />
          </div>
        );
      case 'paintmap':
        return (
            <div key={field.id} className="form-group" style={{ width: '100%', gridColumn: '1 / -1' }}>
                {!field.hideLabel && (
                    <label className="form-label" style={{ marginBottom: '1.5rem', display: 'block', fontWeight: (isPrint || !isEditing) ? '800' : 'inherit' }}>{field.label}</label>
                )}
                <PaintMap 
                    image={field.image || ""}
                    colors={field.colors || []}
                    value={value as string}
                    onChange={(val) => handleInputChange(field.id, val)}
                    readOnly={!isEditing || isPrint}
                />
            </div>
        );
      case 'angle_measurement':
        const isAngleDataUrl = typeof value === 'string' && (value.startsWith('data:image') || value.startsWith('http'));
        return (
            <div key={field.id} className="form-group">
                {!field.hideLabel && (
                    <label className="form-label" style={{ marginBottom: '1.5rem', display: 'block', fontWeight: (isPrint || !isEditing) ? '800' : 'inherit' }}>{field.label}</label>
                )}
                {(isPrint || !isEditing) && isAngleDataUrl ? (
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                         <img 
                            src={value} 
                            style={{ 
                                width: 'auto', 
                                height: 'auto', 
                                maxWidth: '100%', 
                                maxHeight: '650px',
                                borderRadius: '1.5rem', 
                                border: '2px solid #eee',
                                boxShadow: 'var(--shadow-lg)',
                                objectFit: 'contain'
                            }} 
                            alt="Análise Angular" 
                        />
                    </div>
                ) : (
                    <AngleMeasurement 
                        value={value} 
                        onChange={(val) => handleInputChange(field.id, val)}
                        isEditing={isEditing}
                    />
                )}
            </div>
        );
      case 'freecanvas':
        return (
            <div key={field.id} className="form-group">
                <label className="form-label" style={{ marginBottom: '1.5rem', display: 'block', fontWeight: (isPrint || !isEditing) ? '800' : 'inherit' }}>{field.label}</label>
                {(isPrint || !isEditing) && value && (value.startsWith('data:image') || value.startsWith('http')) ? (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                         <img 
                            src={value} 
                            style={{ 
                                width: 'auto', 
                                height: 'auto', 
                                maxWidth: '100%', 
                                maxHeight: '500px',
                                borderRadius: '1rem', 
                                border: '1px solid var(--border)',
                                objectFit: 'contain'
                            }} 
                            alt="Canvas Desenho" 
                        />
                    </div>
                ) : (
                    <FreeCanvas 
                        value={value as string} 
                        onAnalyze={() => onAnalyzeImage?.(value as string, field.id, 0)}
                        isEditing={isEditing}
                    />
                )}
            </div>
        );
      case 'button': {
        const isQuestButton = field.id.endsWith('_novo');
        if (isQuestButton) {
            const questPrefix = field.id.split('_')[0];
            return (
                <FunctionalQuestionnaireBlock 
                    questType={questPrefix}
                    title={field.label.replace('Preencher ', '').replace('novo ', '').replace('Novo ', '')}
                    history={patientAssessments}
                    answers={answers}
                    isEditing={isEditing}
                    patientId={patientId}
                    type={type}
                    router={router}
                    assessmentId={assessmentId}
                    assessmentDate={assessmentDate}
                    isPrint={isPrint}
                />
            );
        }
        
        const isDiag = field.id === 'diag_button';
        const isSurg = field.id === 'surg_button';
        
        return (
            <div key={field.id} className="form-group">
                <button 
                    type="button"
                    onClick={() => {
                        if (field.id === 'ybt_calc' && onOpenYbt) {
                            onOpenYbt();
                        } else if (isDiag) {
                            const text = generateDiagnosticText(type, answers);
                            handleInputChange('diagnostico', text);
                        } else if (isSurg) {
                            const text = generateTherapeuticText(type, answers);
                            handleInputChange('conclusao', text);
                        }
                    }}
                    className={(!isDiag && !isSurg) ? "btn-secondary" : ""}
                    style={{ 
                        width: 'fit-content', 
                        padding: '0.6rem 1.25rem', 
                        marginTop: '0.5rem',
                        backgroundColor: isDiag ? '#1e293b' : isSurg ? '#991b1b' : undefined,
                        color: (isDiag || isSurg) ? 'white' : 'inherit',
                        border: 'none',
                        borderRadius: '0.75rem',
                        fontWeight: '700',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: (isDiag || isSurg) ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' : 'none',
                        transition: 'all 0.2s ease'
                    }}
                >
                    {(isDiag || isSurg) && <Sparkles size={16} />}
                    {isDiag ? "Sugestão Diagnóstico" : isSurg ? "Sugerir Terapia" : field.label}
                </button>
            </div>
        );
      }
      case 'info':
        return (
            <div key={field.id} className="form-group" style={{ gridColumn: '1 / -1', marginTop: '0.25rem' }}>
                <p style={{ 
                    fontSize: '0.8rem', 
                    color: '#64748b', 
                    fontStyle: 'italic', 
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: '600'
                }}>
                    <Calculator size={14} />
                    {field.label}
                </p>
            </div>
        );
      default:
        return null;
    }
});

export default FormField;
