"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { assessmentService } from "@/lab/services/assessment/assessmentService";
import { Section, Question, SectionField, TableRow, Questionnaire } from "@/lab/types/clinical";
import { evaluateClinicalFlags } from "@/lab/utils/clinicalIntelligence";
import { compressImage } from "@/lab/lib/image-compressor";
import { calculateAssessmentScore, CalculationType } from "@/lab/lib/calculations";
import localforage from "localforage";
import { getEnduranceThreshold } from "@/lab/utils/clinicalThresholds";

interface UseAssessmentStateProps {
    patientId: string;
    type: string;
    assessmentId: string | null;
    questionnaire: Questionnaire;
    router: any;
    searchParams: any;
}

const isValidUUID = (id: string) => {
    if (typeof id !== "string") return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) || 
           /^[a-z0-9]{20,32}$/i.test(id);
};

export function useAssessmentState({ 
    patientId, 
    type, 
    assessmentId, 
    questionnaire, 
    router,
    searchParams 
}: UseAssessmentStateProps) {
    const fieldMap = useMemo(() => {
        const map: Record<string, SectionField> = {};
        const collect = (sections: Section[]) => {
            sections.forEach(s => {
                s.fields?.forEach((f) => { map[f.id] = f; });
                s.subsections?.forEach((sub) => {
                    sub.fields?.forEach((f) => { map[f.id] = f; });
                    sub.rows?.forEach((row) => {
                        row.fields?.forEach((f) => {
                            if (typeof f !== "string") map[(f as any).id] = f as any;
                        });
                    });
                });
                s.rows?.forEach((row) => {
                    row.fields?.forEach((f) => {
                        if (typeof f !== "string") map[(f as any).id] = f as any;
                    });
                });
            });
        };
        if (questionnaire?.sections) collect(questionnaire.sections);
        return map;
    }, [questionnaire]);

    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [originalAnswers, setOriginalAnswers] = useState<Record<string, any>>({});
    const [isFinished, setIsFinished] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(!assessmentId);
    const [showLogs, setShowLogs] = useState(false);
    const [changeLogs, setChangeLogs] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [assessmentOwner, setAssessmentOwner] = useState<any>(null);
    const [assessmentOwnerId, setAssessmentOwnerId] = useState<string | null>(null);
    const [assessmentDate, setAssessmentDate] = useState<string>("");
    const [patientName, setPatientName] = useState<string>("");
    const [patientGender, setPatientGender] = useState<string>("");
    const [patientAge, setPatientAge] = useState<number>(0);
    const [patientActivityLevel, setPatientActivityLevel] = useState<string>("Inativo");
    const [patientAssessments, setPatientAssessments] = useState<any[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showDraftModal, setShowDraftModal] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);
    const [pendingDraft, setPendingDraft] = useState<Record<string, any> | null>(null);
    const [dynamoModal, setDynamoModal] = useState<{ fieldId: string, label: string } | null>(null);
    const [dynamoValues, setDynamoValues] = useState<[string, string, string]>(['', '', '']);
    const [ybtModal, setYbtModal] = useState<boolean>(false);
    const [ybtValues, setYbtValues] = useState<{ anterior: string, postMedial: string, postLateral: string, limbLength: string, side: 'esq' | 'dir' }>({ anterior: '', postMedial: '', postLateral: '', limbLength: '', side: 'esq' });
    const [posturalModal, setPosturalModal] = useState<{ isOpen: boolean, image: string, fieldId: string, index: number }>({ isOpen: false, image: '', fieldId: '', index: 0 });
    const [isDirty, setIsDirty] = useState(false);
    const [activeFlags, setActiveFlags] = useState<any[]>([]);

    const isPrint = searchParams.get("print") === "true";
    const autoPrint = searchParams.get("autoPrint") === "true";

    const handleRecoverDraft = () => {
        if (pendingDraft) {
            setAnswers(pendingDraft);
            toast.success("Rascunho recuperado!");
        }
        setShowDraftModal(false);
        setPendingDraft(null);
    };

    const handleDiscardDraft = async () => {
        const draftKey = `assessment_draft_${patientId}_${type}`;
        const checkpointKey = `checkpoint_${patientId}_${type}`;
        await localforage.removeItem(draftKey);
        await localforage.removeItem(checkpointKey);
        setShowDraftModal(false);
        setPendingDraft(null);
        toast.info("Rascunho descartado.");
    };

    // Load user from localStorage
    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        if (savedUser) setUser(JSON.parse(savedUser));
    }, []);

    // Warn user before closing/navigating away when there are unsaved changes
    useEffect(() => {
        if (!isDirty || !isEditing) return;
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = 'Você tem alterações não salvas. Deseja sair mesmo assim?';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty, isEditing]);

    // Handle autoPrint
    useEffect(() => {
        if (!autoPrint || !assessmentId) return;
        const timer = setTimeout(() => {
            window.print();
        }, 1500);
        return () => clearTimeout(timer);
    }, [autoPrint, assessmentId]);

    // Main load effect
    useEffect(() => {
        async function load() {
            if (!patientId || !isValidUUID(patientId)) return;
            
            // Fetch Patient Data
            const pRes = await assessmentService.fetchPatient(patientId);
            if (pRes.success && pRes.data) {
                setPatientName(pRes.data.name);
                setPatientGender(pRes.data.gender || "");
                setPatientAge(pRes.data.age || 0);
                if (pRes.data.activity_level) setPatientActivityLevel(pRes.data.activity_level);
            }

            if (!assessmentDate) {
                setAssessmentDate(new Date().toLocaleDateString('pt-BR'));
            }

            // Fetch All Patient Assessments for history charts
            const hRes = await assessmentService.fetchPatientHistory(patientId);
            let latestQuest = null;
            if (hRes.success && hRes.data) {
                const all = hRes.data.assessments;
                setPatientAssessments(all.map((a: any) => ({
                    id: a.id,
                    assessment_type: a.assessment_type,
                    created_at: a.created_at,
                    answers: a.questionnaire_answers,
                    scoreData: a.clinical_data
                })));

                if (!assessmentId && (type === 'afLombar' || type === 'afCervical' || type === 'afOmbro')) {
                    const questType = type === 'afLombar' ? 'oswestry' : type === 'afCervical' ? 'ndi' : 'quickdash';
                    const today = new Date().toLocaleDateString('pt-BR');
                    latestQuest = all.find((a: any) => {
                        const d = a.created_at ? new Date(a.created_at) : null;
                        const isValid = d && !isNaN(d.getTime());
                        return a.assessment_type === questType && 
                            (a.clinical_data?.percentage || 0) > 0 &&
                            (!isValid || d.toLocaleDateString('pt-BR') !== today);
                    });
                    
                    if (!latestQuest) {
                        latestQuest = all.find((a: any) => 
                            a.assessment_type === questType && 
                            (a.clinical_data?.percentage || 0) > 0 &&
                            a.id !== assessmentId
                        );
                    }
                }
            }

            // Checkpoint redirection
            const checkpointStr = await localforage.getItem<string>(`checkpoint_${patientId}_${type}`);
            if (checkpointStr && !assessmentId) {
                try {
                    const cp = JSON.parse(checkpointStr);
                    if (cp.assessmentId) {
                        router.replace(`/dashboard/assessment/${patientId}/${type}?id=${cp.assessmentId}`);
                        return;
                    }
                } catch(e) {}
            }

            if (assessmentId) {
                const res = await assessmentService.fetchAssessment(assessmentId, patientId, type);
                if (res && res.success && res.data) {
                    const data = res.data as any;
                    const loadedAnswers = data.questionnaire_answers as Record<string, any>;
                    setOriginalAnswers(loadedAnswers);
                    setChangeLogs(data.change_logs as any[] || []);
                    setAssessmentOwnerId(data.created_by_id);
                    setAssessmentOwner(data.created_by);
                    if (data.created_at) {
                        const d = new Date(data.created_at);
                        if (!isNaN(d.getTime())) {
                            setAssessmentDate(d.toLocaleDateString('pt-BR'));
                        }
                    }
                    
                    let finalAnswers = loadedAnswers;
                    if (checkpointStr) {
                        try {
                            const cp = JSON.parse(checkpointStr);
                            finalAnswers = { ...loadedAnswers, ...cp.answers };
                            setIsEditing(true);
                        } catch(e) {}
                        await localforage.removeItem(`checkpoint_${patientId}_${type}`);
                    } else {
                        setIsEditing(false);
                    }
                    setAnswers(finalAnswers);
                }
            } else {
                const draftKey = `assessment_draft_${patientId}_${type}`;
                const draft = await localforage.getItem<string>(draftKey);
                let currentAnswers: Record<string, any> = {};
                
                if (checkpointStr) {
                    try {
                        const cp = JSON.parse(checkpointStr);
                        currentAnswers = cp.answers || {};
                    } catch(e) {}
                    await localforage.removeItem(`checkpoint_${patientId}_${type}`);
                } else if (draft) {
                    try {
                        const parsedDraft = JSON.parse(draft);
                        const draftKeys = Object.keys(parsedDraft);
                        const currentKeys = Object.keys(answers);
                        
                        const hasActiveSessionData = currentKeys.some(k => !k.endsWith('_score_previo') && !k.endsWith('_data_previo')) || currentIdx > 0;

                        if (draftKeys.length > 0 && !hasActiveSessionData) {
                            const isReturning = searchParams.get('returnTo');
                            
                            if (isReturning) {
                                currentAnswers = parsedDraft;
                                setOriginalAnswers(parsedDraft);
                                toast.success("Dados restaurados automaticamente.");
                            } else {
                                setPendingDraft(parsedDraft);
                                setShowDraftModal(true);
                            }
                        }
                    } catch (e) {
                        console.error("Erro ao carregar rascunho:", e);
                    }
                }

                if (Object.keys(currentAnswers).length === 0 && !pendingDraft && latestQuest) {
                    const prefix = type === 'afLombar' ? 'oswestry' : type === 'afCervical' ? 'ndi' : 'quickdash';
                    const score = (latestQuest as any).scoreData?.percentage || (latestQuest as any).clinical_data?.percentage || 0;
                    if (score > 0) {
                        currentAnswers[`${prefix}_score_previo`] = `${score}%`;
                        if (latestQuest.created_at) {
                            const d = new Date(latestQuest.created_at);
                            if (!isNaN(d.getTime())) {
                                currentAnswers[`${prefix}_data_previo`] = d.toISOString().split('T')[0];
                            }
                        }
                    }
                }
                const hasRealDraftData = Object.keys(currentAnswers).some(k => !k.endsWith('_score_previo') && !k.endsWith('_data_previo'));
                setAnswers(currentAnswers);
                
                if (hasRealDraftData && !pendingDraft) {
                    setIsDirty(true);
                }
            }

            // GLOBAL RETURN SCORE CHECK
            const returnScoreKey = `return_score_${patientId}_${type}`;
            const returnScore = localStorage.getItem(returnScoreKey);
            if (returnScore) {
                let fieldId = 'score'; 

                if (type === 'afLombar') fieldId = 'oswestry_score';
                else if (type === 'afCervical') fieldId = 'ndi_score';
                else if (type === 'afOmbro' || type === 'afCotovelo' || type === 'afMao') fieldId = 'quickdash_score';
                else if (type === 'afGeriatria') {
                    const geriatricScoreKeys = ['man_score', 'ves13_score', 'lbpq_score', 'brief_score'];
                    for (const key of geriatricScoreKeys) {
                        const subKey = `return_score_${patientId}_${type}_${key}`;
                        const subScore = localStorage.getItem(subKey);
                        if (subScore) {
                            setAnswers(prev => ({ ...prev, [key]: subScore }));
                            localStorage.removeItem(subKey);
                        }
                    }
                    fieldId = ''; 
                    localStorage.removeItem(returnScoreKey);
                    toast.success(`Resultado do questionário importado!`);
                } else if (type === 'afMmii') {
                    const mmiiScoreKeys = ['lysholm_score', 'womac_score', 'ikdc_score', 'aofas_score'];
                    for (const key of mmiiScoreKeys) {
                        const subKey = `return_score_${patientId}_${type}_${key}`;
                        const subScore = localStorage.getItem(subKey);
                        if (subScore) {
                            setAnswers(prev => ({ ...prev, [key]: subScore }));
                            localStorage.removeItem(subKey);
                        }
                    }
                    fieldId = '';
                    localStorage.removeItem(returnScoreKey);
                    toast.success(`Resultado do questionário importado!`);
                }

                if (fieldId) {
                    const formattedScore = returnScore.includes('%') ? returnScore : `${returnScore}%`;
                    setAnswers(prev => ({ ...prev, [fieldId]: formattedScore }));
                    localStorage.removeItem(returnScoreKey);
                    toast.success(`Resultado do questionário importado!`);
                }
                
                if (questionnaire.sections) {
                    const idx = questionnaire.sections.findIndex(s => s.id.includes('integracao'));
                    if (idx !== -1) {
                        setCurrentIdx(idx);
                    }
                }
            }
        }
        load();
    }, [assessmentId, patientId, type]);

    useEffect(() => {
        if (!questionnaire?.id) return;
        const triggered = evaluateClinicalFlags(questionnaire.id, answers);
        setActiveFlags(triggered);
    }, [answers, questionnaire]);

    // Save draft effect (Debounced 1 second to improve UI performance during typing)
    useEffect(() => {
        if (!assessmentId && Object.keys(answers).length > 0) {
            const keys = Object.keys(answers);
            const hasRealData = keys.some(k => !k.endsWith('_score_previo') && !k.endsWith('_data_previo'));
            
            if (hasRealData) {
                const timeoutId = setTimeout(() => {
                    const draftKey = `assessment_draft_${patientId}_${type}`;
                    const cleanAnswers: Record<string, any> = { ...answers };

                    try {
                        localforage.setItem(draftKey, JSON.stringify(cleanAnswers)).catch(() => {
                            localforage.removeItem(draftKey);
                        });
                    } catch (e) {
                        localforage.removeItem(draftKey);
                    }
                }, 1000); // 1000ms delay to prevent heavy async calls on every keystroke
                
                return () => clearTimeout(timeoutId);
            }
        }
    }, [answers, patientId, type, assessmentId]);

    const handleSelect = (value: number) => {
        if (!isEditing) return;
        
        const items = questionnaire.sections || questionnaire.questions || [];
        const currentItem = items[currentIdx];
        const key = (currentItem as any).id !== undefined ? (currentItem as any).id : currentIdx;

        setAnswers(prev => {
            const newAnswers = { ...prev, [key]: value };
            if (currentIdx < items.length - 1) {
                setTimeout(() => {
                    setCurrentIdx(currentIdx + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 300);
            }
            return newAnswers;
        });
    };

    const handleAnalyzeImage = useCallback((img: string, fieldId: string, index: number) => {
        setPosturalModal({ isOpen: true, image: img, fieldId, index });
    }, []);

    const handleSavePosturalAnalysis = useCallback(async (processedImage: string) => {
        const compressed = await compressImage(processedImage);
        const { fieldId, index } = posturalModal;
        setAnswers(prev => {
            const currentVal = prev[fieldId];
            let newVal;
            if (Array.isArray(currentVal)) {
                newVal = [...currentVal];
                newVal[index] = compressed;
            } else {
                newVal = compressed;
            }
            return { ...prev, [fieldId]: newVal, _lastModified: Date.now() };
        });
        toast.success("Análise postural salva e inserida no formulário!");
    }, [posturalModal]);

    const handleInputChange = useCallback((fieldId: string, value: any) => {
        if (!isEditing) return;

        // Range Validation Logic
        if (typeof value === 'string' || typeof value === 'number') {
            const numVal = parseFloat(String(value).replace(',', '.'));
            if (!isNaN(numVal)) {
                // Find field metadata to check for min/max - Now using optimized fieldMap
                const fieldMeta = fieldMap[fieldId];

                if (fieldMeta && (fieldMeta.min !== undefined || fieldMeta.max !== undefined)) {
                    if (fieldMeta.min !== undefined && numVal < fieldMeta.min) {
                        toast.warning(`Valor abaixo do mínimo (${fieldMeta.min}) para ${fieldMeta.label}`);
                    }
                    if (fieldMeta.max !== undefined && numVal > fieldMeta.max) {
                        toast.warning(`Valor acima do máximo (${fieldMeta.max}) para ${fieldMeta.label}`);
                    }
                }
            }
        }

        setIsDirty(true);
        const safeParse = (val: any) => {
            if (val === undefined || val === null || val === '') return 0;
            return parseFloat(String(val).replace(',', '.'));
        };

        setAnswers(prev => {
            const newAnswers = { ...prev, [fieldId]: value, _lastModified: Date.now() };
            
            // Auto-calculations logic
            if (type === 'afOmbro') {
                const movements = ['forca_abd', 'forca_rl', 'forca_rm'];
                movements.forEach(mId => {
                    if (fieldId === `${mId}_esq` || fieldId === `${mId}_dir`) {
                        const esq = safeParse(newAnswers[`${mId}_esq`]);
                        const dir = safeParse(newAnswers[`${mId}_dir`]);
                        if (esq > 0 || dir > 0) {
                            const max = Math.max(esq, dir);
                            const min = Math.min(esq, dir);
                            const deficit = Math.round(((max - min) / max) * 100);
                            newAnswers[`${mId}_deficit`] = `${deficit}%`;
                            
                            // 4-level classification for strength deficit
                            if (deficit <= 10) newAnswers[`${mId}_deficit_res`] = 'Normal';
                            else if (deficit <= 20) newAnswers[`${mId}_deficit_res`] = 'Déficit Leve';
                            else if (deficit <= 30) newAnswers[`${mId}_deficit_res`] = 'Déficit Moderado';
                            else newAnswers[`${mId}_deficit_res`] = 'Déficit Grave';
                        } else {
                            newAnswers[`${mId}_deficit`] = '';
                            newAnswers[`${mId}_deficit_res`] = '';
                        }
                    }
                });

                // RL/RM Ratio Logic (76% threshold)
                if (fieldId === 'forca_rl_esq' || fieldId === 'forca_rm_esq') {
                    const rl = safeParse(newAnswers['forca_rl_esq']);
                    const rm = safeParse(newAnswers['forca_rm_esq']);
                    if (rl > 0 && rm > 0) {
                        const ratio = Math.round((rl / rm) * 100);
                        newAnswers['rl_rm_ratio_esq'] = `${ratio}% - ${ratio >= 76 ? 'Normal' : 'Abaixo'}`;
                    } else {
                        newAnswers['rl_rm_ratio_esq'] = '';
                    }
                }
                if (fieldId === 'forca_rl_dir' || fieldId === 'forca_rm_dir') {
                    const rl = safeParse(newAnswers['forca_rl_dir']);
                    const rm = safeParse(newAnswers['forca_rm_dir']);
                    if (rl > 0 && rm > 0) {
                        const ratio = Math.round((rl / rm) * 100);
                        newAnswers['rl_rm_ratio_dir'] = `${ratio}% - ${ratio >= 76 ? 'Normal' : 'Abaixo'}`;
                    } else {
                        newAnswers['rl_rm_ratio_dir'] = '';
                    }
                }

                // CKCUEST Classification
                if (fieldId === 'ckcuest_esq' || fieldId === 'ckcuest_dir') {
                    const side = fieldId.includes('esq') ? 'esq' : 'dir';
                    const val = safeParse(value);
                    if (val > 0) {
                        if (val >= 25) newAnswers[`ckcuest_res_${side}`] = 'Retorno ao esporte overhead';
                        else if (val >= 21) newAnswers[`ckcuest_res_${side}`] = 'Retorno aos treinos';
                        else newAnswers[`ckcuest_res_${side}`] = 'Abaixo';
                    } else {
                        newAnswers[`ckcuest_res_${side}`] = '';
                    }
                }

                // Fatigue Classification
                if (fieldId === 'fadiga_serratil_esq' || fieldId === 'fadiga_serratil_dir') {
                    const side = fieldId.includes('esq') ? 'esq' : 'dir';
                    const val = safeParse(value);
                    if (val > 0) {
                        newAnswers[`fadiga_serratil_res_${side}`] = val > 109.5 ? 'Normal' : 'Abaixo';
                    } else {
                        newAnswers[`fadiga_serratil_res_${side}`] = '';
                    }
                }

                // ADM Deficits calculation
                const admMoves = ['flexao', 'extensao', 'abd_f', 'rm', 'rl'];
                admMoves.forEach(move => {
                    ['e', 'd'].forEach(side => {
                        const ativaId = `${move}_ativa_${side}`;
                        const passivaId = `${move}_passiva_${side}`;
                        const deficitId = `${move}_deficit_${side}`;
                        
                        if (fieldId === ativaId || fieldId === passivaId) {
                            const ativa = safeParse(newAnswers[ativaId]);
                            const passiva = safeParse(newAnswers[passivaId]);
                            if (passiva > 0 || ativa > 0) {
                                newAnswers[deficitId] = (passiva - ativa) + "°";
                            } else {
                                newAnswers[deficitId] = "";
                            }
                        }
                    });
                });
            }

            if (type === 'afMao') {
                const groups = [
                    ['peri_ant_sup', 'peri_ant_inf', 'peri_punho'],
                    ['flexao_pun_at', 'extensao_pun_at', 'desv_radial_at', 'desv_ulnar_at'],
                    ['flexao_pun_ps', 'extensao_pun_ps', 'desv_radial_ps', 'desv_ulnar_ps'],
                    ['flex_mcf_at', 'ext_mcf_at', 'flex_ifp_at', 'flex_ifd_at', 'oposicao_polegar_at'],
                    ['flex_mcf_ps', 'ext_mcf_ps', 'flex_ifp_ps', 'flex_ifd_ps', 'oposicao_polegar_ps'],
                    ['preensao', 'polpa', 'lateral', 'tripode']
                ];
                groups.flat().forEach(mId => {
                    const esqId = `${mId}_esq`;
                    const dirId = `${mId}_dir`;
                    if (fieldId === esqId || fieldId === dirId) {
                        const esq = parseFloat(String(newAnswers[esqId] || '0').replace(',', '.'));
                        const dir = parseFloat(String(newAnswers[dirId] || '0').replace(',', '.'));
                        if (esq > 0 || dir > 0) {
                            const max = Math.max(esq, dir);
                            const min = Math.min(esq, dir);
                            const deficit = Math.round(((max - min) / max) * 100);
                            newAnswers[`${mId}_def`] = `${deficit}%`;
                            newAnswers[`${mId}_def_res`] = deficit <= 15 ? 'Normal' : 'Reduzido';
                        } else {
                            newAnswers[`${mId}_def`] = '';
                            newAnswers[`${mId}_def_res`] = '';
                        }
                    }
                });
            }

            if (type === 'afGeriatria') {
                const val = safeParse(value);
                if (!isNaN(val)) {
                    if (fieldId === 'pes_juntos') newAnswers['pes_juntos_res'] = val >= 30 ? 'Normal' : 'Abaixo';
                    if (fieldId === 'semi_tandem') newAnswers['semi_tandem_res'] = val >= 30 ? 'Normal' : 'Abaixo';
                    if (fieldId === 'tandem') newAnswers['tandem_res'] = val > 17.56 ? 'Normal' : 'Abaixo';
                    if (fieldId === 'tug') newAnswers['tug_res'] = val < 12.47 ? 'Normal' : 'Abaixo';
                    if (fieldId === 'vel_marcha') newAnswers['vel_marcha_res'] = val >= 0.8 ? 'Normal' : 'Abaixo';
                    if (fieldId === 'preensao_esq' || fieldId === 'preensao_dir') {
                        const threshold = patientGender === 'Feminino' ? 16 : 27;
                        const esqVal = safeParse(newAnswers['preensao_esq']);
                        const dirVal = safeParse(newAnswers['preensao_dir']);
                        if (newAnswers['preensao_esq'] !== undefined && newAnswers['preensao_esq'] !== '') newAnswers['preensao_res_esq'] = esqVal >= threshold ? 'Normal' : 'Abaixo';
                        if (newAnswers['preensao_dir'] !== undefined && newAnswers['preensao_dir'] !== '') newAnswers['preensao_res_dir'] = dirVal >= threshold ? 'Normal' : 'Abaixo';
                    }
                    if (fieldId === 'unipodal_dir') newAnswers['unipodal_dir_res'] = val > 10 ? 'Normal' : 'Abaixo';
                    if (fieldId === 'unipodal_esq') newAnswers['unipodal_esq_res'] = val > 10 ? 'Normal' : 'Abaixo';
                    if (fieldId === 'toques_valor') newAnswers['toques_res'] = val >= 8 ? 'Normal' : 'Abaixo';
                    if (fieldId === 'sentar_levantar') {
                        let threshold = 14.8; 
                        if (patientAge >= 60 && patientAge <= 69) threshold = 11.4;
                        else if (patientAge >= 70 && patientAge <= 79) threshold = 12.6;
                        else if (patientAge < 60) threshold = 11.4; 
                        newAnswers['sentar_levantar_res'] = val < threshold ? 'Normal' : 'Abaixo';
                    }
                }
            }

            if (type === 'afTornozelo') {
                const groups = [['fig8', 'p_perna_tat'], ['flex_pla_at', 'dorsi_at', 'inv_at', 'eve_at'], ['flex_pla_ps', 'dorsi_ps', 'inv_ps', 'eve_ps'], ['wblt'], ['f_pla_tor', 'f_dor_tor', 'f_inv_tor', 'f_eve_tor']];
                groups.flat().forEach(mId => {
                    const esqId = `${mId}_esq`;
                    const dirId = `${mId}_dir`;
                    if (fieldId === esqId || fieldId === dirId) {
                        const esq = parseFloat(String(newAnswers[esqId] || '0').replace(',', '.'));
                        const dir = parseFloat(String(newAnswers[dirId] || '0').replace(',', '.'));
                        if (esq > 0 || dir > 0) {
                            const max = Math.max(esq, dir);
                            const min = Math.min(esq, dir);
                            const deficit = Math.round(((max - min) / max) * 100);
                            newAnswers[`${mId}_def`] = `${deficit}%`;
                            
                            // Classification for Strength (f_*_tor)
                            if (mId.startsWith('f_') && mId.endsWith('_tor')) {
                                if (deficit <= 10) newAnswers[`${mId}_res`] = 'Simetria funcional';
                                else if (deficit > 15) newAnswers[`${mId}_res`] = 'Risco funcional aumentado';
                                else newAnswers[`${mId}_res`] = '---';
                            } else {
                                newAnswers[`${mId}_def_res`] = deficit <= 15 ? 'Normal' : 'Reduzido';
                            }
                        } else {
                            newAnswers[`${mId}_def`] = '';
                            newAnswers[`${mId}_def_res`] = '';
                            if (mId.startsWith('f_') && mId.endsWith('_tor')) {
                                newAnswers[`${mId}_res`] = '';
                            }
                        }
                    }
                });

                const esq = Number(newAnswers['slhrt_esq']);
                const dir = Number(newAnswers['slhrt_dir']);
                if (esq > 0 || dir > 0) {
                    const classify = (v: number) => v >= 25 ? "Adequado (≥25)" : v >= 20 ? "Limítrofe (20-24)" : v >= 15 ? "Déficit Moderado (15-19)" : "Déficit Importante (<15)";
                    const diff = Math.abs(esq - dir);
                    const max = Math.max(esq, dir);
                    const pctDiff = max > 0 ? (diff / max) * 100 : 0;
                    const isAsymmetric = diff > 5 || pctDiff > 10;
                    newAnswers['slhrt_class'] = `ESQUERDO: ${esq > 0 ? classify(esq) : "Não realizado"}\nDIREITO: ${dir > 0 ? classify(dir) : "Não realizado"}\nAssimetria Significativa: ${isAsymmetric ? "SIM" : "NÃO"} (${diff} reps / ${pctDiff.toFixed(1)}%)`;
                } else newAnswers['slhrt_class'] = '';

                const wesq = safeParse(newAnswers['wblt_esq']);
                const wdir = safeParse(newAnswers['wblt_dir']);
                if (wesq > 0 || wdir > 0) {
                    const classify = (v: number) => v >= 25 ? "Adequado" : v >= 20 ? "Limítrofe" : v >= 15 ? "Moderado" : "Importante";
                    const diff = Math.abs(wesq - wdir);
                    const max = Math.max(wesq, wdir);
                    const pctDiff = max > 0 ? (diff / max) * 100 : 0;
                    const isAsymmetric = diff > 5 || pctDiff > 10;
                    
                    const resE = wesq > 0 ? classify(wesq) : "-";
                    const resD = wdir > 0 ? classify(wdir) : "-";
                    newAnswers['wblt_res'] = `${resE} / ${resD}${isAsymmetric ? ' (Risco)' : ''}`;
                } else newAnswers['wblt_res'] = '';

                if (fieldId === 'ybt_esq' || fieldId === 'ybt_dir') {
                    const yesq = parseFloat(String(newAnswers['ybt_esq'] || '0').replace(',', '.'));
                    const ydir = parseFloat(String(newAnswers['ybt_dir'] || '0').replace(',', '.'));
                    if (yesq > 0 || ydir > 0) newAnswers['ybt_diff'] = `${Math.abs(yesq - ydir).toFixed(1)}%`;
                    else newAnswers['ybt_diff'] = '';
                }
            }

            if (type === 'afMmii') {
                const mmiiMovements = ['f_abd_q', 'f_ext_q', 'f_ext_j', 'f_flex_j', 'f_flex_j_p'];
                mmiiMovements.forEach(mId => {
                    if (fieldId === `${mId}_esq` || fieldId === `${mId}_dir`) {
                        const esq = safeParse(newAnswers[`${mId}_esq`]);
                        const dir = safeParse(newAnswers[`${mId}_dir`]);
                        if (esq > 0 || dir > 0) {
                            const max = Math.max(esq, dir);
                            const min = Math.min(esq, dir);
                            const deficit = Math.round(((max - min) / max) * 100);
                            newAnswers[`${mId}_def`] = `${deficit}%`;
                            
                            // Detailed classification
                            if (deficit <= 10) newAnswers[`${mId}_res`] = 'Normal';
                            else if (deficit <= 20) newAnswers[`${mId}_res`] = 'Déficit Leve';
                            else if (deficit <= 30) newAnswers[`${mId}_res`] = 'Déficit Moderado';
                            else newAnswers[`${mId}_res`] = 'Déficit Grave';
                        } else {
                            newAnswers[`${mId}_def`] = '';
                            newAnswers[`${mId}_res`] = '';
                        }
                    }
                });

                // Endurance Percentage Calculation (Sorensen / Flexão 60º)
                if (fieldId === 'sorensen' || fieldId === 'flexao_60') {
                    const val = safeParse(newAnswers[fieldId]);
                    if (!isNaN(val) && val > 0) {
                        const threshold = getEnduranceThreshold({ testId: fieldId, gender: patientGender, age: patientAge, activityLevel: patientActivityLevel });
                        if (threshold > 0) {
                            const pct = Math.round(((val / threshold) - 1) * 100);
                            newAnswers[`${fieldId}_pct`] = `${pct > 0 ? '+' : ''}${pct}%`;
                            newAnswers[`${fieldId}_res`] = pct >= 0 ? 'Normal' : 'Reduzido';
                        }
                    } else {
                        newAnswers[`${fieldId}_pct`] = '';
                        newAnswers[`${fieldId}_res`] = '';
                    }
                }

                // Relação I/Q Logic
                const relIQFields = ['f_ext_j', 'f_flex_j', 'f_flex_j_p'];
                if (relIQFields.some(f => fieldId.startsWith(f))) {
                    ['esq', 'dir'].forEach(side => {
                        const ext = safeParse(newAnswers[`f_ext_j_${side}`]);
                        const flexValue = safeParse(newAnswers[`f_flex_j_${side}`]) || safeParse(newAnswers[`f_flex_j_p_${side}`]);
                        if (ext > 0 && flexValue > 0) {
                            const ratio = (flexValue / ext);
                            const ratioPercent = Math.round(ratio * 100);
                            // Reference 0.45 - 0.60
                            const status = (ratio >= 0.45 && ratio <= 0.60) ? 'Normal' : 'Desequilíbrio';
                            newAnswers[`rel_iq_${side}`] = `${ratioPercent}% - ${status}`;
                        } else {
                            newAnswers[`rel_iq_${side}`] = '';
                        }
                    });
                }

                if (fieldId === 'ybt_esq' || fieldId === 'ybt_dir') {
                    const esq = safeParse(newAnswers['ybt_esq']);
                    const dir = safeParse(newAnswers['ybt_dir']);
                    if (esq > 0 || dir > 0) newAnswers['ybt_diff'] = `${Math.abs(esq - dir).toFixed(1)}%`;
                    else newAnswers['ybt_diff'] = '';
                }

            }

            // Step Down Test Calculation (Shared between afMmii and afTornozelo)
            if (type === 'afMmii' || type === 'afTornozelo') {
                const sdCriteria = ['sd_pelvis', 'sd_knee'];
                if (sdCriteria.some(c => fieldId.startsWith(c))) {
                    ['e', 'd'].forEach(side => {
                        sdCriteria.forEach(c => {
                            const rawVal = safeParse(newAnswers[`${c}_${side}`]);
                            let point = 0;
                            if (c === 'sd_knee') {
                                // Valgo dinâmico: 8°±5 (Normal: 3-13)
                                if (rawVal > 1) point = (rawVal < 3 || rawVal > 13) ? 1 : 0;
                                else point = rawVal;
                            } else if (c === 'sd_pelvis') {
                                // Queda pélvica: 10°±5 (Normal: 5-15)
                                if (rawVal > 1) point = (rawVal < 5 || rawVal > 15) ? 1 : 0;
                                else point = rawVal;
                            }
                            
                            // Set individual row result for the 5-column table
                            const rowResKey = `${c}_res_${side}`;
                            if (newAnswers[`${c}_${side}`] !== undefined && newAnswers[`${c}_${side}`] !== '') {
                                newAnswers[rowResKey] = point === 0 ? 'Normal' : 'Alterado';
                            } else {
                                newAnswers[rowResKey] = '';
                            }
                        });
                    });
                }
            }

            if (type === 'afLombar') {
                const val = parseFloat(String(value).replace(',', '.'));
                const enduranceTests = ['flexao_60', 'sorensen', 'prancha', 'prancha_lat_esq', 'prancha_lat_dir'];
                
                if (!isNaN(val) && enduranceTests.includes(fieldId)) {
                    const threshold = getEnduranceThreshold({ testId: fieldId, gender: patientGender, age: patientAge, activityLevel: patientActivityLevel });
                    if (threshold > 0) {
                        newAnswers[`${fieldId}_res`] = val >= threshold ? 'Normal' : 'Reduzido';
                        const pct = Math.round(((val / threshold) - 1) * 100);
                        newAnswers[`${fieldId}_pct`] = `${pct > 0 ? '+' : ''}${pct}%`;
                    } else {
                        newAnswers[`${fieldId}_res`] = '---';
                        newAnswers[`${fieldId}_pct`] = '---';
                    }
                }

                // Hip Dynamometry (kgF)
                const hipForceFields = ['f_flex_q', 'f_abd_q', 'f_ext_q'];
                if (hipForceFields.some(f => fieldId.startsWith(f)) && fieldId.endsWith('_lom')) {
                    const baseField = hipForceFields.find(f => fieldId.startsWith(f));
                    if (baseField) {
                        const esq = parseFloat(String(newAnswers[`${baseField}_esq_lom`]).replace(',', '.'));
                        const dir = parseFloat(String(newAnswers[`${baseField}_dir_lom`]).replace(',', '.'));
                        
                        const ref = getMuscleStrengthReference(baseField, patientGender, patientAge, patientActivityLevel);
                        
                        if (!isNaN(esq) && esq > 0) {
                            newAnswers[`${baseField}_esq_res_lom`] = esq >= ref ? 'Normal' : 'Reduzido';
                        } else {
                            newAnswers[`${baseField}_esq_res_lom`] = '';
                        }
                        
                        if (!isNaN(dir) && dir > 0) {
                            newAnswers[`${baseField}_dir_res_lom`] = dir >= ref ? 'Normal' : 'Reduzido';
                        } else {
                            newAnswers[`${baseField}_dir_res_lom`] = '';
                        }

                        if (!isNaN(esq) && !isNaN(dir) && (esq > 0 || dir > 0)) {
                            const maxVal = Math.max(esq, dir);
                            const deficit = Math.round(Math.abs((esq - dir) / maxVal) * 100);
                            newAnswers[`${baseField}_def_lom`] = `${deficit}%`;
                        } else {
                            newAnswers[`${baseField}_def_lom`] = '';
                        }
                    }
                }
            }

            if (type === 'afCervical') {
                const val = parseFloat(String(value).replace(',', '.'));
                if (!isNaN(val)) {
                    if (fieldId === 'resist_flexora') {
                        const threshold = getEnduranceThreshold({ testId: 'resist_flexora', gender: patientGender, age: patientAge, activityLevel: patientActivityLevel });
                        if (threshold > 0) {
                            newAnswers['resist_flexora_res'] = val >= threshold ? 'Normal' : 'Reduzido';
                            const pct = Math.round(((val / threshold) - 1) * 100);
                            newAnswers['resist_flexora_pct'] = `${pct > 0 ? '+' : ''}${pct}%`;
                        }
                    }
                    if (fieldId === 'resist_extensora') {
                        const threshold = getEnduranceThreshold({ testId: 'resist_extensora', gender: patientGender, age: patientAge, activityLevel: patientActivityLevel });
                        if (threshold > 0) {
                            newAnswers['resist_extensora_res'] = val >= threshold ? 'Normal' : 'Reduzido';
                            const pct = Math.round(((val / threshold) - 1) * 100);
                            newAnswers['resist_extensora_pct'] = `${pct > 0 ? '+' : ''}${pct}%`;
                        }
                    }
                }
            }

            return newAnswers;
        });
    }, [isEditing, type, patientGender, patientAge, patientActivityLevel, fieldMap]);

    const handleFinish = async () => {
        setSaving(true);
        const result = assessmentService.calculateResult(type, answers, questionnaire, { 
            gender: patientGender, 
            age: patientAge, 
            activityLevel: patientActivityLevel 
        });
        
        // Generate Audit Logs
        const logEntries: string[] = [];
        if (assessmentId) {
            Object.keys(answers).forEach(key => {
                if (key.startsWith('_')) return;
                const oldVal = originalAnswers[key];
                const newVal = answers[key];
                if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                    const field = fieldMap[key];
                    const label = field ? field.label : key;
                    logEntries.push(`Alterado "${label}": de "${oldVal || 'vazio'}" para "${newVal || 'vazio'}"`);
                }
            });
        }

        const response = await assessmentService.saveOrUpdate({
            id: assessmentId,
            patientId,
            type,
            segment: questionnaire.segment,
            answers,
            isFinished: true,
            result,
            userId: user?.id,
            logEntries
        });

        if (response.success) {
            setIsFinished(true);
            setIsDirty(false);
            if (assessmentId) {
                setOriginalAnswers({ ...answers });
                setIsEditing(false);
            }
            toast.success(assessmentId ? "Alterações salvas com sucesso!" : "Avaliação salva com sucesso!");
            
            const returnTo = searchParams.get("returnTo");
            if ((response as any).id && !assessmentId) {
                router.replace(`/dashboard/assessment/${patientId}/${type}?id=${(response as any).id}${returnTo ? `&returnTo=${returnTo}` : ""}`, { scroll: false });
            }
            
            if (returnTo) {
                const scoreValue = result.percentage !== undefined ? `${result.percentage}%` : `${result.score} pts`;
                let scoreKey = (type === "ndi" || type === "oswestry" || type === "quickdash") ? `${type}_score` : "score";
                localStorage.setItem(`return_score_${patientId}_${returnTo}_${scoreKey}`, scoreValue);
                localStorage.setItem(`return_score_${patientId}_${returnTo}`, scoreValue);
            }

            await localforage.removeItem(`assessment_draft_${patientId}_${type}`);
        } else {
            toast.error(assessmentId ? "Erro ao atualizar avaliação." : "Erro ao salvar avaliação.");
        }
        setSaving(false);
    };

    const handleHeaderAction = (action: any, columnIndex: number, section: any) => {
        if (action.type === 'fill') {
            setIsDirty(true);
            setAnswers(prev => {
                const newAnswers = { ...prev };
                section.rows?.forEach((row: any) => {
                    const field = row.fields[columnIndex - 1];
                    if (field) {
                        const fieldId = typeof field === 'string' ? field : field.id;
                        newAnswers[fieldId] = action.value;
                    }
                });
                return { ...newAnswers, _lastModified: Date.now() };
            });
            toast.info(`Coluna preenchida com ${action.value}`);
        }
    };

    const handleReturn = () => {
        const result = assessmentService.calculateResult(type, answers, questionnaire);
        const returnTo = searchParams.get("returnTo");

        if (returnTo && result) {
            const mmiiMapping: Record<string, string> = { lysholm: 'lysholm_score', womac: 'womac_score', ikdc: 'ikdc_score', aofas: 'aofas_score' };
            const geriatricMapping: Record<string, string> = { man: 'man_score', ves13: 'ves13_score', lbpq: 'lbpq_score', brief: 'brief_score' };
            const fieldKey = geriatricMapping[type] || mmiiMapping[type];

            if (fieldKey) {
                const scoreStr = result.percentage !== undefined ? `${result.percentage}% — ${result.interpretation}` : `${result.score} pts — ${result.interpretation}`;
                localStorage.setItem(`return_score_${patientId}_${returnTo}_${fieldKey}`, scoreStr);
                localStorage.setItem(`return_score_${patientId}_${returnTo}`, returnTo === 'afGeriatria' ? 'geriatria' : 'mmii');
            } else {
                localStorage.setItem(`return_score_${patientId}_${returnTo}`, String(result.percentage));
            }
            router.push(`/dashboard/assessment/${patientId}/${returnTo}?returnTo=${type}`);
        } else {
            router.push(`/dashboard/patient/${patientId}`);
        }
    };

    const handleExit = () => {
        if (isDirty && isEditing && !isFinished) {
            setShowExitModal(true);
        } else {
            handleReturn();
        }
    };

    const confirmExitDiscard = async () => {
        const draftKey = `assessment_draft_${patientId}_${type}`;
        const checkpointKey = `checkpoint_${patientId}_${type}`;
        await localforage.removeItem(draftKey);
        await localforage.removeItem(checkpointKey);
        setIsDirty(false);
        setShowExitModal(false);
        handleReturn();
    };

    const confirmExitSave = () => {
        // Draft is already auto-saving by effect, so we just exit
        setIsDirty(false);
        setShowExitModal(false);
        handleReturn();
    };

    return {
        currentIdx, setCurrentIdx,
        answers, setAnswers,
        originalAnswers,
        isFinished, setIsFinished,
        saving,
        isEditing, setIsEditing,
        showLogs, setShowLogs,
        changeLogs,
        user,
        assessmentOwner,
        assessmentOwnerId,
        assessmentDate,
        patientName,
        patientGender,
        patientAge,
        patientActivityLevel,
        patientAssessments,
        selectedImage, setSelectedImage,
        showDraftModal, setShowDraftModal,
        showExitModal, setShowExitModal,
        pendingDraft,
        dynamoModal, setDynamoModal,
        dynamoValues, setDynamoValues,
        ybtModal, setYbtModal,
        ybtValues, setYbtValues,
        posturalModal, setPosturalModal,
        isDirty, setIsDirty,
        activeFlags,
        isPrint,
        handleRecoverDraft,
        handleDiscardDraft,
        handleSelect,
        handleAnalyzeImage,
        handleSavePosturalAnalysis,
        handleInputChange,
        handleFinish,
        handleHeaderAction,
        handleReturn,
        handleExit,
        confirmExitDiscard,
        confirmExitSave,
        questionnaire,
        type
    };
}
