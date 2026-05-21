/**
 * Utility for calculating assessment scores based on various medical scales.
 */

export type CalculationType = 
    | 'sum' 
    | 'percentage' 
    | 'quickdash' 
    | 'oswestry' 
    | 'ndi' 
    | 'man' 
    | 'ves13' 
    | 'lbpq' 
    | 'brief' 
    | 'lysholm'
    | 'womac'
    | 'ikdc'
    | 'aofas'
    | 'afCotovelo'
    | 'afMao'
    | 'afSensibilidade'
    | 'afAnaliseAngular'
    | 'afOrientacao'
    | 'mmii';

export interface CalculationResult {
    score: number | string;
    max: number | string;
    percentage: number;
    interpretation: string;
    unit: string;
    details?: Record<string, any>;
}

// Normative data for Muscle Endurance (seconds)
const NORMATIVE_DATA: Record<string, any> = {
    neck_flexor: {
        men: [
            { ageRange: [20, 40], mean: 38.4 },
            { ageRange: [41, 60], mean: 38.1 },
            { ageRange: [61, 80], mean: 40.9 }
        ],
        women: [
            { ageRange: [20, 40], mean: 23.1 },
            { ageRange: [41, 60], mean: 36.2 },
            { ageRange: [61, 80], mean: 28.5 }
        ]
    },
    lumbar_flexor: {
        men: [
            { ageRange: [18, 40], mean: 233.9 },
            { ageRange: [41, 99], mean: 108.2 }
        ],
        women: [
            { ageRange: [18, 40], mean: 233.9 },
            { ageRange: [41, 99], mean: 108.2 }
        ]
    },
    sorensen: {
        men: [
            { ageRange: [18, 40], mean: 181.1 },
            { ageRange: [41, 65], mean: 84.9 },
            { ageRange: [66, 99], mean: 84.9 }
        ],
        women: [
            { ageRange: [18, 40], mean: 171.9 },
            { ageRange: [41, 65], mean: 88.2 },
            { ageRange: [66, 99], mean: 88.2 }
        ]
    },
    flexao_60: {
        men: [
            { ageRange: [18, 40], mean: 181.1 },
            { ageRange: [41, 65], mean: 84.9 },
            { ageRange: [66, 99], mean: 84.9 }
        ],
        women: [
            { ageRange: [18, 40], mean: 171.9 },
            { ageRange: [41, 65], mean: 88.2 },
            { ageRange: [66, 99], mean: 88.2 }
        ]
    }
};

