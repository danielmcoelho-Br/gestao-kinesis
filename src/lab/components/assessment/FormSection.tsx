"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Calculator } from "lucide-react";
import FormField from "./FormField";
import DataTable from "./DataTable";
import AssessmentHistoryChart from "./AssessmentHistoryChart";
import AssessmentComparisonChart from "./AssessmentComparisonChart";
import MuscleStrengthRowChart from "./MuscleStrengthRowChart";
import { getEnduranceThreshold, getPatientProfileString } from "@/lab/utils/clinicalThresholds";
import AngleMeasurement from "@/lab/components/AngleMeasurement";
import { Section, SectionField, TableRow } from "@/lab/types/clinical";
import { useAssessmentContext } from "@/lab/contexts/AssessmentContext";
import { useParams, useRouter, useSearchParams } from "next/navigation";

interface FormSectionProps {
    section: Section; 
    isPrint?: boolean;
    hideTitle?: boolean;
    excludeFields?: string[];
    halfWidth?: boolean; // New prop
    pageBreakInside?: 'auto' | 'avoid';
}

const renderEnduranceCharts = (
    answers: any,
    patientAssessments: any[],
    patientGender: string,
    patientAge: number,
    activityLevel: string,
    isPrint: boolean,
    assessmentId: string | null,
    assessmentDate: string
) => {
    const profile = getPatientProfileString(patientGender, patientAge, activityLevel);
    const parseVal = (v: any) => {
        if (!v && v !== 0) return 0;
        return parseFloat(String(v).replace(',', '.')) || 0;
    };
    
    const renderedCharts = [];
    
    // 1. Flexao 60
    const flexao_60_val = parseVal(answers['flexao_60']);
    const flexao_60_ref = getEnduranceThreshold({ testId: 'flexao_60', gender: patientGender, age: patientAge, activityLevel });
    if (flexao_60_ref || patientAssessments.length > 1) {
        renderedCharts.push(
            <div key="container-endur-flexao_60" style={{ width: '100%', minWidth: 0 }}>
                <AssessmentHistoryChart 
                    fieldId="flexao_60"
                    currentValue={flexao_60_val}
                    chartTitle={`Flexão a 60º (${profile}: ${flexao_60_ref}s)`}
                    unit="s"
                    history={patientAssessments}
                    isPrint={isPrint}
                    assessmentId={assessmentId}
                    referenceValue={flexao_60_ref}
                    referenceLabel="Normalidade"
                    isEndurance={true}
                />
            </div>
        );
    }

    // 2. Sorensen
    const sorensen_val = parseVal(answers['sorensen']);
    const sorensen_ref = getEnduranceThreshold({ testId: 'sorensen', gender: patientGender, age: patientAge, activityLevel });
    if (sorensen_ref || patientAssessments.length > 1) {
        renderedCharts.push(
            <div key="container-endur-sorensen" style={{ width: '100%', minWidth: 0 }}>
                <AssessmentHistoryChart 
                    fieldId="sorensen"
                    currentValue={sorensen_val}
                    chartTitle={`Teste de Sorensen (${profile}: ${sorensen_ref}s)`}
                    unit="s"
                    history={patientAssessments}
                    isPrint={isPrint}
                    assessmentId={assessmentId}
                    referenceValue={sorensen_ref}
                    referenceLabel="Normalidade"
                    isEndurance={true}
                />
            </div>
        );
    }

    // 3. Prancha
    const prancha_val = parseVal(answers['prancha']);
    const prancha_ref = getEnduranceThreshold({ testId: 'prancha', gender: patientGender, age: patientAge, activityLevel });
    if (prancha_ref || patientAssessments.length > 1) {
        renderedCharts.push(
            <div key="container-endur-prancha" style={{ width: '100%', minWidth: 0 }}>
                <AssessmentHistoryChart 
                    fieldId="prancha"
                    currentValue={prancha_val}
                    chartTitle={`Prancha - Estabilidade de CORE (${profile}: ${prancha_ref}s)`}
                    unit="s"
                    history={patientAssessments}
                    isPrint={isPrint}
                    assessmentId={assessmentId}
                    referenceValue={prancha_ref}
                    referenceLabel="Normalidade"
                    isEndurance={true}
                />
            </div>
        );
    }

    // 4. Pranchas Laterais (Esq vs Dir comparative)
    const prancha_esq_val = parseVal(answers['prancha_lat_esq']);
    const prancha_dir_val = parseVal(answers['prancha_lat_dir']);
    if (prancha_esq_val > 0 || prancha_dir_val > 0) {
        renderedCharts.push(
            <div key="container-endur-prancha-lateral" style={{ width: '100%', minWidth: 0 }}>
                <MuscleStrengthRowChart 
                    row={{
                        id: 'prancha_lat_esq',
                        label: 'Prancha Lateral (Esq vs Dir)',
                        fields: ['prancha_lat_esq', 'prancha_lat_dir']
                    }}
                    answers={answers}
                    history={patientAssessments}
                    assessmentId={assessmentId}
                    assessmentDate={assessmentDate}
                    gender={patientGender}
                    age={patientAge}
                    activityLevel={activityLevel}
                    isPrint={isPrint}
                    unit="s"
                />
            </div>
        );
    }
    
    return renderedCharts;
};

