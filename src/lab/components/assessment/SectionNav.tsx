"use client";

import { ChevronRight, CheckCircle2, Circle, AlertTriangle, Info, Skull } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAssessmentContext } from "@/lab/contexts/AssessmentContext";
import { Section, Question, SectionField, TableRow } from "@/lab/types/clinical";

interface SectionNavProps {
    items: (Section | Question)[];
    isClinical: boolean;
}

export default function SectionNav({ items, isClinical }: SectionNavProps) {
    const { answers, currentIdx, setCurrentIdx, activeFlags } = useAssessmentContext();
    
    const isSectionCompleted = (item: Section | Question, idx: number) => {
        if (!isClinical) {
            return answers[idx] !== undefined && answers[idx] !== "";
        }
        
        const section = item as Section;
        const hasValue = (val: any) => {
            if (val === undefined || val === null || val === "" || val === "null") return false;
            if (Array.isArray(val)) return val.length > 0;
            return true;
        };

        const checkFields = (fields?: SectionField[]) => fields?.some(f => {
            const fid = typeof f === 'string' ? f : f?.id;
            return hasValue(answers[fid as string]);
        });

        const checkRows = (rows?: TableRow[]) => rows?.some((r) => r.fields.some((f) => {
            const fid = typeof f === 'string' ? f : (f as any).id;
            return hasValue(answers[fid]);
        }));

        const hasSubData = section.subsections?.some((sub) => 
            checkFields(sub.fields) || (sub.type === 'table' && checkRows(sub.rows))
        );

        return checkFields(section.fields) || (section.type === 'table' && checkRows(section.rows)) || hasSubData;
    };

    return (
        <aside className="section-navigator-aside no-print">
            <div className="navigator-sticky">
                <div className="navigator-header">
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="nav-title"
                    >
                        Navegação
                    </motion.div>
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="nav-subtitle"
                    >
                        {items.length} {isClinical ? 'Seções' : 'Questões'}
                    </motion.div>
                </div>

                {/* CLINICAL RISK INDICATOR */}
                <AnimatePresence>
                    {activeFlags && activeFlags.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            className={`risk-indicator-card ${activeFlags.some(f => f.level === 'red') ? 'critical' : 'warning'}`}
                        >
                            <div className="risk-header">
                                <div className="risk-icon-pulse">
                                    {activeFlags.some(f => f.level === 'red') ? <Skull size={18} /> : <AlertTriangle size={18} />}
                                </div>
                                <span className="risk-label">Risco Clínico: <strong>{activeFlags.length} Alertas</strong></span>
                            </div>
                            <div className="risk-messages">
                                {activeFlags.slice(0, 2).map((f, i) => (
                                    <div key={i} className="risk-msg-item">
                                        • {f.label}
                                    </div>
                                ))}
                                {activeFlags.length > 2 && <div className="risk-more">+{activeFlags.length - 2} outros alertas</div>}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                <nav className="navigator-list">
                    {items.map((item, idx) => {
                        const title = isClinical ? (item as Section).title : `Questão ${idx + 1}`;
                        const isActive = currentIdx === idx;
                        const isCompleted = isSectionCompleted(item, idx);
                        
                        return (
                            <motion.button
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                onClick={() => {
                                    setCurrentIdx(idx);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className={`nav-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                            >
                                <div className="nav-indicator-wrapper">
                                    {isCompleted ? (
                                        <CheckCircle2 size={16} className="status-icon completed" />
                                    ) : (
                                        <div className="nav-dot" />
                                    )}
                                </div>
                                
                                <span className="nav-label">{title}</span>
                                
                                <AnimatePresence>
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-indicator"
                                            className="active-marker"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                        >
                                            <ChevronRight size={14} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        );
                    })}
                </nav>
            </div>

            <style jsx>{`
                .section-navigator-aside {
                    width: 300px;
                    flex-shrink: 0;
                }
                .navigator-sticky {
                    position: sticky;
                    top: 100px;
                    max-height: calc(100vh - 140px);
                    display: flex;
                    flex-direction: column;
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(12px);
                    padding: 1.5rem;
                    border-radius: 1.5rem;
                    border: 1px solid rgba(0,0,0,0.05);
                    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
                }
                .navigator-header {
                    margin-bottom: 1.5rem;
                    padding-left: 0.5rem;
                }
                .nav-title {
                    font-size: 0.7rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    color: var(--text-muted);
                    margin-bottom: 0.4rem;
                }
                .nav-subtitle {
                    font-size: 1.4rem;
                    font-weight: 900;
                    color: var(--secondary);
                }
                .navigator-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                    overflow-y: auto;
                    padding-right: 0.75rem;
                    margin-right: -0.75rem;
                }
                
                .navigator-list::-webkit-scrollbar {
                    width: 4px;
                }
                .navigator-list::-webkit-scrollbar-track {
                    background: transparent;
                }
                .navigator-list::-webkit-scrollbar-thumb {
                    background-color: rgba(0,0,0,0.1);
                    border-radius: 10px;
                }
                
                .nav-item {
                    display: flex;
                    align-items: center;
                    gap: 0.85rem;
                    padding: 0.75rem 1rem;
                    border-radius: 0.85rem;
                    background: transparent;
                    border: 1px solid transparent;
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    color: var(--text-muted);
                    font-weight: 600;
                    font-size: 0.92rem;
                    position: relative;
                }
                
                .nav-item:hover {
                    background-color: rgba(0,0,0,0.03);
                    color: var(--secondary);
                    transform: translateX(4px);
                }
                
                .nav-item.active {
                    background-color: white;
                    color: var(--primary);
                    box-shadow: 0 4px 12px rgba(139, 0, 0, 0.08);
                    border-color: rgba(139, 0, 0, 0.1);
                }
                
                .nav-indicator-wrapper {
                    width: 18px;
                    height: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                
                .nav-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background-color: currentColor;
                    opacity: 0.3;
                    transition: all 0.3s;
                }
                
                .nav-item.active .nav-dot {
                    opacity: 1;
                    transform: scale(1.5);
                }
                
                .status-icon.completed {
                    color: #10b981;
                    filter: drop-shadow(0 0 2px rgba(16, 185, 129, 0.2));
                }
                
                .nav-label {
                    flex: 1;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .active-marker {
                    color: var(--primary);
                    display: flex;
                    align-items: center;
                }

                .risk-indicator-card {
                    padding: 1.25rem;
                    border-radius: 1.25rem;
                    margin-bottom: 2rem;
                    overflow: hidden;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.08);
                    position: relative;
                }
                .risk-indicator-card.critical {
                    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
                    border-color: #fecaca;
                }
                .risk-indicator-card.warning {
                    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
                    border-color: #fde68a;
                    border-left-color: #d97706;
                    border-left-width: 4px;
                }
                .risk-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 0.75rem;
                }
                .critical .risk-header { color: #dc2626; }
                .warning .risk-header { color: #92400e; }
                
                .risk-icon-pulse {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: alert-pulse 2s infinite;
                }
                @keyframes alert-pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .risk-label {
                    font-size: 0.8rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.025em;
                }
                .risk-messages {
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                }
                .risk-msg-item {
                    font-size: 0.75rem;
                    font-weight: 700;
                    line-height: 1.3;
                    color: #7f1d1d;
                }
                .warning .risk-msg-item { color: #78350f; }
                .risk-more {
                    font-size: 0.65rem;
                    font-weight: 800;
                    opacity: 0.6;
                    margin-top: 4px;
                }

                @media (max-width: 1100px) {
                    .section-navigator-aside {
                        display: none;
                    }
                }
            `}</style>
        </aside>
    );
}
