"use client";

import { AlertTriangle, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ClinicalFlag {
  id: string;
  label: string;
  level: 'red' | 'yellow';
  message: string;
}

interface ClinicalFlagAlertProps {
  flags: ClinicalFlag[];
}

const ClinicalFlagAlert = ({ flags }: ClinicalFlagAlertProps) => {
  if (flags.length === 0) return null;

  return (
    <div className="clinical-flags-container">
      <AnimatePresence>
        {flags.map((flag) => (
          <motion.div
            key={flag.id}
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className={`flag-alert ${flag.level}`}
          >
            <div className="flag-icon">
              {flag.level === 'red' ? <AlertTriangle size={20} /> : <Info size={20} />}
            </div>
            <div className="flag-content">
              <div className="flag-label">{flag.label}</div>
              <div className="flag-message">{flag.message}</div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <style jsx>{`
        .clinical-flags-container {
          width: 100%;
          margin-bottom: 1.5rem;
        }
        .flag-alert {
          display: flex;
          gap: 1rem;
          padding: 1rem 1.25rem;
          border-radius: 1rem;
          border: 1px solid transparent;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .flag-alert.red {
          background-color: #fef2f2;
          border-color: #fca5a5;
          color: #991b1b;
        }
        .flag-alert.yellow {
          background-color: #fffbeb;
          border-color: #fcd34d;
          color: #92400e;
        }
        .flag-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .red .flag-icon { color: #dc2626; }
        .yellow .flag-icon { color: #d97706; }
        
        .flag-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .flag-label {
          font-size: 0.9rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .flag-message {
          font-size: 0.95rem;
          font-weight: 600;
          line-height: 1.4;
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
};

export default ClinicalFlagAlert;
