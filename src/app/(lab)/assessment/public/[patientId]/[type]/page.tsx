"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { questionnairesData } from "@/lab/data/questionnaires";
import { saveAssessment } from "@/app/(lab)/dashboard/assessment/actions";
import { toast } from "sonner";

export default function PublicAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.patientId as string;
  const type = params.type as string;

  const questionnaire = questionnairesData[type];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!questionnaire) {
    return <div style={{ padding: '3rem', textAlign: 'center' }}>Questionário não encontrado.</div>;
  }

  const questions = questionnaire.questions || [];
  const currentQuestion = questions[currentIdx];
  const currentKey = (currentQuestion as any).id !== undefined ? (currentQuestion as any).id : currentIdx;
  const progress = ((currentIdx + 1) / questions.length) * 100;

  const handleSelect = (value: number) => {
    setAnswers({ ...answers, [currentKey]: value });
    if (currentIdx < questions.length - 1) {
      setTimeout(() => setCurrentIdx(currentIdx + 1), 300);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    const result = questionnaire.calculateScore?.(answers);
    
    const response = await saveAssessment({
      patientId,
      type,
      segment: questionnaire.segment,
      answers,
      scoreData: result
    });

    if (response.success) {
      setIsFinished(true);
      toast.success("Respostas enviadas com sucesso!");
    } else {
      toast.error("Erro ao salvar suas respostas. Tente novamente.");
    }
    setSaving(false);
  };

  if (isFinished) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backgroundColor: 'var(--bg)' }}>
        <div className="background-gradient" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ 
            maxWidth: '560px', 
            width: '100%', 
            backgroundColor: 'white', 
            padding: '3rem', 
            textAlign: 'center', 
            borderRadius: '1.5rem',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <CheckCircle size={80} style={{ color: 'var(--primary)' }} />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Obrigado!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Suas respostas foram registradas com sucesso no sistema da KinesisLab.</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Você já pode fechar esta aba.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', padding: '1.5rem' }}>
      <div className="background-gradient" />

      <header style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin:0 }}>{questionnaire.title}</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Por favor, responda com atenção.</p>
      </header>

      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        {/* Progress Bar */}
        <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', marginBottom: '3rem', overflow: 'hidden' }}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            style={{ height: '100%', backgroundColor: 'var(--primary)' }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            style={{ 
              backgroundColor: 'white', 
              padding: '2.5rem', 
              borderRadius: '1.5rem', 
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border)'
            }}
          >
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem', lineHeight: '1.3' }}>
              {currentQuestion.text}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {currentQuestion.options?.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  style={{ 
                    width: '100%', 
                    textAlign: 'left', 
                    padding: '1.25rem', 
                    borderRadius: '1rem', 
                    border: '2px solid', 
                    borderColor: answers[currentKey] === option.value ? 'var(--primary)' : '#f3f4f6',
                    backgroundColor: answers[currentKey] === option.value ? 'var(--primary-light)' : 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: '1rem', fontWeight: '500', color: answers[currentKey] === option.value ? 'var(--primary)' : 'var(--text)' }}>
                    {option.label}
                  </span>
                  <div style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    border: '2px solid', 
                    borderColor: answers[currentIdx] === option.value ? 'var(--primary)' : '#d1d5db',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {answers[currentIdx] === option.value && (
                      <div style={{ width: '10px', height: '10px', backgroundColor: 'var(--primary)', borderRadius: '50%' }} />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(currentIdx - 1)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  backgroundColor: 'transparent', 
                  border: 'none', 
                  color: 'var(--text-muted)', 
                  fontWeight: '700', 
                  cursor: 'pointer',
                  opacity: currentIdx === 0 ? 0.3 : 1
                }}
              >
                <ChevronLeft size={20} />
                Anterior
              </button>

              {currentIdx === questions.length - 1 ? (
                <button
                  disabled={answers[currentIdx] === undefined || saving}
                  onClick={handleFinish}
                  className="btn-primary"
                  style={{ width: 'auto', padding: '0.875rem 2.5rem' }}
                >
                  {saving ? "Enviando..." : "Finalizar e Enviar"}
                </button>
              ) : (
                <button
                  disabled={answers[currentIdx] === undefined}
                  onClick={() => setCurrentIdx(currentIdx + 1)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    backgroundColor: 'transparent', 
                    border: 'none', 
                    color: 'var(--primary)', 
                    fontWeight: '700', 
                    cursor: 'pointer',
                    opacity: answers[currentIdx] === undefined ? 0.3 : 1
                  }}
                >
                  Próxima
                  <ChevronRight size={20} />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
