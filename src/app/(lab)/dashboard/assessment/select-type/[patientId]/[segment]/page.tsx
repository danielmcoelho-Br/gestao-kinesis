"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { questionnairesData } from "@/lab/data/questionnaires";
import { segments } from "@/lab/data/segments";
import PatientInfoBanner from "@/lab/components/PatientInfoBanner";
import Header from "@/lab/components/Header";

export default function SelectTypePage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.patientId as string;
  const segmentId = params.segment as string;

  const segment = segments.find(s => s.id === segmentId);

  // Filter questionnaires by segment
  const availableQuestionnaires = Object.entries(questionnairesData)
    .filter(([_, q]) => q.segment === segmentId)
    .map(([qId, q]) => ({ qId, ...q }))
    .sort((a, b) => {
      const aIsClinical = a.type === 'clinical' || a.id?.startsWith('af') || a.qId?.startsWith('af');
      const bIsClinical = b.type === 'clinical' || b.id?.startsWith('af') || b.qId?.startsWith('af');
      if (aIsClinical && !bIsClinical) return -1;
      if (!aIsClinical && bIsClinical) return 1;
      return 0;
    });

  return (
    <div className="select-type-page">
      <div className="background-gradient" />
      
      <Header showBackButton />

      <header className="container page-header-section">
        <div className="title-wrapper">
          <h1 className="badge-title">Protocolos: {segment?.title}</h1>
        </div>

        <PatientInfoBanner patientId={patientId} />

        <div className="hero-text">
          <h2>Selecione a Avaliação</h2>
          <p>Escolha o questionário a ser preenchido pelo paciente ou profissional.</p>
        </div>
      </header>

      <main className="container main-content">
        <div className="types-list">
          {availableQuestionnaires.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum questionário disponível para este segmento ainda.</p>
            </div>
          ) : (
            availableQuestionnaires.map((q, index) => (
              <motion.button
                key={q.qId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => router.push(`/dashboard/assessment/${patientId}/${q.qId}`)}
                className="type-card"
                whileHover={{ borderColor: 'var(--primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              >
                <div className="type-info">
                  <div className="type-icon-wrapper">
                    {q.icon ? (
                       <div dangerouslySetInnerHTML={{ __html: q.icon }} className="icon-svg" />
                    ) : (
                       <ChevronRight size={24} />
                    )}
                  </div>
                  <div className="type-text">
                    <h3>{q.title}</h3>
                    <p>{q.description}</p>
                  </div>
                </div>
              </motion.button>
            ))
          )}
        </div>
      </main>

      <style jsx>{`
        .select-type-page {
          min-height: 100vh;
          background-color: var(--bg);
        }
        .page-header-section {
          padding: 2rem 1.5rem;
          margin-bottom: 2rem;
        }
        .title-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 2rem;
        }
        .badge-title {
          font-size: 1.25rem;
          font-weight: bold;
          color: var(--secondary);
          margin: 0;
          background: white;
          padding: 0.5rem 1.25rem;
          border-radius: 100px;
          border: 1px solid var(--border);
          box-shadow: var(--shadow-sm);
        }
        .hero-text {
          text-align: center;
          margin-top: 2rem;
        }
        .hero-text h2 {
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          color: var(--text);
        }
        .hero-text p {
          color: var(--text-muted);
          font-size: 1.125rem;
        }
        .main-content {
          padding-bottom: 3rem;
          max-width: 900px !important;
        }
        .types-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .empty-state {
          text-align: center;
          padding: 3rem;
          background-color: white;
          border-radius: 1rem;
          border: 1px dashed var(--border);
          color: var(--text-muted);
        }
        .type-card {
          width: 100%;
          text-align: left;
          background-color: white;
          padding: 1.5rem;
          border-radius: 1rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid var(--border);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.2s ease;
          appearance: none;
          font-family: inherit;
        }
        .type-info {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        .type-icon-wrapper {
          width: 80px;
          height: 80px;
          background-color: transparent;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          flex-shrink: 0;
          mix-blend-mode: multiply;
        }
        .icon-svg {
          width: 48px;
          height: 48px;
          mix-blend-mode: multiply;
        }
        .type-text h3 {
          font-size: 1.125rem;
          font-weight: bold;
          color: var(--text);
          margin: 0;
        }
        .type-text p {
          color: var(--text-muted);
          font-size: 0.875rem;
          margin: 4px 0 0;
        }
        .chevron {
          color: var(--text-muted);
        }

        @media (max-width: 768px) {
          .page-header-section {
            padding: 1.5rem 1rem;
          }
          .hero-text h2 {
            font-size: 1.5rem;
          }
          .type-card {
            padding: 1rem;
          }
          .type-info {
            gap: 1rem;
          }
          .type-icon-wrapper {
            width: 56px;
            height: 56px;
          }
          .chevron {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
