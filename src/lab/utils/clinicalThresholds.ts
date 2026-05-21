/**
 * Utility to calculate clinical endurance thresholds based on gender, age, and activity level.
 * Reference values provided by Clinician/User.
 */

export type Gender = 'Masculino' | 'Feminino' | string;
export type ActivityLevel = 'Ativo' | 'Inativo' | 'Sedentário' | string;

export interface ThresholdParams {
    testId: string;
    gender: Gender;
    age: number;
    activityLevel?: ActivityLevel;
}

export function getEnduranceThreshold({ testId, gender, age, activityLevel = 'Inativo' }: ThresholdParams): number {
    const isMale = gender === 'Masculino';
    const isActive = activityLevel === 'Ativo';
    const isYoung = age <= 40;

    // Cervical Flexor Endurance Test
    if (testId === 'resist_flexora') {
        return isMale ? 56 : 23;
    }

    // Deep Neck Extensor Endurance Test (NEET)
    if (testId === 'resist_extensora') {
        return isMale ? 157 : 173;
    }

    // Lumbar Extensor Endurance (Sorensen)
    if (testId === 'sorensen' || testId === 'res_sorensen') {
        if (isMale) {
            if (isYoung) return isActive ? 194 : 167;
            return isActive ? 100 : 69;
        } else {
            if (isYoung) return isActive ? 182 : 161;
            return isActive ? 93 : 82;
        }
    }

    // Lumbar Flexor Endurance (60º Isometry)
    if (testId === 'flexao_60' || testId === 'res_flexao_60') {
        if (isMale) {
            if (isYoung) return isActive ? 284 : 219;
            return isActive ? 133 : 106;
        } else {
            if (isYoung) return isActive ? 254 : 213;
            return isActive ? 110 : 105;
        }
    }

    // Shoulder Fatigue (Serratus Anterior)
    if (testId === 'fadiga_serratil') {
        return 109.5;
    }

    // Plank (Frontal Core Stability)
    if (testId === 'prancha') {
        if (age < 20) return 60;
        if (age <= 39) return 45;
        if (age <= 49) return 50;
        if (age <= 59) return 40;
        return 20;
    }

    // Side Plank (Lateral Stability)
    if (testId === 'prancha_lat_esq' || testId === 'prancha_lat_dir') {
        if (age <= 39) return 45;
        if (age <= 59) return 30;
        return 15;
    }

    // Geriatric Thresholds
    if (testId === 'pes_juntos' || testId === 'semi_tandem') return 30;
    if (testId === 'tandem') return 17.56;
    if (testId === 'unipodal_dir' || testId === 'unipodal_esq' || testId === 'unipodal') return 10;
    if (testId === 'tug') return 12.47;
    if (testId === 'vel_marcha') return 0.8;
    if (testId === 'preensao') return isMale ? 27 : 16;
    if (testId === 'sentar_levantar') return 12; // Generic geriatric cutoff for 5x Sit-to-Stand

    return 0; // Default fallback
}

/**
 * Specifically for geriatrics, determines if a value is "clinicaly suspicious" (Yellow)
 */
export function isValueBelowStandard(testId: string, value: number, gender?: Gender, age?: number): boolean {
    if (isNaN(value) || value === 0) return false;

    if (testId === 'pes_juntos' || testId === 'semi_tandem') return value < 30;
    if (testId === 'tandem') return value < 17.56;
    if (testId.includes('unipodal')) return value < 10;
    if (testId === 'tug') return value > 12.47; // For TUG, higher is worse
    if (testId === 'vel_marcha') return value < 0.8;
    if (testId.includes('preensao') || testId === 'preensao_palmar') {
        const refStr = getHandStrengthReference(testId, gender || "", age || 0);
        // For range "36.8-56.6", take the lower bound
        const ref = parseFloat(refStr);
        return value < ref;
    }
    if (testId.includes('polpa') || testId === 'pinca_polpa') {
        const refStr = getHandStrengthReference(testId, gender || "", age || 0);
        const ref = parseFloat(refStr);
        return value < ref;
    }
    if (testId.includes('lateral') || testId === 'pinca_lateral') {
        const refStr = getHandStrengthReference(testId, gender || "", age || 0);
        const ref = parseFloat(refStr);
        return value < ref;
    }
    if (testId.includes('tripode') || testId === 'pinca_tripode') {
        const refStr = getHandStrengthReference(testId, gender || "", age || 0);
        const ref = parseFloat(refStr);
        return value < ref;
    }
    if (testId === 'sentar_levantar') return value > 12; // Higher is worse

    // -- MMII & Hand Thresholds --
    // Force Deficits (Yellow if > 15%)
    if (testId.includes('deficit') || testId.includes('def')) {
        return value > 15;
    }

    // IQ Ratio (Normal ~60-75%, Yellow if < 60%)
    if (testId.includes('rel_iq')) {
        return value < 60;
    }

    // YBT Asymmetry (Significant if > 4cm or > 10% - using 10% as default)
    if (testId.includes('ybt_diff')) {
        return value > 10;
    }

    return false;
}

