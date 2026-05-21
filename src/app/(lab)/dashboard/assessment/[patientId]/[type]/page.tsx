"use client";
import "./assessment-page.css";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import PrintSummaryView from "@/lab/components/assessment/layout/PrintSummaryView";
import { 
    ChevronLeft, 
    ChevronRight, 
    CheckCircle, 
    ArrowLeft, 
    Edit2, 
    Save, 
    History as HistoryIcon, 
    ChevronDown, 
    ChevronUp,
    Printer,
    X,
    Calculator,
    ArrowUp,
    ArrowDownLeft,
    ArrowDownRight,
    Ruler,
    AlertTriangle,
    Share2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { questionnairesData, Section } from "@/lab/data/questionnaires";
import { getPatient } from "@/app/(lab)/dashboard/actions";
import { toast } from "sonner";
import ClinicalFlagAlert from "@/lab/components/assessment/ClinicalFlagAlert";
import Header from "@/lab/components/Header";
import PatientInfoBanner from "@/lab/components/PatientInfoBanner";
import PosturalAnalysisModal from "@/lab/components/PosturalAnalysisModal";
import { calculateAssessmentScore, CalculationType } from "@/lab/lib/calculations";
import { useAssessmentState } from "@/lab/hooks/useAssessmentState";
import Bar from "@/lab/components/assessment/Bar";
import AssessmentHistoryChart from "@/lab/components/assessment/AssessmentHistoryChart";
import FormSection from "@/lab/components/assessment/FormSection";
import SectionNav from "@/lab/components/assessment/SectionNav";
import { AssessmentProvider } from "@/lab/contexts/AssessmentContext";
import dynamic from "next/dynamic";

const DynamoModal = dynamic(() => import("@/lab/components/assessment/modals/DynamoModal"), { ssr: false });
const YbtModal = dynamic(() => import("@/lab/components/assessment/modals/YbtModal"), { ssr: false });
const DraftModal = dynamic(() => import("@/lab/components/assessment/modals/DraftModal"), { ssr: false });
const ExitModal = dynamic(() => import("@/lab/components/assessment/modals/ExitModal"), { ssr: false });
const ImageZoomModal = dynamic(() => import("@/lab/components/assessment/modals/ImageZoomModal"), { ssr: false });

const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

function AssessmentContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = params.patientId as string;
  const type = params.type as string;
  const assessmentId = searchParams.get("id");

  const questionnaire = questionnairesData[type];
  
  const state = useAssessmentState({
    patientId,
    type,
    assessmentId,
    questionnaire,
    router,
    searchParams
  });

  const {
    currentIdx, setCurrentIdx,
    answers,
    isFinished,
    saving,
    isEditing, setIsEditing,
    showLogs, setShowLogs,
    changeLogs,
    user,
    assessmentOwner,
    assessmentOwnerId,
    assessmentDate,
    patientName,
    patientGender,
    patientAge,
    patientAssessments,
    selectedImage, setSelectedImage,
    showDraftModal, setShowDraftModal,
    pendingDraft,
    dynamoModal, setDynamoModal,
    dynamoValues, setDynamoValues,
    ybtModal, setYbtModal,
    ybtValues, setYbtValues,
    posturalModal, setPosturalModal,
    isDirty,
    activeFlags,
    handleRecoverDraft,
    handleDiscardDraft,
    handleSelect,
    handleAnalyzeImage,
    handleSavePosturalAnalysis,
    handleInputChange,
    handleFinish,
    handleExit,
    confirmExitDiscard,
    confirmExitSave,
    showExitModal
  } = state;

  const [showMyelopathyModal, setShowMyelopathyModal] = useState(false);

  if (!patientId) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '2rem', textAlign: 'center' }}>
            <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '2rem', borderRadius: '1.5rem', maxWidth: '500px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <CheckCircle size={48} style={{ color: '#ef4444', marginBottom: '1rem', rotate: '45deg' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem' }}>Sessão de Avaliação Inválida</h2>
                <p style={{ marginBottom: '2rem', lineHeight: '1.6' }}>
                    Identificamos um problema com o identificador do paciente. Isso pode acontecer devido a rascunhos antigos salvos no navegador.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button 
                        onClick={() => {
                            localStorage.clear();
                            window.location.href = '/dashboard';
                        }}
                        className="btn-primary" 
                        style={{ width: '100%', padding: '1rem', backgroundColor: '#dc2626' }}
                    >
                        Limpar Dados e Voltar ao Início
                    </button>
                </div>
            </div>
        </div>
    );
  }

  if (!questionnaire) {
    return <div style={{ padding: '3rem', textAlign: 'center' }}>Questionário não encontrado.</div>;
  }

  const isClinical = !!questionnaire.sections;
  const items = isClinical ? questionnaire.sections! : questionnaire.questions!;
  const currentItem = items[currentIdx];
  const progress = ((currentIdx + 1) / items.length) * 100;
  
  if (isFinished) {
    const calculationType = (questionnaire as any).structure?.calculationType || (type as CalculationType);
    const result = calculateAssessmentScore(calculationType as CalculationType, answers);
    const returnTo = searchParams.get("returnTo");

    const handleReturn = () => {
        if (returnTo && result) {
            router.push(`/dashboard/assessment/${patientId}/${returnTo}?returnTo=${type}`);
        }
    };

    return (
      <AssessmentProvider state={state}>
      <div style={{ minHeight: '100vh', padding: '2rem', backgroundColor: 'white' }}>
        <PrintSummaryView 
            forScreen={true}
            questionnaire={questionnaire}
            items={items}
            isClinical={isClinical}
        />

        {type === 'aofas' && result && (
            <div style={{ maxWidth: '800px', margin: '0 auto 2rem auto', padding: '0 1rem' }}>
                <AssessmentHistoryChart 
                    currentValue={Number(result.score)}
                    chartTitle="Evolução Clínica - Score AOFAS"
                    unit=" pts"
                    history={patientAssessments.filter(a => a.assessment_type === 'aofas')}
                    assessmentId={assessmentId}
                />
            </div>
        )}

        <div className="no-print hide-on-print" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
            <button
                className="btn-action-outline no-print"
                onClick={() => window.print()}
                style={{ padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '8px', border: '2px solid var(--border)', borderRadius: '0.75rem', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', backgroundColor: 'white' }}
            >
                <Printer size={20} /> Imprimir Avaliação
            </button>
            {returnTo && (
                <button 
                    className="btn-primary"
                    onClick={handleReturn}
                    style={{ padding: '1rem 2rem', fontSize: '1.1rem', borderRadius: '0.75rem', cursor: 'pointer' }}
                >
                    Concluir e Voltar para Avaliação
                </button>
            )}
            <button 
                className="btn-primary"
                onClick={() => router.push(`/dashboard/patient/${patientId}`)}
                style={{ padding: '1rem 2rem', fontSize: '1.1rem', borderRadius: '0.75rem', cursor: 'pointer', backgroundColor: 'var(--secondary)' }}
            >
                Voltar ao Histórico
          </button>
        </div>
      </div>
      </AssessmentProvider>
    );
  }

  return (
    <AssessmentProvider state={state}>
    <div className="assessment-page">
      <div className="background-gradient" />
            <Header />
        
        <PosturalAnalysisModal 
            isOpen={posturalModal.isOpen}
            onClose={() => setPosturalModal(prev => ({ ...prev, isOpen: false }))}
            imageSrc={posturalModal.image}
            onSave={handleSavePosturalAnalysis}
        />

        <main className={`no-print container main-content ${type === 'afSensibilidade' ? 'full-width-container' : ''}`}>
        <header className="assessment-header">
            <div className="header-top stack-on-mobile">
                <div className="header-left">
                    <button 
                        onClick={handleExit}
                        className="btn-exit"
                        style={{ position: 'relative' }}
                    >
                        <ArrowLeft size={18} />
                        <span>Sair</span>
                        {isDirty && isEditing && (
                            <span title="Alterações não salvas" style={{
                                position: 'absolute',
                                top: '-4px',
                                right: '-4px',
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                backgroundColor: '#f59e0b',
                                border: '2px solid white',
                                animation: 'pulse 1.5s ease-in-out infinite'
                            }} />
                        )}
                    </button>

                    {(user || assessmentOwner) && (
                        <div className="evaluator-info">
                            <div className="info-row">
                                <span className="label">Avaliador:</span>
                                <span className="value">
                                    {(assessmentOwner?.name || user?.name)} 
                                    {((assessmentOwner?.crefito || user?.crefito)) ? ` (CREFITO: ${assessmentOwner?.crefito || user?.crefito})` : ""}
                                </span>
                            </div>
                            <div className="info-row">
                                <span className="label">Data:</span>
                                <span className="value">{assessmentDate}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="header-center">
                    <h1 className="page-title">{questionnaire.title}</h1>
                </div>
                
                <div className="header-actions">
                    <button 
                        onClick={() => window.print()}
                        className="btn-action-outline"
                    >
                        <Printer size={16} />
                        <span>Imprimir</span>
                    </button>

                    {assessmentId && (
                        <button 
                            onClick={() => {
                                const baseUrl = window.location.origin;
                                const shareUrl = `${baseUrl}/assessment/public/summary/${assessmentId}`;
                                const message = encodeURIComponent(`Olá ${patientName}, segue o resumo da sua avaliação (${questionnaire.title}) realizada na KinesisLab: ${shareUrl}`);
                                window.open(`https://wa.me/?text=${message}`, '_blank');
                                toast.success("Link gerado e WhatsApp aberto!");
                            }}
                            className="btn-action-outline"
                            style={{ color: '#10B981', borderColor: '#6EE7B7' }}
                        >
                            <Share2 size={16} />
                            <span>Compartilhar</span>
                        </button>
                    )}

                    {assessmentId && !isEditing && (user?.role === 'ADMINISTRADOR' || assessmentOwnerId === user?.id) && (
                        <button 
                            onClick={() => {
                                setIsEditing(true);
                                setCurrentIdx(0);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="btn-action-primary"
                        >
                            <Edit2 size={16} />
                            <span>Editar</span>
                        </button>
                    )}
                </div>
            </div>

            <PatientInfoBanner patientId={patientId} patientName={patientName} patientGender={patientGender} patientAge={patientAge} />
        </header>

        {!isEditing ? (
            <div style={{ paddingBottom: '4rem' }}>
                <PrintSummaryView 
                    forScreen={true}
                    questionnaire={questionnaire}
                    items={items}
                    isClinical={isClinical}
                />
            </div>
        ) : (
        <div className={`assessment-layout ${type === 'afSensibilidade' ? 'full-width-layout' : ''}`}>
            {type !== 'afSensibilidade' && (
                <SectionNav 
                    items={items}
                    isClinical={isClinical}
                />
            )}

            <div className={`continuous-screen-view ${type === 'afSensibilidade' ? 'full-width-view' : ''}`}>
            <div className="progress-bar-wrapper">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="progress-bar-fill"
                />
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIdx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className={`assessment-card ${type === 'afSensibilidade' ? 'full-width-card' : ''}`}
                >
                    <ClinicalFlagAlert flags={activeFlags} />
                    {isClinical ? (
                        <FormSection 
                            section={currentItem as Section}
                            isPrint={false}
                        />
                    ) : (
                        <div className="section-container" style={{ marginBottom: '2.5rem' }}>
                            <h3 className="functional-title">
                                {(currentItem as any).text}
                            </h3>
                            {!(currentItem as any).isInstruction && (
                                <div className="options-grid">
                                    {(currentItem as any).options?.map((opt: any) => {
                                        const isSelected = answers[currentIdx] === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                onClick={() => handleSelect(opt.value)}
                                                className={`option-button ${isSelected ? 'selected' : ''}`}
                                            >
                                                <span className="option-label">{opt.label}</span>
                                                <div className="radio-circle">
                                                    {isSelected && <div className="radio-inner" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="navigation-footer">
                        <button
                            disabled={currentIdx === 0}
                            onClick={() => {
                                setCurrentIdx(currentIdx - 1);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="btn-nav-back"
                        >
                            <ChevronLeft size={20} />
                            <span>Anterior</span>
                        </button>

                        <div className="nav-main-actions">
                            {currentItem.id !== 'finish' && currentIdx < items.length - 1 && (
                                <button
                                    onClick={() => {
                                        if ((type === 'afCervical' || type === 'afLombar') && items[currentIdx]?.id === 'exame_neurologico') {
                                            const reflexFields = type === 'afCervical' 
                                                ? ['ref_bic_esq', 'ref_bic_dir', 'ref_est_esq', 'ref_est_dir', 'ref_tri_esq', 'ref_tri_dir']
                                                : ['ref_pat_esq', 'ref_pat_dir', 'ref_aqui_esq', 'ref_aqui_dir'];
                                            
                                            const hasHyperreflexia = reflexFields.some(f => answers[f] === 'Hiperreflexia');
                                            
                                            if (hasHyperreflexia) {
                                                const specialFields = type === 'afCervical'
                                                    ? ['hoffmann_esq', 'hoffmann_dir', 'babinski_esq', 'babinski_dir', 'clonus_esq', 'clonus_dir', 'claudicacao_esq', 'claudicacao_dir']
                                                    : ['hoffmann_esq_l', 'hoffmann_dir_l', 'babinski_esq_l', 'babinski_dir_l', 'clonus_esq_l', 'clonus_dir_l', 'claudicacao_esq_l', 'claudicacao_dir_l'];
                                                
                                                const hasSpecialFilled = specialFields.some(f => answers[f] === true);
                                                
                                                if (!hasSpecialFilled) {
                                                    setShowMyelopathyModal(true);
                                                    return;
                                                }
                                            }
                                        }

                                        setCurrentIdx(currentIdx + 1);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="btn-nav-next"
                                >
                                    <span>Próxima</span>
                                    <ChevronRight size={20} />
                                </button>
                            )}

                            {isEditing && currentIdx === items.length - 1 && (
                                <button
                                    disabled={saving}
                                    onClick={handleFinish}
                                    className="btn-finish"
                                >
                                    <span>{saving ? "Salvando..." : (assessmentId ? "Salvar" : "Finalizar")}</span>
                                    {assessmentId && <Save size={20} />}
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
        </div>
        )}

            {assessmentId && changeLogs.length > 0 && (
                <div className="audit-log-section">
                    <button 
                        onClick={() => setShowLogs(!showLogs)}
                        className="log-toggle-btn"
                    >
                        <div className="log-toggle-left">
                            <HistoryIcon size={20} className="icon" />
                            <span>Histórico de Alterações ({changeLogs.length})</span>
                        </div>
                        {showLogs ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>

                    <AnimatePresence>
                        {showLogs && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="log-content"
                            >
                                <div className="timeline">
                                    <div className="timeline-line" />
                                    
                                    {changeLogs.map((log, idx) => (
                                        <div key={idx} className="timeline-item">
                                            <div className="timeline-dot" />
                                            <p className="timeline-text">{log.entry}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
      </main>
      <div className="print-restricted-wrapper">
         <PrintSummaryView 
            forScreen={false}
            questionnaire={questionnaire}
            items={items}
            isClinical={isClinical}
        />
      </div>

      <AnimatePresence>
        {dynamoModal && (
            <DynamoModal 
                label={dynamoModal.label}
                fieldId={dynamoModal.fieldId}
                dynamoValues={dynamoValues as [string, string, string]}
                setDynamoValues={setDynamoValues as any}
                onClose={() => {
                    setDynamoModal(null);
                    setDynamoValues(['', '', '']);
                }}
                onSave={(fieldId, val) => handleInputChange(fieldId, val)}
            />
        )}

        {ybtModal && (
            <YbtModal 
                ybtValues={ybtValues as any}
                setYbtValues={setYbtValues}
                onClose={() => setYbtModal(false)}
                onSave={(fieldId, val) => handleInputChange(fieldId, val)}
            />
        )}
      </AnimatePresence>

    </div>
    </AssessmentProvider>
  );
}

export default function AssessmentPage() {
    return (
        <Suspense fallback={<div style={{ padding: '3rem', textAlign: 'center' }}>Carregando...</div>}>
            <AssessmentContent />
        </Suspense>
    );
}
