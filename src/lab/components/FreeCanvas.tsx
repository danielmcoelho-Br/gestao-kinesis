"use client";

import { Maximize2, Paintbrush } from "lucide-react";

interface FreeCanvasProps {
  value?: string;
  onAnalyze: () => void;
  isEditing?: boolean;
}

export default function FreeCanvas({ value, onAnalyze, isEditing = true }: FreeCanvasProps) {
  return (
    <div className="fc-trigger-container">
      {!value ? (
        <div className="fc-empty-state">
          <div className="fc-icon-circle">
            <Paintbrush size={40} className="opacity-20" />
          </div>
          <p className="fc-empty-text">Faça o upload de uma imagem para iniciar os desenhos</p>
          {isEditing && (
            <button 
              onClick={onAnalyze}
              className="fc-btn-studio"
            >
              <div className="fc-btn-icon">
                <Maximize2 size={24} />
              </div>
              <span>Abrir Estúdio de Análise Professional</span>
            </button>
          )}
        </div>
      ) : (
        <div className="fc-preview-container">
          <img src={value} alt="Desenho Livre" className="fc-preview-image" />
          {isEditing && (
            <div className="fc-preview-overlay">
              <button 
                onClick={onAnalyze}
                className="fc-btn-studio-mini"
              >
                <Maximize2 size={20} />
                <span>Abrir Estúdio</span>
              </button>
            </div>
          )}
        </div>
      )}
      
      <style jsx>{`
        .fc-trigger-container {
          width: 100%;
          border-radius: 1.5rem;
          overflow: hidden;
          background-color: #f8fafc;
          border: 2px solid #e2e8f0;
        }
        
        .fc-empty-state {
          height: 18rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          padding: 2rem;
          text-align: center;
        }

        .fc-icon-circle {
          width: 5rem;
          height: 5rem;
          background-color: #f1f5f9;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .fc-empty-text {
          font-weight: 600;
          color: #64748b;
          font-size: 1.1rem;
          max-width: 300px;
        }

        .fc-btn-studio {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.85rem 1.5rem;
          background-color: #9b1d22;
          color: white;
          border-radius: 1rem;
          font-weight: 700;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 6px -1px rgba(155, 29, 34, 0.2);
        }

        .fc-btn-studio:hover {
          background-color: #7a161b;
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(155, 29, 34, 0.3);
        }

        .fc-btn-icon {
          background-color: rgba(255, 255, 255, 0.2);
          padding: 0.25rem;
          border-radius: 0.5rem;
        }

        .fc-preview-container {
          position: relative;
          width: 100%;
          min-height: 12rem;
          display: flex;
          justify-content: center;
          background-color: #f1f5f9;
        }

        .fc-preview-image {
          max-width: 100%;
          max-height: 30rem;
          height: auto;
          display: block;
          object-fit: contain;
        }

        .fc-preview-overlay {
          position: absolute;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
          backdrop-blur: 2px;
        }

        .fc-preview-container:hover .fc-preview-overlay {
          opacity: 1;
        }

        .fc-btn-studio-mini {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background-color: #9b1d22;
          color: white;
          border-radius: 0.75rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}
