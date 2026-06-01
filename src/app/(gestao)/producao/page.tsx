"use client";

import { useEffect, useState, useMemo } from "react";
import { usePeriod } from "@/gestao/context/PeriodContext";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Activity, 
  Percent,
  SlidersHorizontal,
  ChevronDown
} from "lucide-react";

export default function ProducaoPage() {
  const { startMonth, startYear, endMonth, endYear, initialized } = usePeriod();
  
  const [sessions, setSessions] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedProfessional, setSelectedProfessional] = useState<string>("");
  const [selectedServiceType, setSelectedServiceType] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Load sessions
  useEffect(() => {
    if (!initialized) return;
    setLoading(true);
    fetch(`/api/producao?startMonth=${startMonth}&startYear=${startYear}&endMonth=${endMonth}&endYear=${endYear}`)
      .then(res => res.json())
      .then(items => {
        setSessions(Array.isArray(items) ? items : []);
        setLoading(false);
      })
      .catch(() => {
        setSessions([]);
        setLoading(false);
      });
  }, [startMonth, startYear, endMonth, endYear, initialized]);

  // Load professionals for filter list
  useEffect(() => {
    fetch("/api/profissionais")
      .then(res => res.json())
      .then(data => {
        setProfessionals(Array.isArray(data) ? data : []);
      })
      .catch(() => setProfessionals([]));
  }, []);

  // Unique status list in current sessions for filtering
  const statusOptions = useMemo(() => {
    const statuses = new Set<string>();
    sessions.forEach(s => {
      if (s.status) statuses.add(s.status);
    });
    return Array.from(statuses);
  }, [sessions]);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      if (selectedProfessional && s.professionalId !== selectedProfessional) {
        return false;
      }
      
      const isPilates = s.serviceType.toLowerCase().includes("pilates");
      if (selectedServiceType === "pilates" && !isPilates) return false;
      if (selectedServiceType === "fisioterapia" && isPilates) return false;

      if (selectedStatus && s.status !== selectedStatus) return false;

      return true;
    });
  }, [sessions, selectedProfessional, selectedServiceType, selectedStatus]);

  // Metrics calculations
  const metrics = useMemo(() => {
    let totalFaturado = 0;
    let totalClinica = 0;
    let totalProfissionais = 0;
    let totalAtendimentos = 0;
    let finalizados = 0;

    filteredSessions.forEach(s => {
      const status = (s.status || "").toLowerCase().trim();
      if (status.includes("ausência nula")) return;

      totalFaturado += s.value;
      const isPilates = s.serviceType.toLowerCase().includes("pilates");

      if (isPilates) {
        // Pilates goes 100% to clinic in the session value allocation
        totalClinica += s.value;
      } else {
        const clinicPart = s.value * s.clinicPercentage;
        totalClinica += clinicPart;
        totalProfissionais += (s.value - clinicPart);
      }

      totalAtendimentos++;
      if (status === "finalizado") {
        finalizados++;
      }
    });

    return {
      totalFaturado,
      totalClinica,
      totalProfissionais,
      totalAtendimentos,
      finalizados
    };
  }, [filteredSessions]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header className="header" style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: '900', letterSpacing: '-1px' }}>
              Produção <span style={{ color: 'var(--primary)' }}>Detalhada</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>
              Acompanhamento e auditoria de repasses de atendimentos fisioterapêuticos e pilates.
            </p>
          </div>
        </div>
      </header>

      {/* METRICS GRID */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '20px' 
      }}>
        {/* Total Faturado Card */}
        <div className="card" style={{ 
          padding: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px',
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          border: '1px solid #bfdbfe'
        }}>
          <div style={{ 
            background: '#3b82f6', 
            color: 'white', 
            padding: '12px', 
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(59, 130, 246, 0.2)'
          }}>
            <DollarSign size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Faturamento Bruto</span>
            <h3 style={{ fontSize: '1.6rem', fontWeight: '950', color: '#1e3a8a', marginTop: '4px' }}>
              R$ {metrics.totalFaturado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

        {/* Repasse Profissionais Card */}
        <div className="card" style={{ 
          padding: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px',
          background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
          border: '1px solid #fbcfe8'
        }}>
          <div style={{ 
            background: '#ec4899', 
            color: 'white', 
            padding: '12px', 
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(236, 72, 153, 0.2)'
          }}>
            <Percent size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#9d174d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Repasse Profissionais</span>
            <h3 style={{ fontSize: '1.6rem', fontWeight: '950', color: '#831843', marginTop: '4px' }}>
              R$ {metrics.totalProfissionais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

        {/* Lucro Clínico Card */}
        <div className="card" style={{ 
          padding: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px',
          background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
          border: '1px solid #a7f3d0'
        }}>
          <div style={{ 
            background: '#10b981', 
            color: 'white', 
            padding: '12px', 
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)'
          }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Receita Clínica</span>
            <h3 style={{ fontSize: '1.6rem', fontWeight: '950', color: '#064e3b', marginTop: '4px' }}>
              R$ {metrics.totalClinica.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

        {/* Atendimentos Card */}
        <div className="card" style={{ 
          padding: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px',
          background: 'linear-gradient(135deg, #fbf7f5 0%, #f5ece7 100%)',
          border: '1px solid #e9d5ca'
        }}>
          <div style={{ 
            background: '#d97706', 
            color: 'white', 
            padding: '12px', 
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(217, 119, 6, 0.2)'
          }}>
            <Activity size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Atendimentos</span>
            <h3 style={{ fontSize: '1.6rem', fontWeight: '950', color: '#78350f', marginTop: '4px' }}>
              {metrics.finalizados} <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#92400e' }}>/ {metrics.totalAtendimentos}</span>
            </h3>
          </div>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="card" style={{ 
        padding: '20px 24px', 
        background: 'white',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-primary)', fontWeight: '800', fontSize: '0.9rem' }}>
          <SlidersHorizontal size={16} color="var(--primary)" />
          <span>Filtros Rápidos</span>
        </div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px' 
        }}>
          {/* Professional Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px' }}>Profissional</label>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedProfessional}
                onChange={(e) => setSelectedProfessional(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '10px 14px', 
                  borderRadius: '10px', 
                  border: '1.5px solid #cbd5e1', 
                  appearance: 'none',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="">Todos os Profissionais</option>
                {professionals.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <ChevronDown size={16} color="#64748b" />
              </div>
            </div>
          </div>

          {/* Service Type Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px' }}>Serviço</label>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedServiceType}
                onChange={(e) => setSelectedServiceType(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '10px 14px', 
                  borderRadius: '10px', 
                  border: '1.5px solid #cbd5e1', 
                  appearance: 'none',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="">Fisioterapia e Pilates</option>
                <option value="fisioterapia">Apenas Fisioterapia</option>
                <option value="pilates">Apenas Pilates</option>
              </select>
              <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <ChevronDown size={16} color="#64748b" />
              </div>
            </div>
          </div>

          {/* Status Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px' }}>Status</label>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '10px 14px', 
                  borderRadius: '10px', 
                  border: '1.5px solid #cbd5e1', 
                  appearance: 'none',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="">Todos os Status</option>
                {statusOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <ChevronDown size={16} color="#64748b" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SESSIONS TABLE */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Carregando atendimentos...</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ 
                  background: '#f8fafc',
                  borderBottom: '2px solid var(--border-color)', 
                  textAlign: 'left' 
                }}>
                  <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#64748b' }}>Data</th>
                  <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#64748b' }}>Paciente</th>
                  <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#64748b' }}>Profissional</th>
                  <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#64748b' }}>Serviço</th>
                  <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#64748b' }}>Status</th>
                  <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', textAlign: 'right' }}>Valor Total</th>
                  <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', textAlign: 'right' }}>Comissão %</th>
                  <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', textAlign: 'right' }}>Comissão R$</th>
                  <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', textAlign: 'right' }}>Clínica R$</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((s: any) => {
                  const isPilates = s.serviceType.toLowerCase().includes("pilates");
                  
                  // For Pilates, there is no dynamic session repasse. The clinic keeps 100% of the session value.
                  const commPct = isPilates ? 0 : (1 - s.clinicPercentage);
                  const commVal = isPilates ? 0 : (s.value * commPct);
                  const clinVal = isPilates ? s.value : (s.value * s.clinicPercentage);

                  return (
                    <tr key={s.id} style={{ 
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background 0.2s',
                      cursor: 'default'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '16px', fontSize: '0.85rem', color: '#475569' }}>
                        {new Date(s.date).toLocaleDateString('pt-BR')} {new Date(s.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '16px', fontWeight: '700', fontSize: '0.85rem', color: '#1e293b' }}>
                        {s.patientName}
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.85rem', color: '#475569' }}>
                        <span style={{ 
                          background: 'rgba(99, 102, 241, 0.08)',
                          color: 'var(--primary)',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontWeight: '700',
                          fontSize: '0.8rem'
                        }}>
                          {s.professional.name}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>
                        {s.serviceType}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ 
                          padding: '4px 10px', 
                          borderRadius: '8px', 
                          fontSize: '0.75rem',
                          fontWeight: '800',
                          backgroundColor: s.status === 'Finalizado' ? 'rgba(16, 185, 129, 0.1)' : 
                                           s.status === 'Não Compareceu' ? 'rgba(239, 68, 68, 0.1)' : 
                                           s.status === 'Ausência Nula' ? 'rgba(100, 116, 139, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: s.status === 'Finalizado' ? 'var(--success)' : 
                                 s.status === 'Não Compareceu' ? 'var(--danger)' : 
                                 s.status === 'Ausência Nula' ? '#64748b' : '#d97706'
                        }}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.85rem', fontWeight: '750', color: '#1e293b', textAlign: 'right' }}>
                        R$ {s.value.toFixed(2)}
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.85rem', fontWeight: '700', color: isPilates ? '#94a3b8' : '#e11d48', textAlign: 'right' }}>
                        {isPilates ? '-' : `${Math.round(commPct * 100)}%`}
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.85rem', fontWeight: '800', color: isPilates ? '#94a3b8' : '#be185d', textAlign: 'right' }}>
                        {isPilates ? '-' : `R$ ${commVal.toFixed(2)}`}
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.85rem', fontWeight: '800', color: '#047857', textAlign: 'right' }}>
                        R$ {clinVal.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredSessions.length === 0 && (
              <p style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                Nenhum atendimento encontrado para este período com os filtros selecionados.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