export function calculateAssessmentScore(type: CalculationType, answers: Record<string, any>, profile?: { gender?: string, age?: number, activityLevel?: string }): CalculationResult {
    // Filter answers where keys are numeric indices (0, 1, 2...) and values are numeric or string-numbers
    const values = Object.entries(answers)
        .filter(([k, v]) => !isNaN(Number(k)) && v !== undefined && v !== "" && typeof v !== 'boolean')
        .map(([_, v]) => Number(v))
        .filter(v => !isNaN(v));
    
    const n = values.length;
    const sum = values.reduce((a, b) => a + b, 0);

    switch (type) {
        case 'oswestry':
        case 'ndi': {
            if (n === 0) return emptyResult();
            // User requested to consider skipped questions in the calculation.
            // Proportional scoring: (Sum / (AnsweredQuestions * 5)) * 100
            const maxPossible = n * 5;
            const percentage = Math.round((sum / maxPossible) * 100);
            
            let interpretation = '';
            if (type === 'oswestry') {
                if (percentage <= 20) interpretation = 'Incapacidade Mínima';
                else if (percentage <= 40) interpretation = 'Incapacidade Moderada';
                else if (percentage <= 60) interpretation = 'Incapacidade Intensa (Severa)';
                else if (percentage <= 80) interpretation = 'Incapacidade Devastadora';
                else interpretation = 'Paciente Restrito ao Leito';
            } else {
                // Official NDI cutoffs: 0-4 (0-8%) None, 5-14 (10-28%) Mild, 15-24 (30-48%) Moderate, 25-34 (50-68%) Severe, 35+ (70-100%) Complete
                if (percentage <= 8) interpretation = 'Sem Deficiência';
                else if (percentage <= 28) interpretation = 'Deficiência Leve';
                else if (percentage <= 48) interpretation = 'Deficiência Moderada';
                else if (percentage <= 68) interpretation = 'Deficiência Severa';
                else interpretation = 'Deficiência Completa';
            }

            return { score: sum, max: maxPossible, percentage, interpretation, unit: '%' };
        }

        case 'quickdash': {
            // QuickDASH requires at least 10 answered questions
            if (n < 10) return { score: 0, max: 100, percentage: 0, interpretation: 'Mínimo de 10 respostas obrigatórias', unit: '%' };
            
            const score = ((sum / n) - 1) * 25;
            const rounded = Math.round(score * 10) / 10;
            
            return {
                score: rounded,
                max: 100,
                percentage: rounded,
                interpretation: rounded <= 20 ? 'Excelente' : rounded <= 40 ? 'Bom' : rounded <= 60 ? 'Regular' : 'Ruim / Incapacidade Severa',
                unit: '%'
            };
        }

        case 'lbpq': {
            // Roland-Morris (0-24)
            if (n === 0) return emptyResult();
            const percentage = Math.round((sum / 24) * 100);
            let interpretation = '';
            if (sum <= 4) interpretation = 'Incapacidade Mínima';
            else if (sum <= 8) interpretation = 'Incapacidade Leve';
            else if (sum <= 14) interpretation = 'Incapacidade Moderada';
            else if (sum <= 20) interpretation = 'Incapacidade Severa';
            else interpretation = 'Incapacidade Muito Severa';

            return { score: sum, max: 24, percentage, interpretation, unit: ' pontos' };
        }

        case 'lysholm': {
            // Lysholm (0-100)
            if (n === 0) return emptyResult();
            const interpretation = sum >= 95 ? 'Excelente' : sum >= 84 ? 'Bom' : sum >= 65 ? 'Regular' : 'Ruim';
            return { score: sum, max: 100, percentage: sum, interpretation, unit: ' pontos' };
        }

        case 'womac': {
            // WOMAC (0-96) - Higher is worse
            if (n === 0) return emptyResult();
            const max = 96;
            const percentage = Math.round((sum / max) * 100);
            let interpretation = '';
            // Scale: 0-20 Excelente, 21-40 Bom, 41-70 Regular, >70 Ruim
            if (percentage <= 20) interpretation = 'Excelente (Pouco impacto)';
            else if (percentage <= 40) interpretation = 'Bom (Impacto leve)';
            else if (percentage <= 70) interpretation = 'Regular';
            else interpretation = 'Ruim (Impacto severo)';

            return { score: sum, max, percentage, interpretation, unit: ' pts (quanto maior, pior)' };
        }

        case 'ikdc': {
            // IKDC Subjective Knee Evaluation (0-87 raw -> scaled to 0-100)
            if (n === 0) return emptyResult();
            const maxRaw = 87;
            const percentage = Math.round((sum / maxRaw) * 100);
            let interpretation = '';
            if (percentage >= 90) interpretation = 'Excelente (Função normal)';
            else if (percentage >= 70) interpretation = 'Bom (Limitação leve)';
            else if (percentage >= 50) interpretation = 'Regular';
            else interpretation = 'Ruim (Incapacidade grave)';

            return { score: sum, max: maxRaw, percentage, interpretation, unit: ' pontos' };
        }

        case 'aofas': {
            // AOFAS Ankle-Hindfoot Scale (0-100)
            const aofasKeys = [
                'aofas_dor', 'aofas_limitacao', 'aofas_distancia', 'aofas_superficie', 
                'aofas_marcha', 'aofas_sagital', 'aofas_retrope', 'aofas_estabilidade', 'aofas_alinhamento'
            ];
            
            let localSum = 0;
            let answeredCount = 0;
            aofasKeys.forEach(key => {
                if (answers[key] !== undefined && answers[key] !== "") {
                    localSum += Number(answers[key]);
                    answeredCount++;
                }
            });

            // If no explicit IDs found, use the generic sum from numeric keys (legacy)
            const finalSum = answeredCount > 0 ? localSum : sum;
            const finalN = answeredCount > 0 ? answeredCount : n;

            if (finalN === 0) return emptyResult();
            
            const max = 100;
            const percentage = Math.round((finalSum / max) * 100);
            let interpretation = '';
            if (percentage >= 90) interpretation = 'Excelente';
            else if (percentage >= 80) interpretation = 'Bom';
            else if (percentage >= 70) interpretation = 'Regular';
            else interpretation = 'Ruim';

            return { score: finalSum, max, percentage, interpretation, unit: ' pontos' };
        }

        case 'afCotovelo':
        case 'afMao':
        case 'afSensibilidade':
        case 'afAnaliseAngular':
        case 'afOrientacao':
        case 'mmii': {
            // Clinical assessments return completion status and calculated deficits in details
            const results: Record<string, any> = {};
            
            const interpretationMap: Record<string, string> = {
                afMao: 'Mão',
                afCotovelo: 'Cotovelo',
                mmii: 'MMII',
                afSensibilidade: 'Sensibilidade',
                afAnaliseAngular: 'Análise Angular',
                afOrientacao: 'Orientação'
            };

            const label = interpretationMap[type] || 'Clínica';
            
            // Helper for deficit calculation
            const calcDeficit = (e: any, d: any) => {
                const esq = parseFloat(e);
                const dir = parseFloat(d);
                if (!isNaN(esq) && !isNaN(dir) && Math.max(esq, dir) > 0) {
                    return (Math.abs(((esq - dir) / Math.max(esq, dir)) * 100)).toFixed(1) + '%';
                }
                return null;
            };

            // Force/Grip Tests (Hand specific usually)
            if (type === 'afMao') {
                const tests = ['preensao', 'polpa', 'lateral', 'tripode'];
                tests.forEach(t => {
                    const def = calcDeficit(answers[`${t}_esq`], answers[`${t}_dir`]);
                    if (def) results[t] = { deficit: def };
                });
            }

            // MMII specific force/perimetry
            if (type === 'mmii') {
                ['p_joe', 'p_cox'].forEach(t => {
                    const def = calcDeficit(answers[`${t}_esq`], answers[`${t}_dir`]);
                    if (def) results[`${t}_def`] = def;
                });

                ['f_flex_q', 'f_abd_q', 'f_ext_q', 'f_ext_j', 'f_flex_j', 'f_flex_j_p'].forEach(t => {
                    const def = calcDeficit(answers[`${t}_esq`], answers[`${t}_dir`]);
                    if (def) {
                        results[`${t}_def`] = def;
                        const defNum = parseFloat(def.replace('%', ''));
                        const status = defNum < 15 ? 'NORMAL' : 'DÉFICIT';
                        results[`${t}_res`] = `${def} - ${status}`;
                    }
                });

                // Relação IQ (Sentado)
                const flexE = parseFloat(answers['f_flex_j_esq']);
                const extE = parseFloat(answers['f_ext_j_esq']);
                const flexD = parseFloat(answers['f_flex_j_dir']);
                const extD = parseFloat(answers['f_ext_j_dir']);

                let statusE = '';
                let statusD = '';

                if (flexE > 0 && extE > 0) {
                    const ratioE = flexE / extE;
                    results['rel_iq_esq'] = ratioE.toFixed(2);
                    statusE = (ratioE >= 0.45 && ratioE <= 0.60) ? 'NORMAL' : 'DÉFICIT';
                }

                if (flexD > 0 && extD > 0) {
                    const ratioD = flexD / extD;
                    results['rel_iq_dir'] = ratioD.toFixed(2);
                    statusD = (ratioD >= 0.45 && ratioD <= 0.60) ? 'NORMAL' : 'DÉFICIT';
                }

                if (statusE || statusD) {
                    if (statusE === 'DÉFICIT' || statusD === 'DÉFICIT') {
                        results['rel_iq_res'] = 'DÉFICIT';
                    } else {
                        results['rel_iq_res'] = 'NORMAL';
                    }
                }

                // YBT Asymmetry
                const ybtE = parseFloat(answers['ybt_esq']);
                const ybtD = parseFloat(answers['ybt_dir']);
                if (!isNaN(ybtE) && !isNaN(ybtD)) {
                    results['ybt_diff'] = Math.abs(ybtE - ybtD).toFixed(1);
                }

                // Step Down Test Calculation
                const sdE = (parseInt(answers['sd_arm_e']) || 0) + (parseInt(answers['sd_trunk_e']) || 0) + (parseInt(answers['sd_pelvis_e']) || 0) + (parseInt(answers['sd_knee_e']) || 0) + (parseInt(answers['sd_unstead_e']) || 0);
                const sdD = (parseInt(answers['sd_arm_d']) || 0) + (parseInt(answers['sd_trunk_d']) || 0) + (parseInt(answers['sd_pelvis_d']) || 0) + (parseInt(answers['sd_knee_d']) || 0) + (parseInt(answers['sd_unstead_d']) || 0);
                if (sdE > 0) results['sd_result_esq'] = sdE;
                if (sdD > 0) results['sd_result_dir'] = sdD;

                // Endurance Percentages
                if (answers['sorensen_pct']) results['sorensen_pct'] = answers['sorensen_pct'];
                if (answers['flexao_60_pct']) results['flexao_60_pct'] = answers['flexao_60_pct'];
            }

            return {
                score: 'Concluído',
                max: '-',
                percentage: 100,
                interpretation: `Avaliação ${label} Finalizada`,
                unit: '',
                details: results
            };
        }

        case 'man': {
            // Mini Avaliação Nutricional (max 30)
            if (n === 0) return emptyResult();
            const percentage = Math.round((sum / 30) * 100);
            let interpretation = '';
            if (sum >= 24) interpretation = 'Estado Nutricional Normal';
            else if (sum >= 17) interpretation = 'Risco de Desnutrição';
            else interpretation = 'Desnutrido';

            return { score: sum, max: 30, percentage, interpretation, unit: ' pontos' };
        }

        case 'ves13': {
            // Vulnerable Elders Survey
            // This one has complex logic based on indices, but we'll approximate 
            // the sum approach if stored correctly in options.
            // In the data.js, it caps physLimit at 2 and disability at 4.
            // We'll trust the sum if the options were mapped with these values.
            if (n === 0) return emptyResult();
            const max = 10;
            const percentage = Math.round((sum / max) * 100);
            let interpretation = '';
            if (sum <= 2) interpretation = 'Idoso Robusto (não vulnerável)';
            else if (sum <= 6) interpretation = 'Risco de Fragilização';
            else interpretation = 'Idoso Vulnerável (alto risco)';

            return { score: sum, max, percentage, interpretation, unit: ' pontos' };
        }

        case 'brief': {
            // BPI-SF
            // Severity: avg of indices 1-4 | Interference: avg of indices 6-12
            // We assume indices match or we use keys.
            const keys = Object.keys(answers).map(Number).sort((a,b) => a-b);
            const severityVals = keys.filter(k => k >= 1 && k <= 4).map(k => answers[k]).filter(v => v !== undefined && v !== "" && typeof v !== 'boolean' && !isNaN(Number(v))).map(Number);
            const interferenceVals = keys.filter(k => k >= 6 && k <= 12).map(k => answers[k]).filter(v => v !== undefined && v !== "" && typeof v !== 'boolean' && !isNaN(Number(v))).map(Number);
            
            const severityScore = severityVals.length > 0 ? (severityVals.reduce((a,b) => a+b, 0) / severityVals.length) : 0;
            const interferenceScore = interferenceVals.length > 0 ? (interferenceVals.reduce((a,b) => a+b, 0) / interferenceVals.length) : 0;
            
            const s = Math.round(severityScore * 10) / 10;
            const i = Math.round(interferenceScore * 10) / 10;
            
            const getLevel = (v: number) => v <= 3 ? 'Leve' : v <= 6 ? 'Moderada' : 'Severa';
            
            return {
                score: s,
                max: 10,
                percentage: s * 10,
                interpretation: `Severidade: ${s}/10 (${getLevel(s)}) | Interferência: ${i}/10 (${getLevel(i)})`,
                unit: ' (Média Sev.)',
                details: { severity: s, interference: i }
            };
        }

        case 'sum': 
        default: {
            if (n === 0) return emptyResult();
            
            // Collect any clinical percentages from answers for summary
            const clinicalDetails: Record<string, any> = {};
            Object.keys(answers).forEach(k => {
                if (k.endsWith('_pct') || k.endsWith('_res')) {
                    clinicalDetails[k] = answers[k];
                }
            });

            return {
                score: sum,
                max: '-',
                percentage: 0,
                interpretation: 'Cálculo concluído',
                unit: '',
                details: clinicalDetails
            };
        }
    }
}

function emptyResult(): CalculationResult {
    return { score: 0, max: 0, percentage: 0, interpretation: 'Nenhuma resposta', unit: '' };
}