/**
 * Normative MVIC data for Lower Limbs (kgf)
 * Sources: Meldrum ALS normative values (Knee) & USP/WhatsApp Table (Hip)
 */
const MM_DATA = {
    hip_abd: {
        male: { young: { active: 23.1, sedentary: 23.2 }, old: { active: 21.4, sedentary: 20.5 } },
        female: { young: { active: 22.7, sedentary: 19.2 }, old: { active: 20.0, sedentary: 18.5 } }
    },
    hip_ext: {
        male: { young: { active: 33.0, sedentary: 31.4 }, old: { active: 33.0, sedentary: 30.2 } },
        female: { young: { active: 31.5, sedentary: 26.5 }, old: { active: 27.1, sedentary: 24.3 } }
    },
    knee_ext: {
        female: { 20: 49.6, 25: 47.4, 30: 46.0, 35: 44.9, 40: 43.9, 45: 43.0, 50: 41.9, 55: 40.8, 60: 39.4, 65: 37.9, 70: 36.2 },
        male_multiplier: 1.25 // Estimate for Missing Male MVIC table (Can be adjusted)
    },
    knee_flex: {
        female: { 20: 25.7, 25: 24.5, 30: 23.8, 35: 23.2, 40: 22.7, 45: 22.2, 50: 21.7, 55: 21.1, 60: 20.5, 65: 19.7, 70: 18.8 },
        male_multiplier: 1.22 // Estimate for Missing Male MVIC table (Can be adjusted)
    }
};

export function getMuscleStrengthReference(muscleId: string, gender: Gender, age: number, activityLevel: ActivityLevel = 'Inativo'): number {
    const isMale = gender === 'Masculino';
    const isActive = activityLevel === 'Ativo';
    const gKey = isMale ? 'male' : 'female';
    const aKey = isActive ? 'active' : 'sedentary';
    const ageKey = age <= 40 ? 'young' : 'old';

    if (muscleId.includes('abd_q')) {
        return MM_DATA.hip_abd[gKey][ageKey][aKey];
    }
    if (muscleId.includes('ext_q')) {
        return MM_DATA.hip_ext[gKey][ageKey][aKey];
    }
    
    // Knee logic (lookup nearest age)
    if (muscleId.includes('ext_j') || muscleId.includes('flex_j')) {
        const type = muscleId.includes('ext_j') ? 'knee_ext' : 'knee_flex';
        const ageList = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70];
        const closestAge = ageList.reduce((prev, curr) => Math.abs(curr - age) < Math.abs(prev - age) ? curr : prev);
        
        let val = MM_DATA[type].female[closestAge as keyof typeof MM_DATA.knee_ext.female];
        if (isMale) val *= (type === 'knee_ext' ? MM_DATA.knee_ext.male_multiplier : MM_DATA.knee_flex.male_multiplier);
        
        return parseFloat(val.toFixed(1));
    }

    if (muscleId.includes('preensao') || muscleId.includes('pinca') || muscleId.includes('polpa') || muscleId.includes('lateral') || muscleId.includes('tripode')) {
        const refStr = getHandStrengthReference(muscleId, gender, age);
        // Extract first number from string like "36.8-56.6 kgf" or "11.8 kgf"
        const match = refStr.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : 20;
    }

    return 20; // Default fallback
}

