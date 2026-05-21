export const NORMATIVE_DATA: Record<string, any> = {
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
    }
};

export const getNormalityValue = (rowId: string, gender?: string): number | undefined => {
    const isMale = gender === 'Masculino' || gender === 'masculino';
    
    const norms: Record<string, any> = {
        'preensao_palmar': isMale ? 40 : 25,
        'pinca_polpa': isMale ? 7.5 : 5.5,
        'pinca_lateral': isMale ? 10.5 : 7.5,
        'pinca_tripode': isMale ? 9.5 : 6.5,
        'abd_forca': isMale ? 28 : 18,
        'rl_forca': isMale ? 16 : 10,
        'rm_forca': isMale ? 22 : 15,
        'ext_joelho': isMale ? 45 : 30,
        'flex_joelho': isMale ? 25 : 18,
        'abd_quadril': isMale ? 22 : 15
    };
    
    return norms[rowId];
};

export const calculateDeficit = (esqVal: number, dirVal: number, isPercentage: boolean) => {
    if (esqVal > 0 || dirVal > 0) {
        if (isPercentage) {
            const maxVal = Math.max(esqVal, dirVal);
            const diff = Math.abs(esqVal - dirVal);
            return ((diff / maxVal) * 100).toFixed(1) + '%';
        } else {
            return Math.abs(esqVal - dirVal).toFixed(1);
        }
    }
    return isPercentage ? '0%' : '0';
};

export const runClinicalCalculations = (type: string, fieldId: string, currentAnswers: Record<string, any>) => {
    const newAnswers = { ...currentAnswers };

    // Shoulder (afOmbro) Calculations
    if (type === 'afOmbro') {
        // Power/Force Deficits
        const movements = ['forca_abd', 'forca_rl', 'forca_rm'];
        movements.forEach(mId => {
            if (fieldId === `${mId}_esq` || fieldId === `${mId}_dir`) {
                const esq = Number(newAnswers[`${mId}_esq`]);
                const dir = Number(newAnswers[`${mId}_dir`]);
                if (esq > 0 || dir > 0) {
                    const max = Math.max(esq, dir);
                    newAnswers[`${mId}_deficit`] = `${Math.round((Math.abs(esq - dir) / max) * 100)}%`;
                }
            }
        });

        // RL/RM Ratios
        if (fieldId.includes('forca_rl') || fieldId.includes('forca_rm')) {
            ['esq', 'dir'].forEach(side => {
                const rl = Number(newAnswers[`forca_rl_${side}`]);
                const rm = Number(newAnswers[`forca_rm_${side}`]);
                if (rl && rm) newAnswers[`rl_rm_ratio_${side}`] = `${Math.round((rl / rm) * 100)}%`;
            });
        }
    }

    // Lumbar (afLombar) Ratios
    if (type === 'afLombar' && (fieldId.includes('mmii_ri') || fieldId.includes('mmii_re'))) {
        ['esq', 'dir'].forEach(side => {
            const ri = Number(newAnswers[`mmii_ri_${side}`]);
            const re = Number(newAnswers[`mmii_re_${side}`]);
            if (ri && re) newAnswers[`mmii_ri_re_ratio_${side}`] = `${Math.round((ri / re) * 100)}%`;
        });
    }

    return newAnswers;
};
