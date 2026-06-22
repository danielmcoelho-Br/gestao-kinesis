"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  TrendingUp, 
  Calendar, 
  Activity, 
  ChevronRight,
  User,
  History,
  Target,
  AlertTriangle,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getPatientAssessments } from "@/app/(lab)/dashboard/actions";
import { questionnairesData } from "@/lab/data/questionnaires";
import Header from "@/lab/components/Header";
import { toast } from "sonner";

export default function PatientEvolutionPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.patientId as string;

  const [assessments, setAssessments] = useState<any[]>([]);
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const result = await getPatientAssessments(patientId);
      if (result.success && result.data) {
        setAssessments(result.data.assessments || []);
        setPatient(result.data.patient);
        
        const counts: Record<string, number> = {};
        result.data.assessments.forEach((a: any) => {
          counts[a.assessment_type] = (counts[a.assessment_type] || 0) + 1;
        });
        const multiple = Object.keys(counts).find(k => counts[k] > 1);
        if (multiple) setSelectedType(multiple);
        else if (result.data.assessments.length > 0) setSelectedType(result.data.assessments[0].assessment_type);
      }
      setLoading(false);
    }
    fetchData();
  }, [patientId]);

  const evolutionData = useMemo(() => {
    if (!selectedType) return [];
    return assessments
      .filter(a => a.assessment_type === selectedType)
      .map(a => {
        const d = a.created_at ? new Date(a.created_at) : null;
        const isValidDate = d && !isNaN(d.getTime());
        return {
          id: a.id,
          date: isValidDate ? d.toLocaleDateString('pt-BR') : '',
          timestamp: isValidDate ? d.getTime() : 0,
          score: a.clinical_data?.percentage || 0,
          eva: a.questionnaire_answers?.intensidade_dor || 0,
          answers: a.questionnaire_answers || {},
          interpretation: a.clinical_data?.interpretation || "Avaliado",
          activeFlags: a.clinical_data?.activeFlags || []
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [assessments, selectedType]);

  const chartMetrics = useMemo(() => {
    if (evolutionData.length === 0) return [];
    const metrics = [
      { id: 'score', label: 'Evolução Funcional (%)', color: '#dc2626', gradient: 'scoreGradient', getValue: (d: any) => d.score },
      { id: 'eva', label: 'Intensidade da Dor (EVA)', color: '#ef4444', gradient: 'evaGradient', getValue: (d: any) => d.eva }
    ];

    // Detect if this assessment has side-by-side strength data
    const hasDeficit = evolutionData.some(d => Object.keys(d.answers).some(k => k.includes('deficit') || k.includes('_def')));
    if (hasDeficit) {
        metrics.push({
            id: 'deficit',
            label: 'Média de Déficit Muscular (%)',
            color: '#f59e0b',
            gradient: 'warnGradient',
            getValue: (d: any) => {
                const defKeys = Object.keys(d.answers).filter(k => k.includes('deficit') || k.includes('_def'));
                if (defKeys.length === 0) return 0;
                const vals = defKeys.map(k => parseFloat(String(d.answers[k]).replace('%', ''))).filter(v => !isNaN(v));
                return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
            }
        });
    }

    return metrics;
  }, [evolutionData]);

  // Helper to generate Bezier curve path
  const getSmoothPath = (points: any[]) => {
    if (points.length < 2) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      d += ` C ${cp1x} ${p0.y}, ${cp1x} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const renderLineChart = (metric: any) => {
    if (evolutionData.length < 1) return null;
    
    const width = 800;
    const height = 240;
    const padding = 50;
    
    const values = evolutionData.map(metric.getValue) as number[];
    const maxVal = Math.max(...values, 1) * 1.15;
    const minVal = 0;

    const points = evolutionData.map((d, i) => {
      const x = padding + (i * (width - 2 * padding) / (evolutionData.length > 1 ? evolutionData.length - 1 : 1));
      const y = height - padding - ((metric.getValue(d) - minVal) / (maxVal - minVal) * (height - 2 * padding));
      return { x, y, value: metric.getValue(d), date: d.date };
    });

    const pathD = getSmoothPath(points);
    const areaD = points.length > 1 
        ? `${pathD} L ${points[points.length-1].x} ${height-padding} L ${points[0].x} ${height-padding} Z`
        : "";

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="evolution-chart-box-glass"
      >
        <div className="chart-header">
          <div className="chart-title-group">
            <div className="color-indicator-glow" style={{ backgroundColor: metric.color, boxShadow: `0 0 12px ${metric.color}` }} />
            <h4>{metric.label}</h4>
          </div>
        </div>
        <div className="svg-wrapper">
          <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
            <defs>
              <linearGradient id={metric.gradient} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={metric.color} stopOpacity={0.25}/>
                <stop offset="95%" stopColor={metric.color} stopOpacity={0}/>
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map(v => {
              const y = height - padding - (v * (height - 2 * padding));
              return (
                <line key={v} x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(203, 213, 225, 0.2)" strokeDasharray="4 4" strokeWidth="1" />
              );
            })}

            {/* Area Fill */}
            {points.length > 1 && (
              <motion.path
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                d={areaD}
                fill={`url(#${metric.gradient})`}
              />
            )}

            {/* Path */}
            {points.length > 1 ? (
              <motion.path
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                d={pathD}
                fill="none"
                stroke={metric.color}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
                <text x="50%" y="85%" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="500">
                    Aguardando segunda avaliação para traçar tendência
                </text>
            )}

            {/* Data Points */}
            {points.map((p, i) => (
              <g key={i}>
                <motion.circle
                  initial={{ scale: 0 }}
                  whileHover={{ scale: 1.5 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  cx={p.x}
                  cy={p.y}
                  r="6"
                  fill="white"
                  stroke={metric.color}
                  strokeWidth="3"
                  className="data-point-glow"
                />
                <text x={p.x} y={p.y - 15} fontSize="12" fontWeight="900" textAnchor="middle" fill={metric.color} style={{ filter: 'drop-shadow(0 2px 2px rgba(255,255,255,1))' }}>{p.value}{metric.id === 'score' || metric.id === 'deficit' ? '%' : ''}</text>
                <text x={p.x} y={height - 20} fontSize="11" fontWeight="700" textAnchor="middle" fill="#94a3b8">{p.date}</text>
              </g>
            ))}
          </svg>
        </div>
      </motion.div>
    );
  };

  const assessmentTypes = Array.from(new Set(assessments.map(a => a.assessment_type)));

  return (
    <div className="evolution-page">
      <div className="background-gradient" />
      <Header />

      <main className="container main-content">
        <header className="page-header">
            <div className="header-nav">
                <button onClick={() => router.back()} className="back-btn">
                    <ArrowLeft size={20} />
                    <span>Voltar</span>
                </button>
            </div>
            
            <div className="header-main">
                <div className="title-section">
                    <div className="icon-badge">
                    <TrendingUp size={32} />
                    </div>
                    <div>
                    <h1>Evolução Clínica</h1>
                    <p>Histórico evolutivo de <strong>{patient?.name}</strong></p>
                    </div>
                </div>

                <div className="type-selector">
                    {assessmentTypes.map(type => (
                    <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`type-btn ${selectedType === type ? 'active' : ''}`}
                    >
                        {questionnairesData[type]?.title || type}
                    </button>
                    ))}
                </div>
            </div>
        </header>

        {loading ? (
          <div className="loading-state">
             <div className="spinner" />
             <p>Analisando dados do histórico...</p>
          </div>
        ) : evolutionData.length < 2 ? (
          <div className="empty-state">
            <Activity size={48} />
            <h3>Dados Comparativos Insuficientes</h3>
            <p>É necessária uma segunda avaliação do tipo <strong>{selectedType ? questionnairesData[selectedType]?.title : "selecionado"}</strong> para gerar o gráfico evolutivo comparativo.</p>
          </div>
        ) : (
          <div className="dashboard-grid">
            <div className="main-charts">
                <div className="stats-row">
                    {(() => {
                        const first = evolutionData[0].score;
                        const last = evolutionData[evolutionData.length -1].score;
                        const diff = last - first;
                        const isGood = (selectedType === 'oswestry' || selectedType === 'ndi') ? diff < 0 : diff > 0;
                        
                        return (
                            <>
                            {evolutionData.length > 1 && (
                                <motion.div whileHover={{ y: -5 }} className="stat-card-glass">
                                    <div className="stat-icon" style={{ backgroundColor: isGood ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: isGood ? '#10b981' : '#ef4444' }}>
                                        <Target size={24} />
                                    </div>
                                    <div className="stat-info">
                                        <span className="stat-label">Variação de Score</span>
                                        <span className="stat-value">{diff > 0 ? '+' : ''}{diff}%</span>
                                        <span className={`stat-status ${isGood ? 'positive' : 'negative'}`}>
                                            {isGood ? 'Melhora Clínica' : 'Regressão'}
                                        </span>
                                    </div>
                                </motion.div>
                            )}

                            <motion.div whileHover={{ y: -5 }} className="stat-card-glass">
                                <div className="stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                                    <Activity size={24} />
                                </div>
                                <div className="stat-info">
                                    <span className="stat-label">Status Atual</span>
                                    <span className="stat-value">{evolutionData[evolutionData.length-1].interpretation}</span>
                                    <span className="stat-desc">Última avaliação: {evolutionData[evolutionData.length-1].date}</span>
                                </div>
                            </motion.div>

                            <motion.div whileHover={{ y: -5 }} className="stat-card-glass">
                                <div className="stat-icon" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
                                    <History size={24} />
                                </div>
                                <div className="stat-info">
                                    <span className="stat-label">Total de Registros</span>
                                    <span className="stat-value">{evolutionData.length}</span>
                                    <span className="stat-desc">Avaliações catalogadas</span>
                                </div>
                            </motion.div>
                            </>
                        );
                    })()}
                </div>
                
                {evolutionData.some(d => d.activeFlags.length > 0) && (
                    <div className="alerts-summary-card">
                        <div className="alert-card-header">
                            <AlertTriangle size={20} />
                            <h3>Alertas Clínicos Identificados</h3>
                        </div>
                        <div className="alerts-list">
                            {evolutionData
                                .filter(d => d.activeFlags.length > 0)
                                .slice(-3)
                                .reverse()
                                .map(d => (
                                    <div key={d.id} className="assessment-alert-group">
                                        <div className="alert-date">{d.date}</div>
                                        {d.activeFlags.map((f: any) => (
                                            <div key={f.id} className={`inline-alert ${f.level}`}>
                                                <span className="dot" />
                                                <div className="alert-text">
                                                    <strong>{f.label}:</strong> {f.message}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                )}

                <div className="charts-container">
                    {chartMetrics.map(metric => (
                    <div key={metric.id}>
                        {renderLineChart(metric)}
                    </div>
                    ))}
                </div>
            </div>

            <aside className="timeline-sidebar">
                <div className="sidebar-header">
                    <History size={20} />
                    <h3>Linha do Tempo</h3>
                </div>
                <div className="timeline-items">
                    {evolutionData.slice().reverse().map((item, idx) => (
                        <div key={item.id} className="timeline-entry" onClick={() => router.push(`/dashboard/assessment/${patientId}/${selectedType}?id=${item.id}`)}>
                            <div className="timeline-line-marker" />
                            <div className="timeline-dot-marker" />
                            <div className="timeline-content">
                                <span className="time-date">{item.date}</span>
                                <span className="time-title">{item.interpretation}</span>
                                <div className="time-stats">
                                    <span>Score: <strong>{item.score}%</strong></span>
                                    <span>Dor: <strong>{item.eva}/10</strong></span>
                                </div>
                                {item.activeFlags.length > 0 && (
                                    <div className="time-flags">
                                        {item.activeFlags.some((f: any) => f.level === 'red') ? (
                                            <span className="flag-badge red"><AlertTriangle size={10} /> Red Flag</span>
                                        ) : (
                                            <span className="flag-badge yellow"><Info size={10} /> Yellow Flag</span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <ChevronRight size={16} className="arrow" />
                        </div>
                    ))}
                </div>
            </aside>
          </div>
        )}
      </main>

      <style jsx>{`
        .background-gradient {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(circle at 10% 10%, rgba(139, 0, 0, 0.03) 0%, transparent 40%),
                      radial-gradient(circle at 90% 90%, rgba(239, 68, 68, 0.05) 0% , transparent 40%),
                      #f8fafc;
          z-index: -1;
        }
        .main-content {
          padding-top: 2rem;
          padding-bottom: 6rem;
        }
        .page-header {
          margin-bottom: 3.5rem;
        }
        .header-nav {
            margin-bottom: 1.5rem;
        }
        .back-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            background: none;
            border: none;
            color: #64748b;
            font-weight: 700;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 0.5rem;
            transition: all 0.2s;
        }
        .back-btn:hover {
            background-color: #f1f5f9;
            color: #1e293b;
        }
        .header-main {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            gap: 2rem;
            flex-wrap: wrap;
        }
        .title-section {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        .icon-badge {
          width: 72px;
          height: 72px;
          background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
          color: white;
          border-radius: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 25px -5px rgba(220, 38, 38, 0.4);
        }
        .title-section h1 {
          font-size: 2.5rem;
          font-weight: 900;
          margin: 0;
          color: #0f172a;
          letter-spacing: -0.025em;
        }
        .title-section p {
          color: #64748b;
          margin: 0.25rem 0 0 0;
          font-size: 1.1rem;
        }
        .type-selector {
          display: flex;
          gap: 0.5rem;
          background: #f1f5f9;
          padding: 0.4rem;
          border-radius: 1rem;
        }
        .type-btn {
          padding: 0.6rem 1.25rem;
          border-radius: 0.75rem;
          background: transparent;
          border: none;
          color: #64748b;
          font-weight: 700;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s;
        }
        .type-btn:hover {
          color: #1e293b;
        }
        .type-btn.active {
          background-color: white;
          color: #8b0000;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .dashboard-grid {
            display: grid;
            grid-template-columns: 1fr 320px;
            gap: 2rem;
        }
        @media (max-width: 1024px) {
            .dashboard-grid { grid-template-columns: 1fr; }
            .timeline-sidebar { order: 2; }
        }
        .stats-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        .stat-card-glass {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(10px);
            padding: 1.5rem;
            border-radius: 1.5rem;
            border: 1px solid rgba(255, 255, 255, 0.5);
            display: flex;
            align-items: center;
            gap: 1.25rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .stat-card-glass:hover {
            background: rgba(255, 255, 255, 0.9);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            border-color: #fca5a5;
        }
        .evolution-chart-box-glass {
            background: rgba(255, 255, 255, 0.6);
            backdrop-filter: blur(10px);
            border-radius: 2rem;
            padding: 2rem;
            border: 1px solid rgba(255, 255, 255, 0.4);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
            margin-bottom: 2rem;
        }
        .color-indicator-glow {
            width: 12px; height: 12px; border-radius: 50%;
        }
        .timeline-sidebar {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(10px);
            border-radius: 2rem;
            padding: 2rem;
            border: 1px solid rgba(255, 255, 255, 0.5);
            height: fit-content;
            position: sticky;
            top: 2rem;
        }
        .sidebar-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 2rem;
            color: #1e293b;
        }
        .sidebar-header h3 { font-size: 1.1rem; font-weight: 800; margin: 0; }
        .timeline-items {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        .timeline-entry {
            position: relative;
            padding: 1rem 1rem 1.25rem 2.8rem;
            border-radius: 1.25rem;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .timeline-entry:hover { 
            background: white;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .timeline-content { display: flex; flex-direction: column; gap: 2px; }
        .timeline-line-marker {
            position: absolute;
            left: 11px;
            top: 0;
            bottom: 0;
            width: 2px;
            background-color: #f1f5f9;
        }
        .timeline-entry:first-child .timeline-line-marker { top: 1.5rem; }
        .timeline-entry:last-child .timeline-line-marker { bottom: 1.5rem; }
        .timeline-dot-marker {
            position: absolute;
            left: 7px;
            top: 1.5rem;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background-color: #cbd5e1;
            border: 2px solid white;
            z-index: 2;
            transition: all 0.3s;
        }
        .timeline-entry:hover .timeline-dot-marker { 
            background-color: #dc2626; 
            transform: scale(1.5);
            box-shadow: 0 0 15px rgba(220, 38, 38, 0.4);
        }
        .time-date { font-size: 0.75rem; font-weight: 800; color: #94a3b8; }
        .time-title { font-size: 0.9rem; font-weight: 700; color: #1e293b; }
        .time-stats { font-size: 0.75rem; color: #64748b; display: flex; gap: 0.75rem; margin-top: 4px; }
        .time-stats strong { color: #334155; }
        .arrow { color: #cbd5e1; transition: transform 0.2s; }
        .timeline-entry:hover .arrow { transform: translateX(3px); color: #8b0000; }
        .time-flags {
            display: flex;
            gap: 4px;
            margin-top: 6px;
        }
        .flag-badge {
            font-size: 0.65rem;
            font-weight: 800;
            padding: 2px 6px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            gap: 4px;
            text-transform: uppercase;
        }
        .flag-badge.red { background-color: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        .flag-badge.yellow { background-color: #fffbeb; color: #d97706; border: 1px solid #fde68a; }

        .alerts-summary-card {
            background: #fffafa;
            border: 1px solid #fecaca;
            border-radius: 1.5rem;
            padding: 1.5rem;
            margin-bottom: 2rem;
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.05);
        }
        .alert-card-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            color: #dc2626;
            margin-bottom: 1.25rem;
        }
        .alert-card-header h3 { font-size: 1.1rem; font-weight: 800; margin: 0; }
        .alerts-list { display: flex; flex-direction: column; gap: 1rem; }
        .assessment-alert-group { 
            padding-left: 1rem; 
            border-left: 2px solid #fee2e2;
        }
        .alert-date { font-size: 0.75rem; font-weight: 800; color: #94a3b8; margin-bottom: 0.5rem; }
        .inline-alert { font-size: 0.85rem; line-height: 1.4; margin-bottom: 0.5rem; display: flex; gap: 8px; align-items: flex-start; }
        .inline-alert.red { color: #991b1b; }
        .inline-alert.yellow { color: #92400e; }
        .inline-alert .dot { width: 6px; height: 6px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; }
        .inline-alert.red .dot { background-color: #dc2626; }
        .inline-alert.yellow .dot { background-color: #d97706; }

        .spinner {
          width: 48px;
          height: 48px;
          border: 5px solid #f1f5f9;
          border-top-color: #8b0000;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
