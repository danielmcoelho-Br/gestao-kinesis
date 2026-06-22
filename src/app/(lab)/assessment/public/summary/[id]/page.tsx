"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getAssessment } from "@/app/(lab)/dashboard/assessment/actions";
import { assessmentService } from "@/lab/services/assessment/assessmentService";
import { questionnairesData } from "@/lab/data/questionnaires";
import { AssessmentProvider } from "@/lab/contexts/AssessmentContext";
import PrintSummaryView from "@/lab/components/assessment/layout/PrintSummaryView";
import { Loader2, AlertCircle, Share2 } from "lucide-react";

export default function PublicSummaryPage() {
    const params = useParams();
    const id = params.id as string;
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [assessmentData, setAssessmentData] = useState<any>(null);
    const [patientData, setPatientData] = useState<any>(null);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                // 1. Fetch Assessment
                const res = await getAssessment(id);
                if (!res.success || !res.data) {
                    setError("Avaliação não encontrada ou link inválido.");
                    setLoading(false);
                    return;
                }

                const assessment = res.data;
                setAssessmentData(assessment);

                // 2. Fetch Patient Data
                const pRes = await assessmentService.fetchPatient(assessment.patient_id as string);
                if (pRes.success && pRes.data) {
                    setPatientData(pRes.data);
                }

                setLoading(false);
            } catch (err) {
                console.error("Error loading public summary:", err);
                setError("Ocorreu um erro ao carregar o resumo.");
                setLoading(false);
            }
        }
        if (id) load();
    }, [id]);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', backgroundColor: '#f8fafc' }}>
                <Loader2 className="animate-spin text-primary" size={48} />
                <p style={{ color: '#64748b', fontWeight: '500' }}>Carregando resumo clínico...</p>
            </div>
        );
    }

    if (error || !assessmentData) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '2rem', textAlign: 'center' }}>
                <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #fecaca', maxWidth: '400px' }}>
                    <AlertCircle size={48} style={{ margin: '0 auto 1rem' }} />
                    <h2 style={{ fontWeight: 'bold', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Acesso Negado</h2>
                    <p>{error}</p>
                </div>
                <button 
                   onClick={() => window.location.href = 'https://kinesislab.com.br'}
                   className="btn-primary" 
                   style={{ width: 'auto', padding: '0.75rem 2rem' }}
                >
                    Ir para KinesisLab
                </button>
            </div>
        );
    }

    const questionnaire = questionnairesData[assessmentData.assessment_type];
    if (!questionnaire) {
        return <div style={{ padding: '3rem', textAlign: 'center' }}>Tipo de avaliação não suportado.</div>;
    }

    const isClinical = !!questionnaire.sections;
    const items = isClinical ? questionnaire.sections! : questionnaire.questions!;

    // Create a static state for the AssessmentProvider
    // We mock only what PrintSummaryView actually uses
    const staticState: any = {
        type: assessmentData.assessment_type,
        patientName: patientData?.name || "Paciente",
        patientAge: patientData?.age || assessmentData.clinical_data?.age || 0,
        patientGender: patientData?.gender || assessmentData.clinical_data?.gender || "",
        assessmentDate: assessmentData.created_at ? (() => {
            const d = new Date(assessmentData.created_at);
            return isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR');
        })() : '',
        user: null, // Public view doesn't have a current user
        assessmentOwner: assessmentData.created_by,
        answers: assessmentData.questionnaire_answers || {},
        patientAssessments: [], // History charts won't be visible in public view for stability/privacy
        isFinished: true,
        isEditing: false,
        loading: false,
        saving: false
    };

    return (
        <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', padding: '2rem 1rem' }}>
            {/* SEO & Meta Info can be added here if needed */}
            <div style={{ maxWidth: '900px', margin: '0 auto', backgroundColor: 'white', padding: '3rem', borderRadius: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', position: 'relative' }}>
                
                {/* Public Header Badge */}
                <div style={{ position: 'absolute', top: '1rem', right: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Share2 size={14} />
                    Relatório Compartilhado
                </div>

                <AssessmentProvider state={staticState}>
                    <PrintSummaryView 
                        questionnaire={questionnaire}
                        items={items}
                        isClinical={isClinical}
                        forScreen={true}
                    />
                </AssessmentProvider>

                {/* Public Footer */}
                <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px dashed #e2e8f0', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
                        Este documento foi gerado digitalmente pela plataforma <strong>KinesisLab</strong>.
                    </p>
                    <img src="/logo-kinesis.png" alt="KinesisLab" style={{ height: '32px', opacity: 0.5, filter: 'grayscale(1)' }} />
                </div>
            </div>

            {/* Print Help for user if they want to save as PDF */}
            <div className="no-print" style={{ maxWidth: '900px', margin: '1.5rem auto', textAlign: 'center' }}>
                 <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                    Este é um link seguro para visualização clínica. 
                    <button 
                        onClick={() => window.print()}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer', marginLeft: '0.5rem', textDecoration: 'underline' }}
                    >
                        Imprimir / Salvar PDF
                    </button>
                 </p>
            </div>

            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background-color: white !important; padding: 0 !important; }
                    div { box-shadow: none !important; border: none !important; padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
                }
            `}</style>
        </div>
    );
}
