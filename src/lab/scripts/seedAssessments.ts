import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const assessmentTemplates = [
    {
        title: "Avaliação Funcional Cervical",
        segment: "Cervical",
        description: "Avaliação da coluna cervical incluindo movimento, palpação e testes neurológicos.",
        icon_url: "/img/icon_cervical.png",
        structure: {
            sections: [
                {
                    id: 'anamnese',
                    title: 'Características da Disfunção',
                    fields: [
                        { id: 'queixa', label: 'Queixa Principal', type: 'textarea' },
                        { id: 'intensidade_dor', label: 'Intensidade da Dor', type: 'range', min: 0, max: 10, step: 1 },
                        { id: 'area_dor', label: 'Área da Dor (Pinte as áreas afetadas)', type: 'bodyschema', image: '/img/esquema_corpo_inteiro.png' },
                        { id: 'historia', label: 'História Pregressa', type: 'textarea' },
                        { id: 'piora', label: 'Atividade de Piora', type: 'textarea' },
                        { id: 'alivio', label: 'Atividade de Alívio', type: 'textarea' },
                        { id: 'doencas', label: 'Doenças Associadas', type: 'textarea' }
                    ]
                },
                {
                    id: 'neuro_forca',
                    title: 'Avaliação Neurológica (Força Muscular)',
                    type: 'table',
                    columns: ['Miótono / Músculo', 'Esquerdo (0-5)', 'Direito (0-5)'],
                    rows: [
                        { id: 'c5', label: 'Flexor de Cotovelo (C5)', fields: ['esquerdo', 'direito'] },
                        { id: 'c6', label: 'Extensor de Punho (C6)', fields: ['esquerdo', 'direito'] },
                        { id: 'c7', label: 'Extensor de Cotovelo (C7)', fields: ['esquerdo', 'direito'] },
                        { id: 'c8', label: 'Flexores de Dedos (C8)', fields: ['esquerdo', 'direito'] },
                        { id: 't1', label: 'Abdutor do 5º Dedo (T1)', fields: ['esquerdo', 'direito'] }
                    ]
                },
                {
                    id: 'neuro_reflexos',
                    title: 'Avaliação Neurológica (Reflexos)',
                    type: 'table',
                    columns: ['Reflexo', 'Normal', 'Hiperreflexia', 'Hiporeflexia'],
                    rows: [
                        { id: 'bicipital', label: 'Bicipital (C5 e C6)', fields: [{ id: 'normal', type: 'checkbox' }, { id: 'hiper', type: 'checkbox' }, { id: 'hipo', type: 'checkbox' }] },
                        { id: 'tricipital', label: 'Tricipital (C7 e T1)', fields: [{ id: 'normal', type: 'checkbox' }, { id: 'hiper', type: 'checkbox' }, { id: 'hipo', type: 'checkbox' }] },
                        { id: 'estiloradial', label: 'Estiloradial (C6)', fields: [{ id: 'normal', type: 'checkbox' }, { id: 'hiper', type: 'checkbox' }, { id: 'hipo', type: 'checkbox' }] }
                    ]
                },
                {
                    id: 'postural',
                    title: 'Avaliação Postural',
                    fields: [
                        { id: 'postura_obs', label: 'Vista Posterior / Anterior / Laterais (Observações)', type: 'textarea' }
                    ]
                },
                {
                    id: 'movimento_cervical',
                    title: 'Avaliação do Movimento (Graus)',
                    type: 'table',
                    columns: ['Movimento', 'Graus', 'Padrão / Observações'],
                    rows: [
                        { id: 'flexao', label: 'Flexão', fields: ['graus', 'observacoes'] },
                        { id: 'extensao', label: 'Extensão', fields: ['graus', 'observacoes'] },
                        { id: 'rot_esq', label: 'Rotação Esquerda', fields: ['graus', 'observacoes'] },
                        { id: 'rot_dir', label: 'Rotação Direita', fields: ['graus', 'observacoes'] },
                        { id: 'incl_esq', label: 'Inclinação Esquerda', fields: ['graus', 'observacoes'] },
                        { id: 'incl_dir', label: 'Inclinação Direita', fields: ['graus', 'observacoes'] }
                    ]
                },
                {
                    id: 'testes_neurais',
                    title: 'Teste de Tensão Neural',
                    type: 'table',
                    columns: ['Nervo', 'Esquerdo', 'Direito'],
                    rows: [
                        { id: 'mediano', label: 'Mediano', fields: [{ id: 'esquerdo', type: 'checkbox' }, { id: 'direito', type: 'checkbox' }] },
                        { id: 'ulnar', label: 'Ulnar', fields: [{ id: 'esquerdo', type: 'checkbox' }, { id: 'direito', type: 'checkbox' }] },
                        { id: 'radial', label: 'Radial', fields: [{ id: 'esquerdo', type: 'checkbox' }, { id: 'direito', type: 'checkbox' }] }
                    ]
                },
                {
                    id: 'diagnostico_conclusoes',
                    title: 'Diagnóstico e Conclusões',
                    fields: [
                        { id: 'diagnostico', label: 'Diagnóstico Funcional', type: 'textarea' },
                        { id: 'conclusao', label: 'Conclusões e Sugestões Terapêuticas', type: 'textarea' }
                    ]
                }
            ]
        }
    },
    {
        title: "Avaliação Funcional Lombar",
        segment: "Lombar",
        description: "Avaliação da coluna lombar incluindo movimento, palpação e testes neurológicos.",
        icon_url: "/img/icon_lombar.png",
        structure: {
            sections: [
                {
                    id: 'anamnese',
                    title: 'Características da Disfunção',
                    fields: [
                        { id: 'queixa', label: 'Queixa Principal', type: 'textarea' },
                        { id: 'intensidade_dor', label: 'Intensidade da Dor', type: 'range', min: 0, max: 10, step: 1 },
                        { id: 'area_dor', label: 'Área da Dor', type: 'bodyschema', image: '/img/esquema_corpo_inteiro.png' }
                    ]
                },
                {
                    id: 'neuro_forca',
                    title: 'Avaliação Neurológica (Força Muscular)',
                    type: 'table',
                    columns: ['Miótono / Músculo', 'Esquerdo (0-5)', 'Direito (0-5)'],
                    rows: [
                        { id: 'l2', label: 'Flexor de Quadril (L2)', fields: ['esquerdo', 'direito'] },
                        { id: 'l3', label: 'Extensor de Joelho (L3)', fields: ['esquerdo', 'direito'] },
                        { id: 'l4', label: 'Dorsiflexor (L4)', fields: ['esquerdo', 'direito'] },
                        { id: 'l5', label: 'Extensor de Hálux (L5)', fields: ['esquerdo', 'direito'] },
                        { id: 's1', label: 'Flexor Plantar (S1)', fields: ['esquerdo', 'direito'] }
                    ]
                },
                {
                    id: 'movimento_lombar',
                    title: 'Avaliação do Movimento (Graus)',
                    type: 'table',
                    columns: ['Movimento', 'Graus', 'Observações'],
                    rows: [
                        { id: 'flexao', label: 'Flexão Lombar', fields: ['graus', 'observacoes'] },
                        { id: 'extensao', label: 'Extensão Lombar', fields: ['graus', 'observacoes'] }
                    ]
                },
                {
                    id: 'resistencia',
                    title: 'Testes de Resistência Muscular',
                    fields: [
                        { id: 'flexao_60', label: 'Flexão a 60º - Isometria Anterior (segundos)', type: 'number' },
                        { id: 'sorensen', label: 'Teste de Sorensen - Isometria Posterior (segundos)', type: 'number' }
                    ]
                }
            ]
        }
    },
    {
        title: "Avaliação Funcional Geriátrica",
        segment: "Geral",
        description: "Avaliação clínica e testes funcionais específicos para idosos.",
        icon_url: "/img/icon_geriatria.png",
        structure: {
            sections: [
                {
                    id: 'anamnese',
                    title: 'Anamnese',
                    fields: [
                        { id: 'queixa', label: 'Queixa Principal', type: 'textarea' },
                        { id: 'area_dor', label: 'Área da Dor', type: 'bodyschema', image: '/img/esquema_corpo_inteiro.png' }
                    ]
                },
                {
                    id: 'testes_equilibrio',
                    title: 'Testes de Equilíbrio',
                    fields: [
                        { id: 'pes_juntos', label: 'Pés Juntos (segundos - obj: 30s)', type: 'number' },
                        { id: 'tandem', label: 'Tandem (segundos - obj: >17.56s)', type: 'number' }
                    ]
                },
                {
                    id: 'testes_mobilidade',
                    title: 'Testes de Mobilidade e Força',
                    fields: [
                        { id: 'tug', label: 'Timed Up and Go (TUG - seg)', type: 'number' },
                        { id: 'sentar_levantar', label: 'Teste de Sentar/Levantar 5x (segundos)', type: 'number' },
                        { id: 'preensao', label: 'Força de Preensão Palmar (kg)', type: 'number' }
                    ]
                }
            ]
        }
    },
    {
        title: "Escala de Lysholm (Joelho)",
        segment: "Joelho",
        description: "Questionário para avaliar a função do joelho e sintomas mecânicos.",
        icon_url: "/img/icon_joelho.png",
        structure: {
            type: 'questionnaire',
            questions: [
                {
                    id: 'claudicacao',
                    text: '1. Claudicação (Mancar)',
                    options: [
                        { value: 5, label: 'Nenhuma' },
                        { value: 3, label: 'Leve ou periódica' },
                        { value: 0, label: 'Grave e constante' }
                    ]
                },
                {
                    id: 'apoio',
                    text: '2. Apoio',
                    options: [
                        { value: 5, label: 'Normal' },
                        { value: 2, label: 'Bengala ou muleta' },
                        { value: 0, label: 'Impossível' }
                    ]
                },
                {
                    id: 'bloqueio',
                    text: '3. Bloqueio',
                    options: [
                        { value: 15, label: 'Sem bloqueio ou sensação de bloqueio' },
                        { value: 10, label: 'Sensação de bloqueio mas sem bloqueio' },
                        { value: 6, label: 'Bloqueio ocasional' },
                        { value: 2, label: 'Bloqueio frequente' },
                        { value: 0, label: 'Bloqueio no momento do exame' }
                    ]
                }
            ],
            calculateScore: "sum"
        }
    },
    {
        title: "Quick DASH",
        segment: "Ombro",
        description: "Avalia sintomas e capacidade física focado no ombro, braço e mão.",
        icon_url: "/img/icon_ombro.png",
        structure: {
            type: 'questionnaire',
            questions: [
                { text: '1. Abrir um vidro novo com tampa de rosca.', options: [{value:1, label:'Nenhuma'}, {value:5, label:'Incapaz'}] }
                // and so on...
            ],
            calculateScore: "quickdash"
        }
    }
];

async function main() {
    console.log("Seeding assessment templates...");
    for (const t of assessmentTemplates) {
        await prisma.assessmentTemplate.upsert({
            where: { id: t.title.toLowerCase().replace(/ /g, '_') }, // temporary ID strategy
            update: t,
            create: {
                id: t.title.toLowerCase().replace(/ /g, '_'),
                ...t
            }
        });
    }
    console.log("Seeding finished!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
