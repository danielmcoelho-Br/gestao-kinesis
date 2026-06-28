import { Section } from "@/lab/data/questionnaires";
import FormSection from "../FormSection";
import FormField from "../FormField";
import { calculateAssessmentScore, CalculationType } from "@/lab/lib/calculations";
import NutritionReport from "./NutritionReport";

interface PrintSummaryViewProps {
    forScreen?: boolean;
    questionnaire: any;
    items: any[];
    isClinical: boolean;
}

import { useAssessmentContext } from "@/lab/contexts/AssessmentContext";
import { useParams, useRouter, useSearchParams } from "next/navigation";

export default function PrintSummaryView({
    forScreen = false,
    questionnaire,
    items,
    isClinical
}: PrintSummaryViewProps) {
    const params = useParams();
    const searchParams = useSearchParams();
    const state = useAssessmentContext();
    
    const patientId = params.patientId as string;
    const type = (params.type as string) || state.type;
    const assessmentId = searchParams.get('id');
    
    const { 
        patientName, 
        patientAge,
        patientGender,
        assessmentDate, 
        user, 
        assessmentOwner, 
        answers, 
        patientAssessments, 
        isFinished 
    } = state;

    return (
      <div className={forScreen ? "continuous-screen-view" : "print-all-content"}>
        {/* HEADER REDESIGN */}
        <div style={{ marginBottom: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <img src="/logo-kinesis.png" alt="KinesisLab Logo" style={{ width: '130px', height: 'auto', marginBottom: '0.1rem' }} />
            <div style={{ textAlign: 'center', width: '100%', borderBottom: '2.5px solid #8b0000', paddingBottom: '0.4rem', marginBottom: '0.5rem' }}>
                <h1 style={{ fontSize: '1.3rem', color: '#8b0000', margin: 0, textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.05em' }}>
                    {questionnaire.title}
                </h1>
            </div>

            {/* PATIENT INFO CARD */}
            <div style={{ 
                width: '100%', 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '1.5rem', 
                backgroundColor: '#f8fafc', 
                padding: '1rem', 
                borderRadius: '0.75rem', 
                border: '1px solid #e2e8f0',
                fontSize: '0.95rem'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p style={{ margin: 0, fontWeight: '800', color: '#1e293b' }}>
                        <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Paciente</span>
                        {patientName || patientId}
                    </p>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <p style={{ margin: 0, fontWeight: '700' }}>
                           <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Idade</span>
                           {patientAge || '--'} anos
                        </p>
                        <p style={{ margin: 0, fontWeight: '700' }}>
                           <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Sexo</span>
                           {patientGender || '--'}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'right' }}>
                    <p style={{ margin: 0, fontWeight: '800', color: '#1e293b' }}>
                        <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Avaliador</span>
                        {type === 'nutricao' ? 'Cristiana Alves Ferreira Amato' : (assessmentOwner?.name || user?.name)}
                    </p>
                    <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'flex-end' }}>
                        <p style={{ margin: 0, fontWeight: '700' }}>
                           <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>{type === 'nutricao' ? 'CRN' : 'CREFITO'}</span>
                           {type === 'nutricao' ? 'CRN-3 10407' : (assessmentOwner?.crefito || user?.crefito || '--')}
                        </p>
                        <p style={{ margin: 0, fontWeight: '700' }}>
                           <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Data</span>
                           {assessmentDate || '--'}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* CONTENT RENDERER */}
        {type === 'nutricao' ? (
            <NutritionReport 
                answers={answers}
                patientGender={patientGender}
                patientAge={patientAge}
                patientName={patientName}
                assessmentDate={assessmentDate}
                patientAssessments={patientAssessments}
                assessmentId={assessmentId}
                isPrint={!forScreen}
            />
        ) : isClinical ? (
            items.filter(item => {
                const section = item as Section;
                
                // Core sections should usually be shown
                if (['anamnese', 'diagnostico_conclusoes', 'resultados_diagnostico', 'sugestoes'].includes(section.id)) return true;
                
                const hasValue = (val: any) => {
                    if (val === undefined || val === null || val === '' || val === 'null' || val === false) return false;
                    if (Array.isArray(val)) return val.length > 0;
                    if (typeof val === 'number') return true; // Keep 0
                    return true;
                };

                const checkFieldsData = (fields?: any[]) => fields?.some(f => {
                    const fid = typeof f === 'string' ? f : f?.id;
                    if (!fid) return false;
                    if (f && typeof f !== 'string' && f.type === 'button' && fid.endsWith('_novo')) {
                        const questPrefix = fid.split('_')[0];
                        return (patientAssessments || []).some(a => a.assessment_type === questPrefix);
                    }
                    return hasValue(answers[fid]);
                });

                const checkRowsData = (rows?: any[]) => rows?.some((r: any) => r.fields.some((f: any) => {
                    const fid = typeof f === 'string' ? f : f.id;
                    return hasValue(answers[fid]);
                }));

                const hasTableData = section.type === 'table' && checkRowsData(section.rows);
                const hasSubData = section.subsections?.some(sub => 
                    checkFieldsData(sub.fields) || (sub.type === 'table' && checkRowsData(sub.rows))
                );

                // Also check if any field in the section has history data (even if current answer is empty) to show charts
                const hasHistoryData = section.fields?.some(f => {
                    const fid = typeof f === 'string' ? f : f?.id;
                    return (patientAssessments || []).some(a => a.answers?.[fid]);
                });

                const hasTableHistoryData = section.type === 'table' && section.rows?.some(r => r.fields.some(f => {
                    const fid = typeof f === 'string' ? f : f.id;
                    return (patientAssessments || []).some(a => a.answers?.[fid]);
                }));

                return checkFieldsData(section.fields) || hasTableData || hasSubData || hasHistoryData || hasTableHistoryData;
            }).reduce((acc: any[], item, idx, arr) => {
                const isClinicalAssessment = ['afOmbro', 'afCervical', 'afLombar', 'afGeriatria', 'afMmii', 'afTornozelo', 'afMao'].includes(type);
                const section = item as Section;

                if (isClinicalAssessment) {
                    const isMultiTable = section.type === 'multi-table';
                     const FULL_WIDTH_SECTIONS = [
                        'anamnese', 
                        'forca',
                        'forca_quadril_lombar',
                        'testes_resistencia', 
                        'resistencia_tronco', 
                        'testes_especiais_resistidos',
                        'conclusoes',
                        'diagnostico_conclusoes',
                        'resultados_diagnostico',
                        'sugestoes',
                        'oswestry_integracao',
                        'ndi_integracao',
                        'quickdash_integracao',
                        'integracao',
                        'ybt',
                        'perimetria',
                        'forca_preensao'
                    ];

                    // DASHBOARD LOGIC (First Row)
                    // idx 0 (Header) groups with idx 1 if idx 1 is not a mandated full-width section.
                    const firstItem = arr[0] as Section;
                    const secondItem = arr[1] as Section;
                    const isDashboardSecondary = secondItem && 
                        !FULL_WIDTH_SECTIONS.includes(secondItem.id) && 
                        !(type === 'afLombar' && secondItem.id === 'exame_neurologico');

                    if (idx === 0) {
                        if (isDashboardSecondary) {
                            acc.push({ ...section, isClinicalDashboard: true, secondarySection: secondItem });
                            return acc;
                        }
                    }
                    
                    // SKIP idx 1 if it was grouped with idx 0
                    if (idx === 1 && isDashboardSecondary) {
                        return acc;
                    }

                    const mustBeFullWidth = FULL_WIDTH_SECTIONS.includes(section.id) || isMultiTable;

                    // PAIR PAIRING (Subsequent rows)
                    // NEVER pair multi-tables. ONLY pair simple 'table' sections.
                    if (!mustBeFullWidth && idx > (isDashboardSecondary ? 1 : 0)) {
                        const prevWasGrouped = acc.some(a => a.isPairGroup && a.secondarySection === section);
                        if (prevWasGrouped) return acc;

                        const nextSection = arr[idx + 1] as Section;
                        const canPairNext = nextSection && !FULL_WIDTH_SECTIONS.includes(nextSection.id) && nextSection.type === 'table';
                        
                        if (canPairNext && section.type === 'table') {
                            acc.push({
                                ...section,
                                isPairGroup: true,
                                secondarySection: nextSection
                            });
                            return acc;
                        }
                    }

                    // If it reached here, it's either full-width or a solo simple section
                    acc.push(section);
                    return acc;
                }

                acc.push(item);
                return acc;
            }, []).map((item, idx) => {
                const section = item as any;

                // 1. TOP DASHBOARD (Anamnese + Pain Map + 1st Metrics)
                if (section.isClinicalDashboard) {
                    const evaField = section.fields?.find((f: any) => typeof f !== 'string' && f.id === 'intensidade_dor');
                    const mapField = section.fields?.find((f: any) => typeof f !== 'string' && f.id === 'area_dor');
                    const anamneseField = section.fields?.find((f: any) => typeof f !== 'string' && (f.id === 'anamnese' || f.id.startsWith('anamnese_') || f.id === 'queixa'));
                    
                    return (
                        <div key={`${section.id}_${idx}`} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', marginBottom: '1.5rem' }}>
                            {/* Top Row (100% width): Anamnese */}
                            <div style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '0.75rem', border: '1px solid #e2e8f0', width: '100%' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: '900', marginBottom: '0.75rem', color: '#8b0000', textTransform: 'uppercase' }}>Histórico Clínico</h3>
                                {anamneseField && <FormField field={anamneseField} isPrint={true} />}
                            </div>

                            {/* Flex Row (48% / 48%) */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', width: '100%' }}>
                                {/* Left Column: EVA + Secondary Section (Metrics) */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '48%' }}>
                                    <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                                        <h4 style={{ fontSize: '0.8rem', fontWeight: '800', marginBottom: '0.25rem', color: 'var(--secondary)' }}>INTESIDADE DA DOR (EVA)</h4>
                                        {evaField && <FormField field={{ ...evaField, hideLabel: true }} isPrint={true} />}
                                    </div>

                                     {section.secondarySection && (
                                         <FormSection 
                                             section={section.secondarySection} 
                                             isPrint={true} 
                                             hideTitle={false}
                                             halfWidth={true}
                                         />
                                     )}
                                </div>

                                {/* Right Column: Body Map */}
                                <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '48%' }}>
                                    <h4 style={{ width: '100%', fontSize: '0.8rem', fontWeight: '800', marginBottom: '1.5rem', color: 'var(--secondary)', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.25rem' }}>MAPA DE DOR</h4>
                                    {mapField && (
                                        <div style={{ transform: 'scale(1.1)', transformOrigin: 'top center' }}>
                                            <FormField field={{ ...mapField, hideLabel: true }} isPrint={true} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                }

                // 2. PAIR GROUP RENDERER (Clean 2-column layout for subsequent tables)
                if (section.isPairGroup) {
                    return (
                        <div key={`${section.id}_${idx}`} style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '1.5rem', pageBreakInside: 'avoid' }}>
                            <div style={{ width: '48%' }}>
                                <FormSection section={section} isPrint={true} halfWidth={true} />
                            </div>
                            <div style={{ width: '48%' }}>
                                <FormSection section={section.secondarySection} isPrint={true} halfWidth={true} />
                            </div>
                        </div>
                    );
                }

                const pageBreak = (type === 'afLombar' && (item as Section).id === 'exame_neurologico') ? 'auto' : 'avoid';
                return (
                    <div key={`${(item as Section).id}_${idx}`} style={{ marginBottom: '1.5rem', pageBreakInside: pageBreak }}>
                        <FormSection 
                            section={item as Section} 
                            isPrint={true} 
                            pageBreakInside={pageBreak}
                        />
                    </div>
                );
            })
        ) : (
            <div style={{ 
                marginTop: '1.5rem', 
                border: '1.5px solid #cbd5e1', 
                borderRadius: '0.75rem', 
                backgroundColor: '#ffffff',
                overflow: 'hidden'
            }}>
                {items.map((item, idx) => {
                    const key = (item as any).id !== undefined ? (item as any).id : idx;
                    if ((item as any).isInstruction || answers[key] === undefined) return null;
                    return (
                        <div key={idx} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'baseline', 
                            padding: '0.45rem 0.75rem', 
                            borderBottom: idx === items.length - 1 ? 'none' : '1px dashed #cbd5e1',
                            fontSize: '0.82rem',
                            lineHeight: '1.25',
                            pageBreakInside: 'avoid'
                        }}>
                            <div style={{ fontWeight: '600', color: '#334155', maxWidth: '70%', marginRight: '1rem' }}>
                                {(item as any).text}
                            </div>
                            <div style={{ fontWeight: '800', color: '#0f172a', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                {((item as any).options?.find((o: any) => o.value === answers[key])?.label || 'Não respondido')}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}


        {!isClinical && (
            <div style={{ marginTop: '1.5rem', padding: '0.75rem 1rem', border: '1.5px solid #8B0000', borderRadius: '0.5rem', backgroundColor: '#fff5f5' }}>
                <h4 style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.25rem', color: '#8B0000' }}>Resultado da Avaliação:</h4>
                <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#8B0000' }}>
                    {(() => {
                        const res = calculateAssessmentScore((questionnaire as any).structure?.calculationType || (type as CalculationType), answers);
                        let scoreStr = `${res.score} pts`;
                        if (res.percentage !== undefined && res.unit === '%') {
                            scoreStr += ` (${res.percentage}%)`;
                        }
                        const displayInterpretation = res.interpretation === 'Avaliação Concluída' ? '' : ` — ${res.interpretation}`;
                        return `Pontuação: ${scoreStr}${displayInterpretation}`;
                    })()}
                </div>
            </div>
        )}

        {/* Signature Section */}
        {type === 'nutricao' ? (
            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', breakInside: 'avoid' }}>
                <div style={{ height: '55px' }} /> {/* Espaço para assinatura */}
                <div style={{ width: '300px', borderTop: '1.5px solid #333', textAlign: 'center', paddingTop: '0.35rem' }}>
                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.95rem' }}>Cristiana Alves Ferreira Amato</p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#444', fontWeight: 'bold' }}>NUTRICIONISTA - CRN-3 10407</p>
                </div>
            </div>
        ) : (assessmentOwner?.signature || user?.signature) ? (
            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', breakInside: 'avoid' }}>
                <img 
                    src={assessmentOwner?.signature || user?.signature} 
                    alt="Assinatura" 
                    style={{ maxHeight: '85px', maxWidth: '250px', marginBottom: '0.35rem' }} 
                />
                <div style={{ width: '300px', borderTop: '1.5px solid #333', textAlign: 'center', paddingTop: '0.35rem' }}>
                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.95rem' }}>{assessmentOwner?.name || user?.name}</p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#444', fontWeight: 'bold' }}>FISIOTERAPEUTA - CREFITO: {assessmentOwner?.crefito || user?.crefito}</p>
                </div>
            </div>
        ) : null}

        {/* Functional Charts moved inline to sections */}
        <div style={{ display: 'none' }}>
        </div>
      </div>
    );
}
