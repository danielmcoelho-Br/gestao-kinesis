"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { segments } from "@/lab/data/segments";
import PatientInfoBanner from "@/lab/components/PatientInfoBanner";
import Header from "@/lab/components/Header";

export default function SelectSegmentPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.patientId as string;

  return (
    <div className="select-segment-page">
      <div className="background-gradient" />
      
      <Header showBackButton />

      <header className="container page-header-section">
        <div className="title-wrapper">
          <h1 className="badge-title">Nova Avaliação</h1>
        </div>

        <PatientInfoBanner patientId={params.patientId as string} />
        
        <div className="hero-text">
          <h2>Onde está o foco da avaliação?</h2>
          <p>Selecione a região do corpo para ver os protocolos recomendados.</p>
        </div>
      </header>

      <main className="container main-content">
        <div className="segments-grid">
          {segments.map((segment, index) => (
            <motion.div
              key={segment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => router.push(`/dashboard/assessment/select-type/${params.patientId}/${segment.id}`)}
              className="segment-card"
              whileHover={{ borderColor: 'var(--primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            >
              <div className="segment-icon-wrapper">
                <img 
                  src={segment.icon} 
                  alt={segment.title} 
                />
              </div>
              
              <div className="segment-info">
                <h3>{segment.title}</h3>
                <p>{segment.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      <style jsx>{`
        .select-segment-page {
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
        }
        .segments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }
        .segment-card {
          background-color: white;
          padding: 1.25rem;
          border-radius: var(--radius-lg);
          border: 1px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 1.25rem;
        }
        .segment-icon-wrapper {
          width: 128px;
          height: 128px;
          background-color: transparent;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
          mix-blend-mode: multiply;
        }
        .segment-icon-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          mix-blend-mode: multiply;
        }
        .segment-info h3 {
          font-size: 1.25rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
          color: var(--text);
        }
        .segment-info p {
          color: var(--text-muted);
          font-size: 0.925rem;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .page-header-section {
            padding: 1.5rem 1rem;
          }
          .hero-text h2 {
            font-size: 1.5rem;
          }
          .segments-grid {
            grid-template-columns: 1fr;
          }
          .segment-card {
            padding: 1.5rem;
            flex-direction: row;
            align-items: center;
          }
          .segment-icon-wrapper {
            width: 80px;
            height: 80px;
            padding: 4px;
            flex-shrink: 0;
          }
        }
      `}</style>
    </div>
  );
}
