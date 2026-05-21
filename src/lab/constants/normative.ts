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