export function getPatientProfileString(gender: Gender, age: number, activityLevel: ActivityLevel = 'Inativo'): string {
    const isMale = (gender || "").toLowerCase() === 'masculino';
    const isActive = activityLevel === 'Ativo';
    const isYoung = age <= 40;

    const gStr = isMale ? 'Homem' : 'Mulher';
    const aStr = isActive ? (isMale ? 'Ativo' : 'Ativa') : (isMale ? 'Inativo' : 'Inativa');
    const ageStr = isYoung ? '≤ 40 anos' : '> 40 anos';

    return `${gStr} ${aStr} ${ageStr}`;
}

// --- HAND STRENGTH NORMATIVE DATA (Extracted from User Images) ---

const HAND_NORMS = {
    // Values in Pounds (lb), converted to kgf in the lookup function (val * 0.45)
    lateral: {
        male: { 20: 26.0, 25: 26.7, 30: 26.4, 35: 26.1, 40: 25.6, 45: 25.8, 50: 26.7, 55: 24.2, 60: 23.2, 65: 23.4, 70: 19.3, 75: 20.5 },
        female: { 20: 17.6, 25: 17.7, 30: 18.7, 35: 16.6, 40: 16.7, 45: 17.6, 50: 16.7, 55: 15.7, 60: 15.5, 65: 15.0, 70: 14.5, 75: 12.6 }
    },
    tip: {
        male: { 20: 18.0, 25: 18.3, 30: 17.4, 35: 18.0, 40: 17.8, 45: 18.7, 50: 18.3, 55: 16.6, 60: 15.8, 65: 17.0, 70: 13.8, 75: 14.0 },
        female: { 20: 11.1, 25: 11.9, 30: 12.6, 35: 11.6, 40: 11.5, 45: 13.2, 50: 12.5, 55: 11.7, 60: 10.1, 65: 10.6, 70: 10.1, 75: 9.6 }
    },
    palmer: {
        male: { 20: 26.6, 25: 26.0, 30: 24.7, 35: 26.2, 40: 24.5, 45: 24.0, 50: 23.8, 55: 23.7, 60: 21.8, 65: 21.4, 70: 18.1, 75: 18.7 },
        female: { 20: 17.2, 25: 17.7, 30: 19.3, 35: 17.5, 40: 17.0, 45: 17.9, 50: 17.3, 55: 16.0, 60: 14.8, 65: 14.2, 70: 14.4, 75: 12.0 }
    },
    // Values in kgf (Direct Range)
    grip: {
        male: {
            20: "36.8-56.6", 25: "37.7-57.5", 30: "36.0-55.8", 35: "35.8-55.6", 40: "35.5-55.3",
            45: "34.7-54.5", 50: "32.9-50.7", 55: "30.7-48.5", 60: "30.2-48.0", 65: "28.2-44.0", 70: "21.3-35.1"
        },
        female: {
            20: "21.5-35.3", 25: "25.6-41.4", 30: "21.5-35.3", 35: "20.3-34.1", 40: "18.9-32.7",
            45: "18.6-32.4", 50: "18.1-31.9", 55: "17.7-31.5", 60: "17.2-31.0", 65: "15.4-27.2", 70: "14.7-24.5"
        }
    }
};

export function getHandStrengthReference(testId: string, gender: Gender, age: number): string {
    const isMale = (gender || "").toLowerCase() === 'masculino';
    const gKey = isMale ? 'male' : 'female';
    
    // Nearest age bracket finder
    const getNearest = (data: Record<number, any>, target: number) => {
        const ages = Object.keys(data).map(Number).sort((a, b) => a - b);
        const closest = ages.reduce((prev, curr) => Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev);
        return data[closest];
    };

    if (testId.includes('preensao_palmar') || testId.includes('preensao_esq') || testId.includes('preensao_dir') || testId === 'preensao') {
        return getNearest(HAND_NORMS.grip[gKey], age) + " kgf";
    }
    
    let type: 'lateral' | 'tip' | 'palmer' | null = null;
    if (testId.includes('lateral')) type = 'lateral';
    if (testId.includes('polpa')) type = 'tip';
    if (testId.includes('tripode')) type = 'palmer';

    if (type) {
        const valLb = getNearest(HAND_NORMS[type][gKey], age);
        const valKg = (valLb * 0.453).toFixed(1);
        return `${valKg} kgf`;
    }

    return "";
}
