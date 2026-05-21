"use client";

import { useEffect, useState } from "react";
import { User, Calendar, Info } from "lucide-react";
import { motion } from "framer-motion";
import { getPatient } from "@/app/(lab)/dashboard/actions";

interface PatientInfoBannerProps {
  patientId: string;
  patientName?: string;
  patientGender?: string;
  patientAge?: number;
}

export default function PatientInfoBanner({ patientId, patientName, patientGender, patientAge }: PatientInfoBannerProps) {
  const [patient, setPatient] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const res = await getPatient(patientId);
      if (res.success) {
        setPatient(res.data);
      }
    }
    load();
  }, [patientId]);

  if (!patient) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="banner-container stack-on-mobile"
    >
      <div className="banner-item">
        <div className="icon-wrapper primary">
          <User size={18} />
        </div>
        <div>
          <p className="item-label">Paciente</p>
          <p className="item-value">{patientName || patient.name}</p>
        </div>
      </div>
      
      <div className="banner-item">
        <div className="icon-wrapper secondary">
          <Calendar size={18} />
        </div>
        <div>
          <p className="item-label">Idade</p>
          <p className="item-value">{patientAge || patient.age} anos</p>
        </div>
      </div>

      <div className="banner-item">
        <div className="icon-wrapper accent">
          <Info size={18} />
        </div>
        <div>
          <p className="item-label">Sexo</p>
          <p className="item-value">{patientGender || patient.gender}</p>
        </div>
      </div>

      <style jsx>{`
        .banner-container {
          background-color: white;
          padding: 1rem 1.5rem;
          border-radius: 1rem;
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2.5rem;
          margin-bottom: 2rem;
        }
        .banner-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .icon-wrapper {
          padding: 0.5rem;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .icon-wrapper.primary {
          background-color: var(--primary-light);
          color: var(--primary);
        }
        .icon-wrapper.secondary {
          background-color: rgba(44, 62, 80, 0.05); /* --secondary-light fallback */
          color: var(--secondary);
        }
        .icon-wrapper.accent {
          background-color: #fef3f2;
          color: #b42318;
        }
        .item-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .item-value {
          fontWeight: 700;
          margin: 0;
          white-space: nowrap;
        }

        @media (max-width: 768px) {
          .banner-container {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }
          .banner-item {
            width: 100%;
          }
        }
      `}</style>
    </motion.div>
  );
}