const FormSection = memo(({ section, isPrint: overrideIsPrint, hideTitle = false, excludeFields = [], halfWidth = false, pageBreakInside }: FormSectionProps) => {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const state = useAssessmentContext();
    const patientId = params.patientId as string;
    const type = (params.type as string) || state.type;
    const assessmentId = searchParams.get('id');
    
    const answers = state.answers;
    const isEditing = state.isEditing;
    const handleInputChange = state.handleInputChange;
    const onImageClick = state.setSelectedImage;
    const onAnalyzeImage = state.handleAnalyzeImage;
    const patientGender = state.patientGender;
    const patientAge = state.patientAge;
    const patientAssessments = state.patientAssessments || [];
    const assessmentDate = state.assessmentDate;
    
    const isPrint = overrideIsPrint !== undefined ? overrideIsPrint : state.isPrint;

    const onOpenDynamo = (fieldId: string, label: string) => state.setDynamoModal({ fieldId, label });
    const onOpenYbt = () => state.setYbtModal(true);
    // Helpers for visibility
    const hasVal = (val: unknown) => val !== undefined && val !== null && val !== "" && val !== "null" && val !== false && (Array.isArray(val) ? val.length > 0 : true);
    
    // Check if section as a whole has any data
    const sectionHasData = () => {
        if (isEditing) return true;
        if (["anamnese", "diagnostico_conclusoes"].includes(section.id)) return true;
        
        const checkFields = (fs?: (SectionField | string)[]) => fs?.some(f => {
            const fid = typeof f === "string" ? f : f.id;
            if (excludeFields.includes(fid)) return false;
            if (f && typeof f !== "string" && f.type === 'button' && fid.endsWith('_novo')) {
                const questPrefix = fid.split('_')[0];
                return patientAssessments.some(a => a.assessment_type === questPrefix);
            }
            return hasVal(answers[fid]);
        });
        const checkRows = (rs?: TableRow[]) => rs?.some(r => r.fields.some((f) => hasVal(answers[typeof f === "string" ? f : (f as any).id])));
        
        if (section.type === "table") return checkRows(section.rows);
        if (section.type === "multi-table") return section.subsections?.some(sub => 
            checkFields(sub.fields) || (sub.type === "table" && checkRows(sub.rows))
        );
        return checkFields(section.fields);
    };

    if (!sectionHasData()) return null;

    return (
        <motion.div
            initial={isPrint ? {} : { opacity: 0, x: 20 }}
            animate={isPrint ? {} : { opacity: 1, x: 0 }}
            className="section-container"
            style={{ marginBottom: isPrint ? (hideTitle ? '0.5rem' : '1.25rem') : (hideTitle ? '1rem' : '2.5rem'), pageBreakInside: pageBreakInside || 'avoid' }}
        >
            {!hideTitle && (
                <>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: section.description ? '0.25rem' : (isPrint ? '0.75rem' : '1.5rem'), color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {section.title}
                    </h3>
                    {section.description && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: isPrint ? '0.75rem' : '1.5rem', fontWeight: '500' }}>
                            {section.description}
                        </p>
                    )}
                </>
            )}

            {section.id === 'ybt' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: (isPrint && type === 'afMmii') ? '0.75rem' : '1.5rem' }}>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                        gap: (isPrint && type === 'afMmii') ? '0.75rem' : '1.5rem',
                        transform: (isPrint && type === 'afMmii') ? 'scale(0.85)' : 'none',
                        transformOrigin: 'top center'
                    }}>
                        <div style={{ 
                            padding: (isPrint && type === 'afMmii') ? '0.75rem' : '1.5rem', 
                            borderRadius: (isPrint && type === 'afMmii') ? '0.75rem' : '1.25rem', 
                            backgroundColor: 'white', 
                            border: '1px solid var(--border)', 
                            boxShadow: 'var(--shadow-sm)',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem'
                        }}>
                            <span style={{ fontSize: (isPrint && type === 'afMmii') ? '0.65rem' : '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Membro Esquerdo</span>
                            <div style={{ fontSize: (isPrint && type === 'afMmii') ? '1.5rem' : '2.5rem', fontWeight: '900', color: 'var(--primary)' }}>
                                {answers.ybt_esq ? `${answers.ybt_esq}%` : '---'}
                            </div>
                        </div>

                        <div style={{ 
                            padding: (isPrint && type === 'afMmii') ? '0.75rem' : '1.5rem', 
                            borderRadius: (isPrint && type === 'afMmii') ? '0.75rem' : '1.25rem', 
                            backgroundColor: 'white', 
                            border: '1px solid var(--border)', 
                            boxShadow: 'var(--shadow-sm)',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem'
                        }}>
                            <span style={{ fontSize: (isPrint && type === 'afMmii') ? '0.65rem' : '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Membro Direito</span>
                            <div style={{ fontSize: (isPrint && type === 'afMmii') ? '1.5rem' : '2.5rem', fontWeight: '900', color: 'var(--primary)' }}>
                                {answers.ybt_dir ? `${answers.ybt_dir}%` : '---'}
                            </div>
                        </div>

                        <div style={{ 
                            padding: (isPrint && type === 'afMmii') ? '0.75rem' : '1.5rem', 
                            borderRadius: (isPrint && type === 'afMmii') ? '0.75rem' : '1.25rem', 
                            backgroundColor: 'var(--bg-secondary)', 
                            border: '2px dashed var(--border)', 
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem',
                            justifyContent: 'center'
                        }}>
                            <span style={{ fontSize: (isPrint && type === 'afMmii') ? '0.65rem' : '0.75rem', fontWeight: '800', color: 'var(--secondary)', textTransform: 'uppercase' }}>Assimetria</span>
                            <div style={{ fontSize: (isPrint && type === 'afMmii') ? '1.2rem' : '2rem', fontWeight: '900', color: (parseFloat(answers.ybt_diff) > 4) ? 'var(--danger)' : 'var(--success)' }}>
                                {answers.ybt_diff || '0.0%'}
                            </div>
                        </div>
                    </div>

                    {isEditing && (
                        <button 
                            type="button"
                            onClick={onOpenYbt}
                            className="btn-primary"
                            style={{ 
                                padding: '1rem', 
                                borderRadius: '1rem', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                gap: '0.75rem',
                                fontWeight: '800',
                                boxShadow: 'var(--shadow-md)'
                            }}
                        >
                            <Calculator size={20} />
                            Abrir Calculadora YBT
                        </button>
                    )}

                    <div style={{ 
                        marginTop: '2.5rem', 
                        paddingTop: '2rem', 
                        borderTop: '2px dashed var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '4px', height: '24px', backgroundColor: 'var(--primary)', borderRadius: '2px' }} />
                            <h4 style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Step-Down Test</h4>
                        </div>

                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: (isPrint && type === 'afMmii') ? 'repeat(auto-fit, minmax(150px, 1fr))' : '1fr 1fr', 
                            gap: (isPrint && type === 'afMmii') ? '0.75rem' : '1.25rem' 
                        }}>
                            <div className="form-group" style={{ maxHeight: (isPrint && type === 'afMmii') ? '180px' : 'none', overflow: 'hidden' }}>
                                <label className="form-label" style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '4px' }}>Estúdio Esquerdo</label>
                                <div style={{ height: (isPrint && type === 'afMmii') ? '150px' : 'auto' }}>
                                    <AngleMeasurement 
                                        value={answers.sd_estudio_esq} 
                                        onChange={(val) => handleInputChange('sd_estudio_esq', val)}
                                        isEditing={isEditing}
                                    />
                                </div>
                            </div>
                            <div className="form-group" style={{ maxHeight: (isPrint && type === 'afMmii') ? '180px' : 'none', overflow: 'hidden' }}>
                                <label className="form-label" style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '4px' }}>Estúdio Direito</label>
                                <div style={{ height: (isPrint && type === 'afMmii') ? '150px' : 'auto' }}>
                                    <AngleMeasurement 
                                        value={answers.sd_estudio_dir} 
                                        onChange={(val) => handleInputChange('sd_estudio_dir', val)}
                                        isEditing={isEditing}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="table-responsive" style={{ width: '100%', marginTop: '1rem', borderRadius: '1rem', border: '1px solid var(--border)', overflowX: 'auto', boxShadow: 'var(--shadow-sm)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', minWidth: '400px' }}>
                                <thead>
                                    <tr style={{ backgroundColor: 'var(--bg-secondary)' }}>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '800', color: 'var(--secondary)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Parâmetro</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '800', color: 'var(--secondary)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Esq (°)</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '800', color: 'var(--secondary)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Resultado</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '800', color: 'var(--secondary)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Dir (°)</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '800', color: 'var(--secondary)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Resultado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { id: 'sd_pelvis', label: 'Queda de pelve (10°±5)' },
                                        { id: 'sd_knee', label: 'Valgo dinâmico do joelho (8°±5)' }
                                    ].map(row => (
                                        <tr key={row.id}>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: '700', color: 'var(--secondary)', borderBottom: '1px solid #f1f5f9' }}>{row.label}</td>
                                            {/* ESQ */}
                                            <td style={{ padding: '0.75rem', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                                                <input 
                                                    type="text" 
                                                    value={answers[`${row.id}_e`] || ''} 
                                                    onChange={(e) => handleInputChange(`${row.id}_e`, e.target.value)}
                                                    disabled={!isEditing}
                                                    className="form-control"
                                                    style={{ width: '60px', margin: '0 auto', textAlign: 'center', fontWeight: '700' }}
                                                />
                                            </td>
                                            <td style={{ padding: '0.75rem', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                                                {answers[`${row.id}_res_e`] ? (
                                                    <span style={{ 
                                                        fontSize: '0.7rem', 
                                                        fontWeight: '800', 
                                                        color: answers[`${row.id}_res_e`] === 'Alterado' ? '#991b1b' : '#166534',
                                                        backgroundColor: answers[`${row.id}_res_e`] === 'Alterado' ? '#fee2e2' : '#f0fdf4',
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        border: `1px solid ${answers[`${row.id}_res_e`] === 'Alterado' ? '#fecaca' : '#bbf7d0'}`
                                                    }}>
                                                        {answers[`${row.id}_res_e`]}
                                                    </span>
                                                ) : <span style={{ color: '#cbd5e1' }}>---</span>}
                                            </td>
                                            {/* DIR */}
                                            <td style={{ padding: '0.75rem', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                                                <input 
                                                    type="text" 
                                                    value={answers[`${row.id}_d`] || ''} 
                                                    onChange={(e) => handleInputChange(`${row.id}_d`, e.target.value)}
                                                    disabled={!isEditing}
                                                    className="form-control"
                                                    style={{ width: '60px', margin: '0 auto', textAlign: 'center', fontWeight: '700' }}
                                                />
                                            </td>
                                            <td style={{ padding: '0.75rem', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                                                {answers[`${row.id}_res_d`] ? (
                                                    <span style={{ 
                                                        fontSize: '0.7rem', 
                                                        fontWeight: '800', 
                                                        color: answers[`${row.id}_res_d`] === 'Alterado' ? '#991b1b' : '#166534',
                                                        backgroundColor: answers[`${row.id}_res_d`] === 'Alterado' ? '#fee2e2' : '#f0fdf4',
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        border: `1px solid ${answers[`${row.id}_res_d`] === 'Alterado' ? '#fecaca' : '#bbf7d0'}`
                                                    }}>
                                                        {answers[`${row.id}_res_d`]}
                                                    </span>
                                                ) : <span style={{ color: '#cbd5e1' }}>---</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginTop: '0.5rem' }}>
                        <label className="form-label" style={{ fontWeight: '700' }}>OBSERVAÇÕES</label>
                        <textarea 
                            value={answers.ybt_obs || ''}
                            onChange={(e) => handleInputChange('ybt_obs', e.target.value)}
                            disabled={!isEditing}
                            rows={3}
                            placeholder="Notas clínicas sobre a execução do teste..."
                            className="form-control"
                            style={{ 
                                width: '100%', 
                                padding: '1rem', 
                                borderRadius: '0.75rem', 
                                border: '1px solid var(--border)', 
                                resize: 'vertical' 
                            }}
                        />
                    </div>
                </div>
            ) : section.type === 'table' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                    <DataTable 
                        section={section} 
                        isPrint={isPrint}
                    />                    {/* 1. SIDE-BY-SIDE EVOLUTION CHARTS (Data-heavy sections) */}
                    {['perimetria', 'forca', 'forca_preensao', 'forca_quadril_lombar', 'dinamometria', 'ndi_integracao', 'oswestry_integracao', 'quickdash_integracao', 'resistencia', 'testes_resistencia', 'testes_fadiga', 'testes_especiais_resistidos', 'resistencia_tronco', 'testes_equilibrio', 'adm', 'movimento_cervical', 'movimento_lombar', 'endurance'].includes(section.id) && (
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: isPrint ? '1fr 1fr' : 'repeat(auto-fit, minmax(400px, 1fr))',
                            gap: isPrint ? '2.5%' : '1.5rem', 
                            marginTop: '1.5rem',
                            width: '100%',
                            pageBreakInside: 'avoid'
                        }}>
                            {((type === 'afMmii' || type === 'afLombar') && (section.id === 'forca' || section.id === 'forca_quadril_lombar')) || (type === 'afMao' && section.id === 'forca_preensao') ? (
                                // SPECIAL ROW-BY-ROW COMPARATIVE CHARTS FOR MMII & MAO STRENGTH
                                section.rows?.filter((r: TableRow) => r.id !== 'relacao_iq').map((row: TableRow) => (
                                    <MuscleStrengthRowChart 
                                        key={`${type}-forca-${row.id}`}
                                        row={row}
                                        answers={answers}
                                        history={patientAssessments}
                                        assessmentId={assessmentId}
                                        assessmentDate={assessmentDate}
                                        gender={patientGender}
                                        age={patientAge}
                                        activityLevel={state.patientActivityLevel}
                                        isPrint={isPrint}
                                    />
                                ))
                            ) : (
                                // STANDARD HISTORY CHARTS OR ENDURANCE GROUPED CHARTS
                                section.id === 'testes_resistencia' ? (
                                    renderEnduranceCharts(answers, patientAssessments, patientGender, patientAge, state.patientActivityLevel, isPrint, assessmentId, assessmentDate)
                                ) : (
                                    section.rows?.map((row: TableRow) => row.fields.map((f, fidx: number) => {
                                        const fid = typeof f === "string" ? f : (f as any).id;
                                        if (excludeFields.includes(fid)) return null;
                                        
                                        // Render ONLY charts here, not individual fields (DataTable handles the inputs)
                                        if (fid.endsWith('_res') || fid.endsWith('_status') || fid.endsWith('_obs')) return null;

                                        const colLabel = typeof section.columns?.[fidx + 1] === "string" 
                                            ? section.columns?.[fidx + 1] 
                                            : (section.columns?.[fidx + 1] as any)?.label || "";
                                        
                                        const referenceValue = ['resist_flexora', 'resist_extensora', 'flexao_60', 'sorensen'].includes(fid) 
                                            ? getEnduranceThreshold({ testId: fid, gender: state.patientGender, age: state.patientAge, activityLevel: state.patientActivityLevel })
                                            : undefined;

                                        const isClinicalTest = ['resist_flexora', 'resist_extensora', 'flexao_60', 'sorensen'].includes(fid);
                                        const isTime = colLabel.includes("Tempo") || colLabel.includes("segundos");
                                        const isValue = colLabel.includes("Valor") || colLabel.includes("Tentativa");
                                        const isScore = fid.endsWith("_score");

                                        if ((isScore || isClinicalTest || isTime || isValue) && (patientAssessments.length > 1 || referenceValue)) {
                                            const profile = getPatientProfileString(state.patientGender, state.patientAge, state.patientActivityLevel);
                                            const chartTitle = isClinicalTest 
                                                ? `${row.label.replace('(Ref: Normativa)', '').trim()} (${profile}: ${referenceValue}s)`
                                                : `Evolução: ${row.label} (${colLabel})`;

                                            return (
                                                <AssessmentHistoryChart 
                                                    key={`hist-${fid}`}
                                                    fieldId={fid}
                                                    currentValue={answers[fid] || 0}
                                                    chartTitle={chartTitle}
                                                    unit={isScore ? "%" : ((section.id.includes("forca") || section.id.includes("dinamometria")) && !isClinicalTest ? "kgF" : (isTime ? "s" : "un"))}
                                                    history={patientAssessments}
                                                    isPrint={isPrint}
                                                    assessmentId={assessmentId}
                                                    referenceValue={referenceValue}
                                                    referenceLabel="Normalidade"
                                                    isEndurance={isClinicalTest}
                                                    useScoreData={isScore}
                                                />
                                            );
                                        }
                                        return null;
                                    }))
                                )
                            )}
                        </div>
                    )}

                    {/* 2. FULL-WIDTH TEXT FIELDS (Anamnese, Diagnóstico, etc.) */}
                    {section.fields && section.fields.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: section.fields.some((f: any) => f.type === 'textarea') ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '0.5rem', width: '100%' }}>
                            {section.fields.filter((f: any) => {
                                if (excludeFields.includes(f.id)) return false;
                                if (isEditing) return true;
                                if (f.type === 'button') return f.id?.endsWith('_novo');
                                if (!isEditing && (f.id === 'oswestry_score' || f.id === 'ndi_score')) return false;
                                return hasVal(answers[f.id]);
                            }).map((field: any) => (
                                <FormField 
                                    key={field.id}
                                    field={field}
                                    isPrint={isPrint}
                                />
                            ))}
                        </div>
                    )}
                </div>
            ) : section.type === 'multi-table' ? (
                <div style={{ 
                    display: (!halfWidth && (isPrint || !isEditing)) && (
                        section.id.includes('miofascial_neural') || 
                        section.id.includes('palpacao_miofascial') || 
                        section.id.includes('testes_especiais') || 
                        section.id.includes('testes_fadiga') || 
                        section.id.includes('fadiga') || 
                        section.id.includes('dinamometria') || 
                        section.id.includes('miotomos') || 
                        section.id.includes('reflexos') || 
                        section.id.includes('irritabilidade') || 
                        section.id.includes('movimento') ||
                        section.id.includes('avaliacao_do_movimento') ||
                        section.id.includes('resistencia') ||
                        section.id.includes('palpacao') ||
                        section.id.includes('inspecao')
                    ) ? 'grid' : 'flex', 
                    gridTemplateColumns: (!halfWidth && (isPrint || !isEditing)) && (
                        section.id.includes('miofascial_neural') || 
                        section.id.includes('palpacao_miofascial') || 
                        section.id.includes('testes_especiais') || 
                        section.id.includes('testes_fadiga') || 
                        section.id.includes('fadiga') || 
                        section.id.includes('dinamometria') || 
                        section.id.includes('miotomos') || 
                        section.id.includes('reflexos') || 
                        section.id.includes('irritabilidade') || 
                        section.id.includes('movimento') ||
                        section.id.includes('avaliacao_do_movimento') ||
                        section.id.includes('resistencia') ||
                        section.id.includes('adm') ||
                        section.id.includes('mmii') ||
                        section.id.includes('tornozelo') ||
                        section.id.includes('inspecao') ||
                        section.id.includes('palpacao')
                    ) ? (['afTornozelo', 'afMao'].includes(type) ? '48% 48%' : '1fr 1fr') : 'none',
                    justifyContent: (['afTornozelo', 'afMao'].includes(type) && !halfWidth && (isPrint || !isEditing)) ? 'space-between' : 'flex-start',
                    flexDirection: 'column', 
                    gap: (['afTornozelo', 'afMao'].includes(type) && !halfWidth && (isPrint || !isEditing)) ? '1.5rem 4%' : (isPrint ? '0.75rem' : '1.5rem'),
                    width: '100%',
                    minWidth: 0
                }}>
                    {section.subsections?.filter((sub: Section) => {
                        if (isEditing) return true;
                        const checkFields = (fs?: (SectionField | string)[]) => fs?.some(f => hasVal(answers[typeof f === "string" ? f : f.id]));
                        const checkRows = (rs?: TableRow[]) => rs?.some(r => r.fields.some((f) => hasVal(answers[typeof f === "string" ? f : (f as any).id])));
                        return checkFields(sub.fields) || (sub.type === "table" && checkRows(sub.rows));
                    }).map((sub: Section, sidx: number) => (
                        <div key={sidx} style={{ 
                            padding: isPrint ? '0.5rem' : '1.5rem', 
                            backgroundColor: 'white', 
                            borderRadius: '0.75rem', 
                            border: '1px solid var(--border)',
                            pageBreakInside: 'auto'
                        }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--secondary)' }}>{sub.title}</h4>
                             <div style={{ width: '100%', marginBottom: isPrint ? '0' : '1.5rem' }}>
                             {sub.type === 'table' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {((sub.id === 'testes_resistencia' || sub.id === 'testes_especiais_resistidos')) ? (
                                        /* UNIFIED Layout for Endurance/Muscular Resistance Tests: 1 Table (50%) + 2 Charts (25% each) */
                                         <div style={{ 
                                             display: 'grid', 
                                             gridTemplateColumns: (isEditing && !isPrint) ? '1fr' : (isPrint ? '1fr' : '2fr 1fr 1fr'), 
                                             gap: isPrint ? '0.75rem' : '1.5rem',
                                             alignItems: 'flex-start',
                                             width: '100%'
                                         }}>
                                             <div style={{ width: '100%', minWidth: 0 }}>
                                                 <DataTable 
                                                     section={sub} 
                                                     isPrint={isPrint}
                                                 />
                                             </div>
                                             
                                             {/* Render Charts as direct children of the grid in summary mode */}
                                             <div style={{ 
                                                 display: (isEditing && !isPrint || isPrint) ? 'grid' : 'contents', 
                                                 gridTemplateColumns: (isEditing && !isPrint || isPrint) ? '1fr 1fr' : 'none',
                                                 gap: isPrint ? '4%' : '1.5rem',
                                                 width: '100%',
                                                 marginTop: isPrint ? '0.5rem' : '0'
                                             }}>
                                                 {sub.rows?.map((row: TableRow) => row.fields.map((f, fidx: number) => {
                                                     const fid = typeof f === "string" ? f : (f as any).id;
                                                     
                                                     // Filter out non-measurement fields
                                                     if (fid.endsWith('_res') || fid.endsWith('_status')) return null;

                                                     const currentValue = answers[fid];
                                                     const referenceValue = getEnduranceThreshold({ testId: fid, gender: patientGender, age: patientAge, activityLevel: state.patientActivityLevel });
                                                     const profile = getPatientProfileString(patientGender, patientAge, state.patientActivityLevel);
                                                     const chartTitle = `${row.label.replace('(Ref: Normativa)', '').trim()} (${profile}: ${referenceValue}s)`;

                                                     if (referenceValue || patientAssessments.length > 1) {
                                                         return (
                                                             <div key={`container-endur-unif-${fid}`} style={{ width: '100%', minWidth: 0 }}>
                                                                 <AssessmentHistoryChart 
                                                                     fieldId={fid}
                                                                     currentValue={currentValue || 0}
                                                                     chartTitle={chartTitle}
                                                                     unit="s"
                                                                     history={patientAssessments}
                                                                     isPrint={isPrint}
                                                                     assessmentId={assessmentId}
                                                                     referenceValue={referenceValue}
                                                                     referenceLabel="Normalidade"
                                                                     isEndurance={true}
                                                                 />
                                                             </div>
                                                         );
                                                     }
                                                     return null;
                                                 }))}
                                             </div>
                                         </div>
                                     ) : (
                                         <DataTable 
                                             section={sub} 
                                             isPrint={isPrint}
                                         />
                                     )}
                                     {['perimetria', 'forca', 'dinamometria', 'ndi_integracao', 'oswestry_integracao', 'quickdash_integracao'].includes(sub.id) && (
                                          <div style={{ 
                                              display: 'grid', 
                                              gridTemplateColumns: isPrint ? '1fr 1fr' : 'repeat(auto-fit, minmax(400px, 1fr))',
                                              gap: isPrint ? '4%' : '1.5rem', 
                                              marginTop: '1rem' 
                                          }}>
                                             {sub.rows?.map((row: TableRow) => row.fields.map((f, fidx: number) => {
                                                 const fid = typeof f === "string" ? f : (f as any).id;
                                                 
                                                 // Filter out non-measurement fields
                                                 if (fid.endsWith('_res') || fid.endsWith('_status') || fid.endsWith('_obs')) return null;

                                                 const col = sub.columns?.[fidx + 1];
                                                 const colLabel = typeof col === "string" ? col : (col?.label || "");
                                                 const currentValue = answers[fid];
                                                 const referenceValue = ['resist_flexora', 'resist_extensora', 'flexao_60', 'sorensen'].includes(fid) 
                                                     ? getEnduranceThreshold({ testId: fid, gender: patientGender, age: patientAge, activityLevel: state.patientActivityLevel })
                                                     : undefined;
                                                 const isClinicalTest = ['resist_flexora', 'resist_extensora', 'flexao_60', 'sorensen'].includes(fid);
                                                 const isSideSpecific = colLabel.includes("Esquerdo") || colLabel.includes("Direito");
                                                 const isScore = fid.endsWith("_score");
                                                 const profile = getPatientProfileString(patientGender, patientAge, state.patientActivityLevel);
                                                 const chartTitle = isClinicalTest 
                                                     ? `${row.label.replace('(Ref: Normativa)', '').trim()} (${profile}: ${referenceValue}s)`
                                                     : `Evolução: ${row.label} (${colLabel})`;

                                                 if ((isSideSpecific || isScore || isClinicalTest) && (patientAssessments.length > 1 || referenceValue)) {
                                                     return (
                                                         <AssessmentHistoryChart 
                                                             key={`hist-sub-${fid}`}
                                                             fieldId={fid}
                                                             currentValue={currentValue || 0}
                                                             chartTitle={chartTitle}
                                                             unit={isScore ? "%" : ((sub.id.includes("forca") || sub.id.includes("dinamometria")) && !isClinicalTest ? "kgF" : "s")}
                                                             history={patientAssessments}
                                                             isPrint={isPrint}
                                                             assessmentId={assessmentId}
                                                             referenceValue={referenceValue}
                                                             referenceLabel="Normalidade"
                                                             isEndurance={true}
                                                             useScoreData={isScore}
                                                         />
                                                     );
                                                 }
                                                 return null;
                                             }))}
                                         </div>
                                     )}
                                     {sub.fields && sub.fields.length > 0 && (
                                         <div style={{ display: 'grid', gridTemplateColumns: (sub.type === 'table' && sub.fields.some((f:any) => f.type === 'textarea')) ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                             {sub.fields.filter((f: SectionField) => {
                                                 if (isEditing) return true;
                                                 if (!isEditing && (f.id === 'oswestry_score' || f.id === 'ndi_score')) return false;
                                                 return hasVal(answers[f.id]);
                                             }).map((field: SectionField) => (
                                                 <FormField 
                                                     key={field.id}
                                                     field={field}
                                                     isPrint={isPrint}
                                                 />
                                             ))}
                                         </div>
                                     )}
                                 </div>
                             ) : (
                                <div style={{ display: "grid", gridTemplateColumns: sub.fields?.some((f: SectionField) => f.type === "image-upload") ? "1fr 1fr" : "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
                                    {sub.fields?.filter(f => {
                                        if (isEditing) return true;
                                        if (!isEditing && (f.id === 'oswestry_score' || f.id === 'ndi_score')) return false;
                                        return hasVal(answers[f.id]);
                                    }).map((field: SectionField) => (
                                        <FormField 
                                            key={field.id}
                                            field={field}
                                            isPrint={isPrint}
                                        />
                                    ))}
                                </div>
                             )}

                             {/* Subsection Comparison Charts */}
                             {['forca', 'dinamometria'].includes(sub.id) && sub.type === 'table' && (
                                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                                     {sub.rows?.map((row: TableRow) => {
                                         const esq = row.fields.find((f: any) => (typeof f === "string" ? f : f.id).toLowerCase().includes("esq"));
                                         const dir = row.fields.find((f: any) => (typeof f === "string" ? f : f.id).toLowerCase().includes("dir"));
                                         if (esq && dir) {
                                             const vE = Number(String(answers[typeof esq === "string" ? esq : esq.id] || "0").replace(",", ".")) || 0;
                                             const vD = Number(String(answers[typeof dir === "string" ? dir : dir.id] || "0").replace(",", ".")) || 0;
                                             if (vE > 0 || vD > 0) return (
                                                 <AssessmentComparisonChart 
                                                     key={`comp-sub-${row.id}`}
                                                     label={`Comparativo: ${row.label}`}
                                                     leftValue={vE}
                                                     rightValue={vD}
                                                     unit="kgF"
                                                     isPrint={isPrint}
                                                 />
                                             );
                                         }
                                         return null;
                                     })}
                                 </div>
                             )}
                             </div>
                        </div>
                    ))}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                        {section.fields?.filter((f: any) => {
                            if (isEditing) return true;
                            if (f.type === 'button') return f.id?.endsWith('_novo');
                            if (!isEditing && (f.id === 'oswestry_score' || f.id === 'ndi_score')) return false;
                            return hasVal(answers[f.id]);
                        }).map((field: any) => (
                            <FormField 
                                key={field.id}
                                field={field}
                                isPrint={isPrint}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: (isPrint || !isEditing) 
                        ? ((section.id === 'anamnese' || section.id === 'testes_resistencia') ? '1fr 1fr' : (section.fields?.some((f: any) => f.type === 'image-upload') ? '1fr 1fr' : 'repeat(auto-fit, minmax(300px, 1fr))')) 
                        : '1fr', 
                    gap: '1.5rem' 
                }}>
                    {section.fields?.filter((f: any) => {
                        if (excludeFields.includes(f.id)) return false;
                        if (isEditing) return true;
                        if (f.type === 'button') return f.id?.endsWith('_novo');
                        if (!isEditing && (f.id === 'oswestry_score' || f.id === 'ndi_score')) return false;
                        return hasVal(answers[f.id]);
                    }).map((field: any) => (
                        <FormField 
                            key={field.id}
                            field={field}
                            isPrint={isPrint}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    );
});

export default FormSection;
