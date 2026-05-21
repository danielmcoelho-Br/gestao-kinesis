import { Questionnaire } from '@/lab/types/clinical';
export * from '@/lab/types/clinical';

const scores0to5 = ["0", "1", "2", "3", "4", "5"];
const reflexOptions = ["Normal", "Hiperreflexia", "Hiporeflexia"];
const sensitivityOptions = ["Normal", "Hipoestesia", "Hiperestesia", "Anestesia"];

export const questionnairesData: Record<string, Questionnaire> = {
  oswestry: {
    id: 'oswestry',
    segment: 'lombar',
    title: 'Índice de Incapacidade de Oswestry (ODI)',
    description: 'Questionário para avaliar a incapacidade em pacientes com dor lombar.',
    clinicalFlags: [
      {
        id: 'red_flag_bladder',
        label: 'Red Flag: Disfunção Esfincteriana',
        level: 'red',
        message: 'Atenção: A perda de controle de bexiga ou intestino é um sinal clínico grave (ex: Síndrome da Cauda Equina). Encaminhamento urgente recomendado.',
        criteria: (answers: any) => answers[8] === 5 // Item 9 do Oswestry (Função Intestinal/Bexiga) - Score 5
      }
    ],
    questions: [
      { text: '1. Intensidade da Dor', options: [
        { value: 0, label: 'Eu posso tolerar a dor que sinto sem ter que usar analgésicos.' },
        { value: 1, label: 'A dor é ruim, mas eu consigo lidar com ela sem tomar analgésicos.' },
        { value: 2, label: 'Os analgésicos me dão alívio completo da dor.' },
        { value: 3, label: 'Os analgésicos me dão alívio moderado da dor.' },
        { value: 4, label: 'Os analgésicos me dão muito pouco alívio da dor.' },
        { value: 5, label: 'Os analgésicos não têm efeito sobre a dor e eu não os uso.' }
      ]},
      { text: '2. Cuidados Pessoais', options: [
        { value: 0, label: 'Posso cuidar de mim mesmo normalmente sem que isso cause dor extra.' },
        { value: 1, label: 'Posso cuidar de mim mesmo normalmente, mas isso causa dor extra.' },
        { value: 2, label: 'Cuidar de mim mesmo causa dor e sou lento e cuidadoso.' },
        { value: 3, label: 'Preciso de alguma ajuda, mas consigo fazer a maioria das minhas coisas.' },
        { value: 4, label: 'Preciso de ajuda todos os dias para a maioria dos aspectos do meu cuidado pessoal.' },
        { value: 5, label: 'Não me visto, lavo-me com dificuldade e fico na cama.' }
      ]},
      { text: '3. Levantar Peso', options: [
        { value: 0, label: 'Posso levantar objetos pesados sem dor extra.' },
        { value: 1, label: 'Posso levantar objetos pesados, mas causa dor extra.' },
        { value: 2, label: 'A dor me impede de levantar objetos pesados do chão, mas consigo se estiverem em um local conveniente.' },
        { value: 3, label: 'A dor me impede de levantar objetos pesados, mas consigo levantar objetos leves a médios.' },
        { value: 4, label: 'Só consigo levantar objetos muito leves.' },
        { value: 5, label: 'Não consigo levantar ou carregar nada.' }
      ]},
      { text: '4. Caminhar', options: [
        { value: 0, label: 'A dor não me impede de caminhar qualquer distância.' },
        { value: 1, label: 'A dor me impede de caminhar mais de 1,5 km.' },
        { value: 2, label: 'A dor me impede de caminhar mais de 750 metros.' },
        { value: 3, label: 'A dor me impede de caminhar mais de 100 metros.' },
        { value: 4, label: 'Só posso caminhar com o uso de bengala ou muletas.' },
        { value: 5, label: 'Fico na cama ou na cadeira a maior parte do tempo.' }
      ]},
      { text: '5. Sentar', options: [
        { value: 0, label: 'Posso sentar em qualquer cadeira pelo tempo que eu quiser.' },
        { value: 1, label: 'Apenas posso sentar na minha cadeira favorita pelo tempo que eu quiser.' },
        { value: 2, label: 'A dor me impede de sentar por mais de 1 hora.' },
        { value: 3, label: 'A dor me impede de sentar por mais de meia hora.' },
        { value: 4, label: 'A dor me impede de sentar por mais de 10 minutos.' },
        { value: 5, label: 'A dor me impede de sentar.' }
      ]},
      { text: '6. Ficar em Pé', options: [
        { value: 0, label: 'Posso ficar em pé o tempo que quiser sem dor extra.' },
        { value: 1, label: 'Posso ficar em pé o tempo que quiser, mas isso me causa dor extra.' },
        { value: 2, label: 'A dor me impede de ficar em pé por mais de 1 hora.' },
        { value: 3, label: 'A dor me impede de ficar em pé por mais de meia hora.' },
        { value: 4, label: 'A dor me impede de ficar em pé por mais de 10 minutos.' },
        { value: 5, label: 'A dor me impede totalmente de ficar em pé.' }
      ]},
      { text: '7. Dormir', options: [
        { value: 0, label: 'Meu sono não é nunca perturbado pela dor.' },
        { value: 1, label: 'Meu sono é ocasionalmente perturbado pela dor.' },
        { value: 2, label: 'Por causa da dor meu sono é menos de 6 horas.' },
        { value: 3, label: 'Por causa da dor meu sono é menos de 4 horas.' },
        { value: 4, label: 'Por causa da dor meu sono é menos de 2 horas.' },
        { value: 5, label: 'A dor me impede totalmente de dormir.' }
      ]},
      { text: '8. Vida Sexual (se aplicável)', options: [
        { value: 0, label: 'Minha vida sexual é normal e não me causa dor extra.' },
        { value: 1, label: 'Minha vida sexual é normal, mas me causa alguma dor extra.' },
        { value: 2, label: 'Minha vida sexual é quase normal, mas é muito dolorosa.' },
        { value: 3, label: 'Minha vida sexual é severamente restringida pela dor.' },
        { value: 4, label: 'Minha vida sexual é quase inexistente por causa da dor.' },
        { value: 5, label: 'A dor me impede de ter qualquer vida sexual.' }
      ]},
      { text: '9. Vida Social', options: [
        { value: 0, label: 'Minha vida social é normal e não me causa dor extra.' },
        { value: 1, label: 'Minha vida social é normal, mas aumenta o grau de dor.' },
        { value: 2, label: 'A dor não tem efeito sobre a minha vida social, mas restringe os meus interesses mais ativos.' },
        { value: 3, label: 'A dor tem restringido a minha vida social e não saio com tanta frequência.' },
        { value: 4, label: 'A dor restringiu a minha vida social a minha casa.' },
        { value: 5, label: 'Não tenho nenhuma vida social por causa da dor.' }
      ]},
      { text: '10. Viagens', options: [
        { value: 0, label: 'Posso viajar para qualquer lugar sem dor.' },
        { value: 1, label: 'Posso viajar para qualquer lugar, mas causa dor extra.' },
        { value: 2, label: 'A dor é ruim, mas consigo fazer viagens de mais de duas horas.' },
        { value: 3, label: 'A dor restringe viagens para menos de uma hora.' },
        { value: 4, label: 'A dor restringe viagens curtas e necessárias para menos de meia hora.' },
        { value: 5, label: 'A dor me impede de viajar, exceto para ir ao médico e hospitais.' }
      ]}
    ],
    calculateScore: (answers: Record<string, any>) => {
      const entries = Object.entries(answers).filter(([k, v]) => !isNaN(Number(k)) && v !== undefined && v !== "" && typeof v !== 'boolean');
      if (entries.length === 0) return { percentage: 0, interpretation: 'Pendente', unit: '%' };
      const total = entries.reduce((acc, [_, val]) => acc + Number(val), 0);
      const percentage = Math.round((total / (entries.length * 5)) * 100);
      let interpretation = 'Incapacidade Mínima';
      if (percentage > 20) interpretation = 'Incapacidade Moderada';
      if (percentage > 40) interpretation = 'Incapacidade Severa';
      if (percentage > 60) interpretation = 'Incapacidade Devastadora';
      if (percentage > 80) interpretation = 'Restrito ao Leito';
      return { percentage, interpretation, unit: '%' };
    }
  },
  ndi: {
    id: 'ndi',
    segment: 'cervical',
    title: 'Neck Disability Index (NDI)',
    description: 'Avalia o impacto da dor cervical nas atividades diárias.',
    questions: [
      { text: '1. Intensidade da Dor', options: [
        { value: 0, label: 'No momento eu não tenho dor.' },
        { value: 1, label: 'No momento a dor é bem leve.' },
        { value: 2, label: 'No momento a dor é moderada.' },
        { value: 3, label: 'No momento a dor é bastante forte.' },
        { value: 4, label: 'No momento a dor é muito forte.' },
        { value: 5, label: 'No momento a dor é a pior possível.' }
      ]},
      { text: '2. Cuidados Pessoais', options: [
        { value: 0, label: 'Posso cuidar de mim mesmo sem que isto aumente minha dor.' },
        { value: 1, label: 'Posso cuidar de mim mesmo, mas isto aumenta minha dor.' },
        { value: 2, label: 'Cuidar de mim mesmo é doloroso e por isto sou lento e cuidadoso.' },
        { value: 3, label: 'Preciso de alguma ajuda, mas consigo fazer a maioria das coisas.' },
        { value: 4, label: 'Preciso de ajuda todos os dias para a maior parte dos meus cuidados pessoais.' },
        { value: 5, label: 'Não consigo me vestir, lavo-me com dificuldade e permaneço na cama.' }
      ]},
      { text: '3. Levantar Peso', options: [
        { value: 0, label: 'Posso levantar objetos pesados sem que isto aumente minha dor.' },
        { value: 1, label: 'Posso levantar objetos pesados, mas isto aumenta minha dor.' },
        { value: 2, label: 'A dor me impede de levantar objetos pesados do chão, mas consigo se estiverem bem posicionados.' },
        { value: 3, label: 'A dor me impede de levantar objetos pesados, mas consigo levantar objetos leves se bem posicionados.' },
        { value: 4, label: 'Só consigo levantar objetos muito leves.' },
        { value: 5, label: 'Não consigo levantar nem carregar nenhum objeto.' }
      ]},
      { text: '4. Leitura', options: [
        { value: 0, label: 'Posso ler o quanto eu quiser sem sentir dor no pescoço.' },
        { value: 1, label: 'Posso ler o quanto eu quiser com uma leve dor no pescoço.' },
        { value: 2, label: 'Posso ler o quanto eu quiser com dor moderada no pescoço.' },
        { value: 3, label: 'Não posso ler tanto quanto eu gostaria por causa de dor moderada no pescoço.' },
        { value: 4, label: 'Eu quase não consigo ler por causa da dor muito forte no pescoço.' },
        { value: 5, label: 'Não consigo ler de modo algum.' }
      ]},
      { text: '5. Dores de Cabeça', options: [
        { value: 0, label: 'Não tenho nenhuma dor de cabeça.' },
        { value: 1, label: 'Tenho leves dores de cabeça não muito frequentes.' },
        { value: 2, label: 'Tenho dores de cabeça moderadas não muito frequentes.' },
        { value: 3, label: 'Tenho dores de cabeça moderadas frequentemente.' },
        { value: 4, label: 'Tenho dores de cabeça muito fortes frequentemente.' },
        { value: 5, label: 'Tenho dores de cabeça o tempo todo.' }
      ]},
      { text: '6. Concentração', options: [
        { value: 0, label: 'Posso me concentrar totalmente quando eu quiser sem nenhuma dificuldade.' },
        { value: 1, label: 'Posso me concentrar totalmente quando eu quiser com uma leve dificuldade.' },
        { value: 2, label: 'Tenho um grau razoável de dificuldade em me concentrar quando eu quero.' },
        { value: 3, label: 'Tenho muita dificuldade em me concentrar quando eu quero.' },
        { value: 4, label: 'Tenho extrema dificuldade em me concentrar quando eu quero.' },
        { value: 5, label: 'Não consigo me concentrar de modo algum.' }
      ]},
      { text: '7. Trabalho', options: [
        { value: 0, label: 'Posso fazer tanto trabalho quanto eu quiser.' },
        { value: 1, label: 'Posso fazer apenas o meu trabalho habitual, mas não mais.' },
        { value: 2, label: 'Posso fazer a maior parte do meu trabalho habitual, mas não mais.' },
        { value: 3, label: 'Não posso fazer o meu trabalho habitual.' },
        { value: 4, label: 'Quase não posso fazer nenhum trabalho.' },
        { value: 5, label: 'Não posso fazer nenhum trabalho de modo algum.' }
      ]},
      { text: '8. Dirigir', options: [
        { value: 0, label: 'Posso dirigir o meu carro sem nenhuma dor no pescoço.' },
        { value: 1, label: 'Posso dirigir o meu carro o quanto eu quiser com uma leve dor no pescoço.' },
        { value: 2, label: 'Posso dirigir o meu carro o quanto eu quiser com dor moderada no pescoço.' },
        { value: 3, label: 'Não posso dirigir o meu carro o quanto eu quiser por causa de dor moderada no pescoço.' },
        { value: 4, label: 'Eu mal posso dirigir por causa da dor muito forte no pescoço.' },
        { value: 5, label: 'Não consigo dirigir meu carro de modo algum.' }
      ]},
      { text: '9. Sono', options: [
        { value: 0, label: 'Não tenho nenhum problema para dormir.' },
        { value: 1, label: 'Meu sono é levemente perturbado (menos de 1 hora sem sono).' },
        { value: 2, label: 'Meu sono é moderadamente perturbado (1-2 horas sem sono).' },
        { value: 3, label: 'Meu sono é bastante perturbado (2-3 horas sem sono).' },
        { value: 4, label: 'Meu sono é muito perturbado (3-5 horas sem sono).' },
        { value: 5, label: 'Meu sono é totalmente perturbado (5-7 horas sem sono).' }
      ]},
      { text: '10. Lazer', options: [
        { value: 0, label: 'Sou capaz de participar em todas as minhas atividades de lazer sem nenhuma dor no pescoço.' },
        { value: 1, label: 'Sou capaz de participar em todas as minhas atividades de lazer com alguma dor no pescoço.' },
        { value: 2, label: 'Sou capaz de participar na maioria, mas não em todas as minhas habituais atividades de lazer por causa de dor no pescoço.' },
        { value: 3, label: 'Sou capaz de participar em apenas algumas das minhas habituais atividades de lazer por causa de dor no pescoço.' },
        { value: 4, label: 'Dificilmente posso participar em quaisquer atividades de lazer por causa da dor no pescoço.' },
        { value: 5, label: 'Não consigo participar em nenhuma atividade de lazer de modo algum.' }
      ]}
    ],
    calculateScore: (answers: Record<string, any>) => {
      const entries = Object.entries(answers).filter(([k, v]) => !isNaN(Number(k)) && v !== undefined && v !== "" && typeof v !== 'boolean');
      if (entries.length === 0) return { percentage: 0, interpretation: 'Pendente', unit: '%' };
      const total = entries.reduce((acc, [_, val]) => acc + Number(val), 0);
      const percentage = Math.round((total / (entries.length * 5)) * 100);
      let interpretation = 'Sem Deficiência';
      if (percentage > 8) interpretation = 'Deficiência Leve';
      if (percentage > 20) interpretation = 'Deficiência Moderada';
      if (percentage > 40) interpretation = 'Deficiência Severa';
      if (percentage > 60) interpretation = 'Deficiência Completa';
      return { percentage, interpretation, unit: '%' };
    }
  },
  afCervical: {
    id: 'afCervical',
    segment: 'cervical',
    title: 'Avaliação Funcional Cervical',
    description: 'Avaliação completa da coluna cervical, incluindo movimento e testes neurológicos.',
    clinicalFlags: [
      {
        id: 'red_flag_neuro_cervical',
        label: 'Red Flag: Déficit Neurológico Cervical',
        level: 'red',
        message: 'Atenção: Fraqueza muscular significativa detectada nos membros superiores (Grau < 3). Recomenda-se avaliação neurológica urgente para descartar compressão medular ou radiculopatia grave.',
        criteria: (answers: any) => {
          const mios = ['forca_c5_esq', 'forca_c5_dir', 'forca_c6_esq', 'forca_c6_dir', 'forca_c7_esq', 'forca_c7_dir', 'forca_c8_esq', 'forca_c8_dir', 'forca_t1_esq', 'forca_t1_dir'];
          return mios.some(m => answers[m] && parseInt(answers[m]) < 3);
        }
      },
      {
        id: 'yellow_flag_pain_cervical',
        label: 'Yellow Flag: Alta Intensidade de Dor',
        level: 'yellow',
        message: 'Intensidade de dor muito elevada (EVA >= 9). Considere o impacto da sensibilização central e fatores psicossociais no prognóstico.',
        criteria: (answers: any) => answers['intensidade_dor'] >= 9
      }
    ],
    sections: [
        {
            id: 'anamnese',
            title: 'Características da Disfunção',
            fields: [
                { id: 'anamnese_texto', label: 'Anamnese', type: 'textarea', rows: 6 },
                { id: 'intensidade_dor', label: 'Intensidade da Dor', type: 'range', min: 0, max: 10, step: 1 },
                { id: 'area_dor', label: 'Área da Dor (Pinte as áreas afetadas)', type: 'bodyschema', image: '/img/esquema_corpo_inteiro.png' },
                { id: 'anamnese_obs', label: 'OBSERVAÇÕES', type: 'textarea' }
            ]
        },
        {
            id: 'exame_neurologico',
            title: 'Exame Neurológico',
            type: 'multi-table',
            subsections: [
                {
                    id: 'miotomos',
                    title: 'Miótomos (Força 0-5)',
                    type: 'table',
                    columns: [
                        'Nível / Movimento', 
                        { label: 'Esquerdo', action: { type: 'fill', value: '5' } }, 
                        { label: 'Direito', action: { type: 'fill', value: '5' } }
                    ],
                    rows: [
                        { id: 'c5_mio', label: 'C5 (Abdução Ombro)', fields: [{ id: 'forca_c5_esq', type: 'select', options: scores0to5 }, { id: 'forca_c5_dir', type: 'select', options: scores0to5 }] },
                        { id: 'c6_mio', label: 'C6 (Flex. Cotovelo / Ext. Punho)', fields: [{ id: 'forca_c6_esq', type: 'select', options: scores0to5 }, { id: 'forca_c6_dir', type: 'select', options: scores0to5 }] },
                        { id: 'c7_mio', label: 'C7 (Ext. Cotovelo / Flex. Punho)', fields: [{ id: 'forca_c7_esq', type: 'select', options: scores0to5 }, { id: 'forca_c7_dir', type: 'select', options: scores0to5 }] },
                        { id: 'c8_mio', label: 'C8 (Ext. Polegar / Ulnarização)', fields: [{ id: 'forca_c8_esq', type: 'select', options: scores0to5 }, { id: 'forca_c8_dir', type: 'select', options: scores0to5 }] },
                        { id: 't1_mio', label: 'T1 (Abdução Dedos)', fields: [{ id: 'forca_t1_esq', type: 'select', options: scores0to5 }, { id: 'forca_t1_dir', type: 'select', options: scores0to5 }] }
                    ]
                },
                {
                    id: 'reflexos',
                    title: 'Reflexos Profundos',
                    type: 'table',
                    columns: [
                        'Reflexo', 
                        { label: 'Esquerdo', action: { type: 'fill', value: 'Normal' } }, 
                        { label: 'Direito', action: { type: 'fill', value: 'Normal' } }
                    ],
                    rows: [
                        { id: 'ref_biciptal', label: 'Biciptal (C5)', fields: [{ id: 'ref_bic_esq', type: 'select', options: reflexOptions }, { id: 'ref_bic_dir', type: 'select', options: reflexOptions }] },
                        { id: 'ref_estilorradial', label: 'Estilorradial (C6)', fields: [{ id: 'ref_est_esq', type: 'select', options: reflexOptions }, { id: 'ref_est_dir', type: 'select', options: reflexOptions }] },
                        { id: 'ref_triciptal', label: 'Triciptal (C7)', fields: [{ id: 'ref_tri_esq', type: 'select', options: reflexOptions }, { id: 'ref_tri_dir', type: 'select', options: reflexOptions }] }
                    ]
                },
                {
                    id: 'testes_especiais_neuro',
                    title: 'Testes Especiais',
                    type: 'table',
                    columns: ['', 'Esquerdo', 'Direito'],
                    rows: [
                        { id: 'hoffmann', label: 'Hoffmann', fields: [{ id: 'hoffmann_esq', type: 'checkbox' }, { id: 'hoffmann_dir', type: 'checkbox' }] },
                        { id: 'babinski', label: 'Babinski', fields: [{ id: 'babinski_esq', type: 'checkbox' }, { id: 'babinski_dir', type: 'checkbox' }] },
                        { id: 'clonus', label: 'Clonus', fields: [{ id: 'clonus_esq', type: 'checkbox' }, { id: 'clonus_dir', type: 'checkbox' }] },
                        { id: 'claudicacao_neuro', label: 'Claudicação Neurogênica', fields: [{ id: 'claudicacao_esq', type: 'checkbox' }, { id: 'claudicacao_dir', type: 'checkbox' }] }
                    ]
                }
            ],
            fields: [
                { id: 'neuro_cervical_obs', label: 'OBSERVAÇÕES', type: 'textarea' }
            ]
        },
        {
            id: 'exame_neurologico',
            title: 'Exame Neurológico',
            type: 'multi-table',
            subsections: [
                {
                    id: 'miotomos',
                    title: 'Miótomos (Força 0-5)',
                    type: 'table',
                    columns: [
                        'Nível / Movimento', 
                        { label: 'Esquerdo', action: { type: 'fill', value: '5' } }, 
                        { label: 'Direito', action: { type: 'fill', value: '5' } }
                    ],
                    rows: [
                        { id: 'c5_mio', label: 'C5 (Abdução Ombro)', fields: [{ id: 'forca_c5_esq', type: 'select', options: scores0to5 }, { id: 'forca_c5_dir', type: 'select', options: scores0to5 }] },
                        { id: 'c6_mio', label: 'C6 (Flex. Cotovelo / Ext. Punho)', fields: [{ id: 'forca_c6_esq', type: 'select', options: scores0to5 }, { id: 'forca_c6_dir', type: 'select', options: scores0to5 }] },
                        { id: 'c7_mio', label: 'C7 (Ext. Cotovelo / Flex. Punho)', fields: [{ id: 'forca_c7_esq', type: 'select', options: scores0to5 }, { id: 'forca_c7_dir', type: 'select', options: scores0to5 }] },
                        { id: 'c8_mio', label: 'C8 (Ext. Polegar / Ulnarização)', fields: [{ id: 'forca_c8_esq', type: 'select', options: scores0to5 }, { id: 'forca_c8_dir', type: 'select', options: scores0to5 }] },
                        { id: 't1_mio', label: 'T1 (Abdução Dedos)', fields: [{ id: 'forca_t1_esq', type: 'select', options: scores0to5 }, { id: 'forca_t1_dir', type: 'select', options: scores0to5 }] }
                    ]
                },
                {
                    id: 'reflexos',
                    title: 'Reflexos Profundos',
                    type: 'table',
                    columns: [
                        'Reflexo', 
                        { label: 'Esquerdo', action: { type: 'fill', value: 'Normal' } }, 
                        { label: 'Direito', action: { type: 'fill', value: 'Normal' } }
                    ],
                    rows: [
                        { id: 'ref_biciptal', label: 'Biciptal (C5)', fields: [{ id: 'ref_bic_esq', type: 'select', options: reflexOptions }, { id: 'ref_bic_dir', type: 'select', options: reflexOptions }] },
                        { id: 'ref_estilorradial', label: 'Estilorradial (C6)', fields: [{ id: 'ref_est_esq', type: 'select', options: reflexOptions }, { id: 'ref_est_dir', type: 'select', options: reflexOptions }] },
                        { id: 'ref_triciptal', label: 'Triciptal (C7)', fields: [{ id: 'ref_tri_esq', type: 'select', options: reflexOptions }, { id: 'ref_tri_dir', type: 'select', options: reflexOptions }] }
                    ]
                }
            ]
        },

        {
            id: 'movimento_cervical',
            title: 'Avaliação do Movimento (Graus)',
            type: 'table',
            columns: ['Movimento', 'Graus'],
            rows: [
                { id: 'flexao', label: 'Flexão', fields: [{ id: 'flexao_graus', type: 'number', min: 0, max: 80 }] },
                { id: 'extensao', label: 'Extensão', fields: [{ id: 'extensao_graus', type: 'number', min: 0, max: 70 }] },
                { id: 'rot_esq', label: 'Rotação Esquerda', fields: [{ id: 'rot_esq_graus', type: 'number', min: 0, max: 90 }] },
                { id: 'rot_dir', label: 'Rotação Direita', fields: [{ id: 'rot_dir_graus', type: 'number', min: 0, max: 90 }] },
                { id: 'incl_esq', label: 'Inclinação Esquerda', fields: [{ id: 'incl_esq_graus', type: 'number', min: 0, max: 45 }] },
                { id: 'incl_dir', label: 'Inclinação Direita', fields: [{ id: 'incl_dir_graus', type: 'number', min: 0, max: 45 }] }
            ],
            fields: [{ id: 'movimento_cervical_obs', label: 'OBSERVAÇÕES', type: 'textarea' }]
        },
        {
            id: 'irritabilidade',
            title: 'Teste de Irritabilidade',

            type: 'multi-table',
            subsections: [
                {
                    id: 'irritabilidade_ca_t1',
                    title: 'C2 a T1',
                    type: 'table',
                    columns: ['Nível Vertebral', 'Presença de Dor', 'Intensidade (0-10)'],
                    rows: [
                        { id: 'c2', label: 'C2', fields: [{ id: 'palp_c2_dor', type: 'checkbox' }, { id: 'palp_c2_int', type: 'number' }] },
                        { id: 'c3', label: 'C3', fields: [{ id: 'palp_c3_dor', type: 'checkbox' }, { id: 'palp_c3_int', type: 'number' }] },
                        { id: 'c4', label: 'C4', fields: [{ id: 'palp_c4_dor', type: 'checkbox' }, { id: 'palp_c4_int', type: 'number' }] },
                        { id: 'c5p', label: 'C5', fields: [{ id: 'palp_c5_dor', type: 'checkbox' }, { id: 'palp_c5_int', type: 'number' }] },
                        { id: 'c6p', label: 'C6', fields: [{ id: 'palp_c6_dor', type: 'checkbox' }, { id: 'palp_c6_int', type: 'number' }] },
                        { id: 'c7p', label: 'C7', fields: [{ id: 'palp_c7_dor', type: 'checkbox' }, { id: 'palp_c7_int', type: 'number' }] },
                        { id: 't1p', label: 'T1', fields: [{ id: 'palp_t1_dor', type: 'checkbox' }, { id: 'palp_t1_int', type: 'number' }] }
                    ]
                },
                {
                    id: 'irritabilidade_t2_t7',
                    title: 'T2 a T7',
                    type: 'table',
                    columns: ['Nível Vertebral', 'Presença de Dor', 'Intensidade (0-10)'],
                    rows: [
                        { id: 't2', label: 'T2', fields: [{ id: 'palp_t2_dor', type: 'checkbox' }, { id: 'palp_t2_int', type: 'number' }] },
                        { id: 't3', label: 'T3', fields: [{ id: 'palp_t3_dor', type: 'checkbox' }, { id: 'palp_t3_int', type: 'number' }] },
                        { id: 't4', label: 'T4', fields: [{ id: 'palp_t4_dor', type: 'checkbox' }, { id: 'palp_t4_int', type: 'number' }] },
                        { id: 't5', label: 'T5', fields: [{ id: 'palp_t5_dor', type: 'checkbox' }, { id: 'palp_t5_int', type: 'number' }] },
                        { id: 't6', label: 'T6', fields: [{ id: 'palp_t6_dor', type: 'checkbox' }, { id: 'palp_t6_int', type: 'number' }] },
                        { id: 't7p', label: 'T7', fields: [{ id: 'palp_t7_dor', type: 'checkbox' }, { id: 'palp_t7_int', type: 'number' }] }
                    ]
                }
            ],
            fields: [{ id: 'irritabilidade_obs', label: 'OBSERVAÇÕES', type: 'textarea' }]
        },
        {
            id: 'miofascial_neural',
            title: 'Palpação Miofascial e Tensão Neural',
            type: 'multi-table',
            subsections: [
                {

                    id: 'miofascial_sub',
                    title: 'Palpação Miofascial',
                    type: 'table',
                    columns: ['Estrutura', 'Esquerdo', 'Direito'],
                    rows: [
                        { id: 'suboccipitais', label: 'M. Suboccipitais', fields: [{ id: 'mio_suboccipitais_esq', type: 'checkbox' }, { id: 'mio_suboccipitais_dir', type: 'checkbox' }] },
                        { id: 'esplenios', label: 'M. Esplênios', fields: [{ id: 'mio_esplenios_esq', type: 'checkbox' }, { id: 'mio_esplenios_dir', type: 'checkbox' }] },
                        { id: 'escalenos', label: 'M. Escalenos', fields: [{ id: 'mio_escalenos_esq', type: 'checkbox' }, { id: 'mio_escalenos_dir', type: 'checkbox' }] },
                        { id: 'ecom', label: 'M. Esternocleidomastóide', fields: [{ id: 'mio_ecom_esq', type: 'checkbox' }, { id: 'mio_ecom_dir', type: 'checkbox' }] },
                        { id: 'trapezio_sup', label: 'M. Trapézio Superior', fields: [{ id: 'mio_trapezio_esq', type: 'checkbox' }, { id: 'mio_trapezio_dir', type: 'checkbox' }] },
                        { id: 'lev_escapula', label: 'M. Elevador da Escápula', fields: [{ id: 'mio_lev_escapula_esq', type: 'checkbox' }, { id: 'mio_lev_escapula_dir', type: 'checkbox' }] },
                        { id: 'romboides', label: 'M. Romboides', fields: [{ id: 'mio_romboides_esq', type: 'checkbox' }, { id: 'mio_romboides_dir', type: 'checkbox' }] },
                        { id: 'grande_dorsal', label: 'M. Grande Dorsal', fields: [{ id: 'mio_grande_dorsal_esq', type: 'checkbox' }, { id: 'mio_grande_dorsal_dir', type: 'checkbox' }] },
                        { id: 'peitorais', label: 'M. Peitorais', fields: [{ id: 'mio_peitorais_esq', type: 'checkbox' }, { id: 'mio_peitorais_dir', type: 'checkbox' }] }
                    ]
                },
                {
                    id: 'tensao_neural_sub',
                    title: 'Teste de Tensão Neural',
                    type: 'table',
                    columns: ['Nervo', 'Esquerdo', 'Direito'],
                    rows: [
                        { id: 'nervo_mediano', label: 'Nervo Mediano', fields: [{ id: 'tensao_mediano_esq', type: 'checkbox' }, { id: 'tensao_mediano_dir', type: 'checkbox' }] },
                        { id: 'nervo_ulnar', label: 'Nervo Ulnar', fields: [{ id: 'tensao_ulnar_esq', type: 'checkbox' }, { id: 'tensao_ulnar_dir', type: 'checkbox' }] },
                        { id: 'nervo_radial', label: 'Nervo Radial', fields: [{ id: 'tensao_radial_esq', type: 'checkbox' }, { id: 'tensao_radial_dir', type: 'checkbox' }] }
                    ]
                }
            ],
            fields: [
                { id: 'miofascial_neural_obs_geral', label: 'OBSERVAÇÕES', type: 'textarea' }

            ]
        },
        {
            id: 'testes_especiais_resistidos',
            title: 'Testes Resistidos e Especiais',
            type: 'table',
            columns: ['Teste', 'Tempo (s)', 'Percentual (%)', 'Resultado'],
            rows: [
                { id: 'res_flex_row', label: 'Resistência Musculatura Flexora', fields: ['resist_flexora', { id: 'resist_flexora_pct', isCalculated: true }, 'resist_flexora_res'] },
                { id: 'res_ext_row', label: 'Resistência Musculatura Extensora', fields: ['resist_extensora', { id: 'resist_extensora_pct', isCalculated: true }, 'resist_extensora_res'] }
            ],
            fields: [
                { id: 'testes_especiais', label: 'Testes Especiais / Observações', type: 'textarea' }
            ]
        },
        {
            id: 'ndi_integracao',
            title: 'NDI (Neck Disability Index)',
            fields: [
                { id: 'ndi_novo', label: 'Preencher novo Questionário NDI', type: 'button' }

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
    ],
    calculateScore: (answers: Record<string, any>) => {
      // For clinical assessments, we just return a "Finished" state for now
      return { score: 0, max: 0, percentage: 100, interpretation: 'Avaliação Concluída', unit: '%' };
    }
  },
  afLombar: {
    id: 'afLombar',
    segment: 'lombar',
    title: 'Avaliação Funcional Lombar',
    description: 'Avaliação completa da coluna lombar, incluindo movimento, palpação e testes neurológicos.',
    clinicalFlags: [
      {
        id: 'red_flag_neuro_lumbar_severe',
        label: 'Red Flag: Déficit Neurológico Grave',
        level: 'red',
        message: 'Atenção: Fraqueza muscular severa (Grau < 3) em miótomos detectada. Risco de compressão radicular importante.',
        criteria: (answers: any) => {
          const mios = ['forca_l2_esq', 'forca_l2_dir', 'forca_l3_esq', 'forca_l3_dir', 'forca_l4_esq', 'forca_l4_dir', 'forca_l5_esq', 'forca_l5_dir', 'forca_s1_esq', 'forca_s1_dir'];
          return mios.some(m => answers[m] && parseInt(answers[m]) < 3);
        }
      },
      {
        id: 'red_flag_cauda_equina_suspect',
        label: 'Red Flag: Suspeita de Cauda Equina',
        level: 'red',
        message: 'Relato de alterações em sela ou disfunção esfincteriana associada a dor lombar súbita. Encaminhamento de EMERGÊNCIA necessário.',
        criteria: (answers: any) => {
            const caudaEquinaFields = ['cauda_esfincter_pos', 'cauda_mmii_pos', 'cauda_perineo_pos'];
            return caudaEquinaFields.some(f => answers[f] === true) ||
                   String(answers['anamnese_texto'] || '').toLowerCase().includes('esfincter') || 
                   String(answers['anamnese_texto'] || '').toLowerCase().includes('sela');
        }
      },
      {
        id: 'yellow_flag_oswestry_high',
        label: 'Yellow Flag: Incapacidade Funcional Elevada',
        level: 'yellow',
        message: 'Índice de Oswestry > 40%. Paciente apresenta limitações funcionais severas que podem retardar o prognóstico.',
        criteria: (answers: any) => {
            const score = parseFloat(String(answers['oswestry_score'] || '0').replace('%', ''));
            return score > 40;
        }
      }
    ],
    sections: [
        {
            id: 'anamnese',
            title: 'Características da Disfunção',
            fields: [
                { id: 'anamnese_texto', label: 'Anamnese', type: 'textarea', rows: 6 },
                { id: 'intensidade_dor', label: 'Intensidade da Dor', type: 'range', min: 0, max: 10, step: 1 },
                { id: 'area_dor', label: 'Área da Dor (Pinte as áreas afetadas)', type: 'bodyschema', image: '/img/esquema_corpo_inteiro.png' },
                { id: 'anamnese_obs', label: 'OBSERVAÇÕES', type: 'textarea' }
            ]
        },
        {
            id: 'exame_neurologico',
            title: 'Exame Neurológico',
            type: 'multi-table',
            subsections: [
                {
                    id: 'miotomos',
                    title: 'Miótomos (Força 0-5)',
                    type: 'table',
                    columns: [
                        'Nível / Movimento', 
                        { label: 'Esquerdo', action: { type: 'fill', value: '5' } }, 
                        { label: 'Direito', action: { type: 'fill', value: '5' } }
                    ],
                    rows: [
                        { id: 'l2_mio', label: 'L2 (Flexão Quadril)', fields: [{ id: 'forca_l2_esq', type: 'select', options: scores0to5 }, { id: 'forca_l2_dir', type: 'select', options: scores0to5 }] },
                        { id: 'l3_mio', label: 'L3 (Extensão Joelho)', fields: [{ id: 'forca_l3_esq', type: 'select', options: scores0to5 }, { id: 'forca_l3_dir', type: 'select', options: scores0to5 }] },
                        { id: 'l4_mio', label: 'L4 (Dorsiflexão)', fields: [{ id: 'forca_l4_esq', type: 'select', options: scores0to5 }, { id: 'forca_l4_dir', type: 'select', options: scores0to5 }] },
                        { id: 'l5_mio', label: 'L5 (Extensão Hálux)', fields: [{ id: 'forca_l5_esq', type: 'select', options: scores0to5 }, { id: 'forca_l5_dir', type: 'select', options: scores0to5 }] },
                        { id: 's1_mio', label: 'S1 (Flexão Plantar)', fields: [{ id: 'forca_s1_esq', type: 'select', options: scores0to5 }, { id: 'forca_s1_dir', type: 'select', options: scores0to5 }] }
                    ]
                },
                {
                    id: 'reflexos',
                    title: 'Reflexos Profundos',
                    type: 'table',
                    columns: [
                        'Reflexo', 
                        { label: 'Esquerdo', action: { type: 'fill', value: 'Normal' } }, 
                        { label: 'Direito', action: { type: 'fill', value: 'Normal' } }
                    ],
                    rows: [
                        { id: 'ref_patelar', label: 'Patelar (L4)', fields: [{ id: 'ref_pat_esq', type: 'select', options: reflexOptions }, { id: 'ref_pat_dir', type: 'select', options: reflexOptions }] },
                        { id: 'ref_aquileu', label: 'Aquileu (S1)', fields: [{ id: 'ref_aqui_esq', type: 'select', options: reflexOptions }, { id: 'ref_aqui_dir', type: 'select', options: reflexOptions }] }
                    ]
                },
                {
                    id: 'testes_especiais_lombar',
                    title: 'Testes Especiais',
                    type: 'table',
                    columns: ['', 'Esquerdo', 'Direito'],
                    rows: [
                        { id: 'hoffmann_l', label: 'Hoffmann', fields: [{ id: 'hoffmann_esq_l', type: 'checkbox' }, { id: 'hoffmann_dir_l', type: 'checkbox' }] },
                        { id: 'babinski_l', label: 'Babinski', fields: [{ id: 'babinski_esq_l', type: 'checkbox' }, { id: 'babinski_dir_l', type: 'checkbox' }] },
                        { id: 'clonus_l', label: 'Clonus', fields: [{ id: 'clonus_esq_l', type: 'checkbox' }, { id: 'clonus_dir_l', type: 'checkbox' }] },
                        { id: 'claudicacao_neuro_l', label: 'Claudicação Neurogênica', fields: [{ id: 'claudicacao_esq_l', type: 'checkbox' }, { id: 'claudicacao_dir_l', type: 'checkbox' }] }
                    ]
                },
                {
                    id: 'sind_cauda_equina',
                    title: 'Sind. Cauda Equina',
                    type: 'table',
                    columns: ['Sintoma', 'Positivo'],
                    rows: [
                        { id: 'cauda_esfincter', label: 'Controle de Esfincter', fields: [{ id: 'cauda_esfincter_pos', type: 'checkbox' }] },
                        { id: 'cauda_mmii', label: 'Anestesia em MMII', fields: [{ id: 'cauda_mmii_pos', type: 'checkbox' }] },
                        { id: 'cauda_perineo', label: 'Anestesia em Períneo', fields: [{ id: 'cauda_perineo_pos', type: 'checkbox' }] }
                    ]
                }
            ],
            fields: [
                { id: 'neuro_lombar_obs', label: 'OBSERVAÇÕES', type: 'textarea' }
            ]
        },
        {
            id: 'avaliacao_do_movimento',
            title: 'Avaliação do Movimento',
            type: 'multi-table',
            subsections: [
                {
                    id: 'movimento_lombar',
                    title: 'Lombar',
                    type: 'table',
                    columns: ['Movimento', 'Graus'],
                    rows: [
                        { id: 'flexao', label: 'Flexão', fields: [{ id: 'flexao_graus', type: 'number', min: 0, max: 60 }] },
                        { id: 'extensao', label: 'Extensão', fields: [{ id: 'extensao_graus', type: 'number', min: 0, max: 25 }] },
                        { id: 'incl_esq', label: 'Inclinação Esquerda', fields: [{ id: 'incl_esq_graus', type: 'number', min: 0, max: 25 }] },
                        { id: 'incl_dir', label: 'Inclinação Direita', fields: [{ id: 'incl_dir_graus', type: 'number', min: 0, max: 25 }] },
                        { id: 'rot_esq', label: 'Rotação Esquerda', fields: [{ id: 'rot_esq_graus', type: 'number', min: 0, max: 30 }] },
                        { id: 'rot_dir', label: 'Rotação Direita', fields: [{ id: 'rot_dir_graus', type: 'number', min: 0, max: 30 }] }
                    ]
                },
                {
                    id: 'mobilidade_quadril',
                    title: 'Quadril',
                    type: 'table',
                    columns: ['Movimento', 'Esquerdo (°)', 'Direito (°)'],
                    rows: [
                        { id: 'flex_quadril', label: 'Flexão', fields: ['flex_quad_esq_graus', 'flex_quad_dir_graus'] },
                        { id: 'rot_med_quadril', label: 'Rot. Medial', fields: ['rot_med_quad_esq_graus', 'rot_med_quad_dir_graus'] },
                        { id: 'rot_lat_quadril', label: 'Rot. Lateral', fields: ['rot_lat_quad_esq_graus', 'rot_lat_quad_dir_graus'] }
                    ]
                }
            ],
            fields: [{ id: 'movimento_lombar_obs', label: 'OBSERVAÇÕES', type: 'textarea' }]
        },
        {
            id: 'irritabilidade',
            title: 'Teste de Irritabilidade',

            type: 'multi-table',
            subsections: [
                {
                    id: 'irritabilidade_t7_t12',
                    title: 'T7 a T12',
                    type: 'table',
                    columns: ['Nível Vertebral', 'Presença de Dor', 'Intensidade (0-10)'],
                    rows: [
                        { id: 't7p', label: 'T7', fields: [{ id: 'palp_t7_dor', type: 'checkbox' }, { id: 'palp_t7_int', type: 'number' }] },
                        { id: 't8p', label: 'T8', fields: [{ id: 'palp_t8_dor', type: 'checkbox' }, { id: 'palp_t8_int', type: 'number' }] },
                        { id: 't9p', label: 'T9', fields: [{ id: 'palp_t9_dor', type: 'checkbox' }, { id: 'palp_t9_int', type: 'number' }] },
                        { id: 't10p', label: 'T10', fields: [{ id: 'palp_t10_dor', type: 'checkbox' }, { id: 'palp_t10_int', type: 'number' }] },
                        { id: 't11p', label: 'T11', fields: [{ id: 'palp_t11_dor', type: 'checkbox' }, { id: 'palp_t11_int', type: 'number' }] },
                        { id: 't12p', label: 'T12', fields: [{ id: 'palp_t12_dor', type: 'checkbox' }, { id: 'palp_t12_int', type: 'number' }] }
                    ]
                },
                {
                    id: 'irritabilidade_l1_sacro',
                    title: 'L1 a Sacro',
                    type: 'table',
                    columns: ['Nível Vertebral', 'Presença de Dor', 'Intensidade (0-10)'],
                    rows: [
                        { id: 'l1p', label: 'L1', fields: [{ id: 'palp_l1_dor', type: 'checkbox' }, { id: 'palp_l1_int', type: 'number' }] },
                        { id: 'l2p', label: 'L2', fields: [{ id: 'palp_l2_dor', type: 'checkbox' }, { id: 'palp_l2_int', type: 'number' }] },
                        { id: 'l3p', label: 'L3', fields: [{ id: 'palp_l3_dor', type: 'checkbox' }, { id: 'palp_l3_int', type: 'number' }] },
                        { id: 'l4p', label: 'L4', fields: [{ id: 'palp_l4_dor', type: 'checkbox' }, { id: 'palp_l4_int', type: 'number' }] },
                        { id: 'l5p', label: 'L5', fields: [{ id: 'palp_l5_dor', type: 'checkbox' }, { id: 'palp_l5_int', type: 'number' }] },
                        { id: 'sacrop', label: 'Sacro', fields: [{ id: 'palp_sacro_dor', type: 'checkbox' }, { id: 'palp_sacro_int', type: 'number' }] }
                    ]
                }
            ],
            fields: [{ id: 'palp_art_l_obs', label: 'OBSERVAÇÕES', type: 'textarea' }]
        },
        {
            id: 'miofascial_neural',
            title: 'Palpação Miofascial e Tensão Neural',
            type: 'multi-table',
            subsections: [
                {

                    id: 'miofascial_sub',
                    title: 'Palpação Miofascial',
                    type: 'table',
                    columns: ['Estrutura', 'Esquerdo', 'Direito'],
                    rows: [
                        { id: 'quadrado_lombar', label: 'M. Quadrado Lombar', fields: [{ id: 'mio_quadrado_lombar_esq', type: 'checkbox' }, { id: 'mio_quadrado_lombar_dir', type: 'checkbox' }] },
                        { id: 'gluteo_maximo', label: 'M. Glúteo Máximo', fields: [{ id: 'mio_gluteo_maximo_esq', type: 'checkbox' }, { id: 'mio_gluteo_maximo_dir', type: 'checkbox' }] },
                        { id: 'gluteo_medio', label: 'M. Glúteo Médio', fields: [{ id: 'mio_gluteo_medio_esq', type: 'checkbox' }, { id: 'mio_gluteo_medio_dir', type: 'checkbox' }] },
                        { id: 'gluteo_minimo', label: 'M. Glúteo Mínimo', fields: [{ id: 'mio_gluteo_minimo_esq', type: 'checkbox' }, { id: 'mio_gluteo_minimo_dir', type: 'checkbox' }] },
                        { id: 'piriforme', label: 'M. Piriforme', fields: [{ id: 'mio_piriforme_esq', type: 'checkbox' }, { id: 'mio_piriforme_dir', type: 'checkbox' }] },
                        { id: 'tfl', label: 'M. Tensor da Fáscia Lata', fields: [{ id: 'mio_tfl_esq', type: 'checkbox' }, { id: 'mio_tfl_dir', type: 'checkbox' }] },
                        { id: 'iliopsoas', label: 'M. Iliopsoas', fields: [{ id: 'mio_iliopsoas_esq', type: 'checkbox' }, { id: 'mio_iliopsoas_dir', type: 'checkbox' }] },
                        { id: 'outro', label: 'M. Outro', fields: [{ id: 'mio_outro_esq', type: 'checkbox' }, { id: 'mio_outro_dir', type: 'checkbox' }] }
                    ]
                },
                {
                    id: 'tensao_neural_sub',
                    title: 'Teste de Tensão Neural',
                    type: 'table',
                    columns: ['Teste / Nervo', 'Esquerdo', 'Direito'],
                    rows: [
                        { id: 'lasegue', label: 'Teste de Lasegue', fields: [{ id: 'tensao_lasegue_esq', type: 'checkbox' }, { id: 'tensao_lasegue_dir', type: 'checkbox' }] },
                        { id: 'slump', label: 'SLUMP', fields: [{ id: 'tensao_slump_esq', type: 'checkbox' }, { id: 'tensao_slump_dir', type: 'checkbox' }] },
                        { id: 'nervo_femoral', label: 'Nervo Femoral', fields: [{ id: 'tensao_femoral_esq', type: 'checkbox' }, { id: 'tensao_femoral_dir', type: 'checkbox' }] }
                    ]
                }
            ],
            fields: [
                { id: 'miofascial_neural_obs_geral', label: 'OBSERVAÇÕES', type: 'textarea' }

            ]
        },
        {
            id: 'testes_resistencia',
            title: 'Testes de Resistência Muscular',
            type: 'table',
            columns: ['Teste', 'Tempo (s)', 'Percentual (%)', 'Resultado'],
            rows: [
                { id: 'res_60_row', label: 'Flexão a 60º - Isometria Anterior', fields: ['flexao_60', { id: 'flexao_60_pct', isCalculated: true }, 'flexao_60_res'] },
                { id: 'res_sorensen_row', label: 'Teste de Sorensen - Isometria Posterior', fields: ['sorensen', { id: 'sorensen_pct', isCalculated: true }, 'sorensen_res'] },
                { id: 'res_prancha_row', label: 'Prancha - Estabilidade de CORE', fields: ['prancha', { id: 'prancha_pct', isCalculated: true }, 'prancha_res'] },
                { id: 'res_prancha_lat_esq_row', label: 'Prancha Lateral Esquerda', fields: ['prancha_lat_esq', { id: 'prancha_lat_esq_pct', isCalculated: true }, 'prancha_lat_esq_res'] },
                { id: 'res_prancha_lat_dir_row', label: 'Prancha Lateral Direita', fields: ['prancha_lat_dir', { id: 'prancha_lat_dir_pct', isCalculated: true }, 'prancha_lat_dir_res'] }
            ],
            fields: [
                { id: 'testes_obs', label: 'Observações Adicionais', type: 'textarea' }
            ]
        },
        {
            id: 'forca_quadril_lombar',
            title: 'Dinamometria Muscular de Quadril (kgF)',
            type: 'table',
            columns: ['Movimento', 'Esquerdo', 'Direito', 'DÉFICIT %', 'Resultado'],
            rows: [
                { id: 'flex_q_forca_lom', label: 'Flexão de Quadril', fields: ['f_flex_q_esq_lom', 'f_flex_q_dir_lom', 'f_flex_q_def_lom', 'f_flex_q_res_lom'] },
                { id: 'abd_q_forca_lom', label: 'Abdução de Quadril', fields: ['f_abd_q_esq_lom', 'f_abd_q_dir_lom', 'f_abd_q_def_lom', 'f_abd_q_res_lom'] },
                { id: 'ext_q_forca_lom', label: 'Extensão de Quadril', fields: ['f_ext_q_esq_lom', 'f_ext_q_dir_lom', 'f_ext_q_def_lom', 'f_ext_q_res_lom'] }
            ],
            fields: [{ id: 'forca_quadril_obs', label: 'OBSERVAÇÕES', type: 'textarea' }]
        },
        {
            id: 'oswestry_integracao',
            title: 'ODI (Índice de Incapacidade de Oswestry)',
            fields: [
                { id: 'oswestry_novo', label: 'Preencher novo Questionário ODI', type: 'button' },
                { id: 'oswestry_score', label: 'Resultado/Score ODI Atual', type: 'text' }
            ]
        },
        {
            id: 'diagnostico_conclusoes',
            title: 'Diagnóstico e Conclusões',
            fields: [
                { id: 'diagnostico', label: 'Diagnóstico Cinético Funcional', type: 'textarea' },
                { id: 'conclusao', label: 'Conclusões e Sugestões Terapêuticas', type: 'textarea' }
            ]
        }
    ],
    calculateScore: (answers: Record<string, any>) => ({ score: 0, max: 0, percentage: 100, interpretation: 'Avaliação Concluída', unit: '%' })
  },
  quickdash: {
    id: 'quickdash',
    segment: 'ombro',
    title: 'Quick DASH',
    description: 'Questionário para avaliar sintomas e capacidade física focado no ombro, braço e mão.',
    questions: [
        { text: 'Instrução: Por favor, gradue a sua capacidade para realizar as atividades abaixo, na ÚLTIMA SEMANA, assinalando a opção correspondente.', isInstruction: true },
        { id: 'q1', text: '1. Abrir um vidro novo com tampa de rosca ou muito apertada.', options: [{ value: 1, label: 'Nenhuma Dificuldade' }, { value: 2, label: 'Pouca Dificuldade' }, { value: 3, label: 'Média Dificuldade' }, { value: 4, label: 'Muita Dificuldade' }, { value: 5, label: 'Incapaz de Fazer' }] },
        { id: 'q2', text: '2. Fazer trabalhos domésticos pesados (ex.: lavar o chão, lavar paredes, etc.).', options: [{ value: 1, label: 'Nenhuma Dificuldade' }, { value: 2, label: 'Pouca Dificuldade' }, { value: 3, label: 'Média Dificuldade' }, { value: 4, label: 'Muita Dificuldade' }, { value: 5, label: 'Incapaz de Fazer' }] },
        { id: 'q3', text: '3. Carregar uma sacola de compras pesada ou mala.', options: [{ value: 1, label: 'Nenhuma Dificuldade' }, { value: 2, label: 'Pouca Dificuldade' }, { value: 3, label: 'Média Dificuldade' }, { value: 4, label: 'Muita Dificuldade' }, { value: 5, label: 'Incapaz de Fazer' }] },
        { id: 'q4', text: '4. Lavar as costas.', options: [{ value: 1, label: 'Nenhuma Dificuldade' }, { value: 2, label: 'Pouca Dificuldade' }, { value: 3, label: 'Média Dificuldade' }, { value: 4, label: 'Muita Dificuldade' }, { value: 5, label: 'Incapaz de Fazer' }] },
        { id: 'q5', text: '5. Usar uma faca para cortar os alimentos.', options: [{ value: 1, label: 'Nenhuma Dificuldade' }, { value: 2, label: 'Pouca Dificuldade' }, { value: 3, label: 'Média Dificuldade' }, { value: 4, label: 'Muita Dificuldade' }, { value: 5, label: 'Incapaz de Fazer' }] },
        { id: 'q6', text: '6. Atividades recreacionais de lazer em que você aplica alguma força com o seu braço, ombro ou mão.', options: [{ value: 1, label: 'Nenhuma Dificuldade' }, { value: 2, label: 'Pouca Dificuldade' }, { value: 3, label: 'Média Dificuldade' }, { value: 4, label: 'Muita Dificuldade' }, { value: 5, label: 'Incapaz de Fazer' }] },
        { id: 'q7', text: '7. O problema no braço, ombro ou mão impediu-o de realizar suas atividades sociais e normais na ÚLTIMA SEMANA?', options: [{ value: 1, label: 'De Forma Nenhuma' }, { value: 2, label: 'Dificultou um Pouco' }, { value: 3, label: 'Dificultou Moderadamente' }, { value: 4, label: 'Dificultou Bastante' }, { value: 5, label: 'Impediu Totalmente' }] },
        { id: 'q8', text: '8. O problema no braço, ombro ou mão limitou as suas atividades normais de trabalho ou cotidiano?', options: [{ value: 1, label: 'Não Limitou nada' }, { value: 2, label: 'Limitou um Pouco' }, { value: 3, label: 'Limitou Moderadamente' }, { value: 4, label: 'Limitou Bastante' }, { value: 5, label: 'Impediu Totalmente' }] },
        { text: 'Instrução: Por favor, gradue a intensidade dos sintomas que você sentiu na ÚLTIMA SEMANA.', isInstruction: true },
        { id: 'q9', text: '9. Dor no braço, ombro ou mão.', options: [{ value: 1, label: 'Nenhuma Dor' }, { value: 2, label: 'Dor Leve' }, { value: 3, label: 'Dor Moderada' }, { value: 4, label: 'Dor Severa' }, { value: 5, label: 'Dor Extrema' }] },
        { id: 'q10', text: '10. Sensação de formigamento ou dormência no seu braço, ombro ou mão.', options: [{ value: 1, label: 'Nenhum sintoma' }, { value: 2, label: 'De Leve intensidade' }, { value: 3, label: 'De Média intensidade' }, { value: 4, label: 'De Muita intensidade' }, { value: 5, label: 'Extremo' }] },
        { id: 'q11', text: '11. dificuldade para dormir por causa de dor no seu braço, ombro ou mão?', options: [{ value: 1, label: 'Nenhuma Dificuldade' }, { value: 2, label: 'Pouca Dificuldade' }, { value: 3, label: 'Moderada' }, { value: 4, label: 'Muita Dificuldade' }, { value: 5, label: 'Extrema' }] }
    ],
    calculateScore: (answers: Record<string, any>) => {
        const values = Object.entries(answers)
            .filter(([k, v]) => !isNaN(Number(k)) && v !== undefined && v !== "" && typeof v !== 'boolean')
            .map(([_, v]) => Number(v))
            .filter(v => !isNaN(v));
            
        if (values.length < 10) return { score: 0, percentage: 0, interpretation: 'Mínimo de 10 respostas obrigatórias', unit: '%' };
        const sum = values.reduce((a, b) => a + b, 0);
        const finalScore = ((sum / values.length) - 1) * 25;
        const scoreRounded = Math.round(finalScore * 10) / 10;
        return {
            score: scoreRounded,
            max: 100,
            percentage: scoreRounded,
            interpretation: scoreRounded <= 20 ? 'Excelente' : scoreRounded <= 40 ? 'Bom' : scoreRounded <= 60 ? 'Regular' : 'Ruim',
            unit: '%'
        };
    }
  },
  afOmbro: {
    id: 'afOmbro',
    segment: 'ombro',
    title: 'Avaliação Funcional de Ombro',
    description: 'Protocolo completo de avaliação do complexo do ombro, escapulotorácica e força muscular.',
    clinicalFlags: [
      {
        id: 'red_flag_instability',
        label: 'Red Flag: Instabilidade Articular',
        level: 'red',
        message: 'Teste de apreensão positivo detectado. Alto risco de luxação ou lesão labral complexa. Evite manobras de amplitude extrema até diagnóstico por imagem.',
        criteria: (answers: any) => answers['apreensao_esq'] === true || answers['apreensao_dir'] === true
      },
      {
        id: 'yellow_flag_strength_deficit',
        label: 'Yellow Flag: Déficit de Força Significativo',
        level: 'yellow',
        message: 'Déficit de força importante detectado entre os membros (> 25%). Pode indicar lesão tendínea parcial ou inibição por dor.',
        criteria: (answers: any) => {
          const deficits = ['forca_abd_deficit', 'forca_rl_deficit', 'forca_rm_deficit'];
          return deficits.some(d => {
            const val = answers[d];
            if (!val) return false;
            const num = parseInt(val.replace('%', ''));
            return num >= 25;
          });
        }
      }
    ],
    sections: [
        {
            id: 'anamnese',
            title: 'Características da Disfunção',
            fields: [
                { id: 'anamnese_texto', label: 'Anamnese', type: 'textarea', rows: 6 },
                { id: 'intensidade_dor', label: 'Intensidade da Dor', type: 'range', min: 0, max: 10, step: 1 },
                { id: 'area_dor', label: 'Área da Dor (Pinte as áreas afetadas)', type: 'bodyschema', image: '/img/esquema_corpo_inteiro.png' },
                { id: 'exames_complementares', label: 'Exames Complementares', type: 'textarea' }
            ]
        },
        {
            id: 'adm_ombro',
            title: 'Amplitude de Movimento (Graus)',
            type: 'multi-table',
            subsections: [
                {
                    id: 'adm_ombro_esq',
                    title: 'Ombro Esquerdo',
                    type: 'table',
                    columns: ['Movimento', 'Ativa', 'Passiva', 'Déficit'],
                    rows: [
                        { id: 'flexao_e', label: 'Flexão', fields: [{ id: 'flexao_ativa_e', type: 'number', min: 0, max: 180 }, { id: 'flexao_passiva_e', type: 'number', min: 0, max: 180 }, 'flexao_deficit_e'] },
                        { id: 'extensao_e', label: 'Extensão', fields: [{ id: 'extensao_ativa_e', type: 'number', min: 0, max: 60 }, { id: 'extensao_passiva_e', type: 'number', min: 0, max: 60 }, 'extensao_deficit_e'] },
                        { id: 'abd_frontal_e', label: 'Abdução Frontal', fields: [{ id: 'abd_f_ativa_e', type: 'number', min: 0, max: 180 }, { id: 'abd_f_passiva_e', type: 'number', min: 0, max: 180 }, 'abd_f_deficit_e'] },
                        { id: 'rot_med_e', label: 'Rotação Medial', fields: [{ id: 'rm_ativa_e', type: 'number', min: 0, max: 90 }, { id: 'rm_passiva_e', type: 'number', min: 0, max: 90 }, 'rm_deficit_e'] },
                        { id: 'rot_lat_e', label: 'Rotação Lateral', fields: [{ id: 'rl_ativa_e', type: 'number', min: 0, max: 90 }, { id: 'rl_passiva_e', type: 'number', min: 0, max: 90 }, 'rl_deficit_e'] }
                    ]
                },
                {
                    id: 'adm_ombro_dir',
                    title: 'Ombro Direito',
                    type: 'table',
                    columns: ['Movimento', 'Ativa', 'Passiva', 'Déficit'],
                    rows: [
                        { id: 'flexao_d', label: 'Flexão', fields: [{ id: 'flexao_ativa_d', type: 'number', min: 0, max: 180 }, { id: 'flexao_passiva_d', type: 'number', min: 0, max: 180 }, 'flexao_deficit_d'] },
                        { id: 'extensao_d', label: 'Extensão', fields: [{ id: 'extensao_ativa_d', type: 'number', min: 0, max: 60 }, { id: 'extensao_passiva_d', type: 'number', min: 0, max: 60 }, 'extensao_deficit_d'] },
                        { id: 'abd_frontal_d', label: 'Abdução Frontal', fields: [{ id: 'abd_f_ativa_d', type: 'number', min: 0, max: 180 }, { id: 'abd_f_passiva_d', type: 'number', min: 0, max: 180 }, 'abd_f_deficit_d'] },
                        { id: 'rot_med_d', label: 'Rotação Medial', fields: [{ id: 'rm_ativa_d', type: 'number', min: 0, max: 90 }, { id: 'rm_passiva_d', type: 'number', min: 0, max: 90 }, 'rm_deficit_d'] },
                        { id: 'rot_lat_d', label: 'Rotação Lateral', fields: [{ id: 'rl_ativa_d', type: 'number', min: 0, max: 90 }, { id: 'rl_passiva_d', type: 'number', min: 0, max: 90 }, 'rl_deficit_d'] }
                    ]
                }
            ],
            fields: [{ id: 'adm_ombro_obs', label: 'OBSERVAÇÕES', type: 'textarea' }]
        },
        {
            id: 'testes_especiais',
            title: 'Testes Especiais e Funcionais',
            type: 'multi-table',
            subsections: [
                {
                    id: 'testes_impacto_instabilidade',
                    title: 'Impacto e Instabilidade',
                    type: 'table',
                    columns: ['Teste', 'Esquerdo', 'Direito'],
                    rows: [
                        { id: 'neer', label: 'Neer (Impacto)', fields: [{ id: 'neer_esq', type: 'checkbox' }, { id: 'neer_dir', type: 'checkbox' }] },
                        { id: 'hawkins', label: 'Hawkins-Kennedy (Impacto)', fields: [{ id: 'hawkins_esq', type: 'checkbox' }, { id: 'hawkins_dir', type: 'checkbox' }] },
                        { id: 'job', label: 'Jobe (Supraespinhal)', fields: [{ id: 'job_esq', type: 'checkbox' }, { id: 'job_dir', type: 'checkbox' }] },
                        { id: 'patte', label: 'Patte (Infraespinhal)', fields: [{ id: 'patte_esq', type: 'checkbox' }, { id: 'patte_dir', type: 'checkbox' }] },
                        { id: 'gerber', label: 'Gerber (Subescapular)', fields: [{ id: 'gerber_esq', type: 'checkbox' }, { id: 'gerber_dir', type: 'checkbox' }] },
                        { id: 'speed', label: 'Speed (Bíceps)', fields: [{ id: 'speed_esq', type: 'checkbox' }, { id: 'speed_dir', type: 'checkbox' }] },
                        { id: 'apreensao', label: 'Apreensão (Instabilidade)', fields: [{ id: 'apreensao_esq', type: 'checkbox' }, { id: 'apreensao_dir', type: 'checkbox' }] }
                    ]
                },
                {
                    id: 'testes_ckcuest',
                    title: 'Teste Funcional (CKCUEST)',
                    type: 'table',
                    columns: ['Teste', 'Esquerdo (toques)', 'Resultado Esq.', 'Direito (toques)', 'Resultado Dir.'],
                    rows: [
                        { id: 'ckcuest', label: 'CKCUEST (Nº de toques)', fields: ['ckcuest_esq', 'ckcuest_res_esq', 'ckcuest_dir', 'ckcuest_res_dir'] }
                    ],
                    fields: [
                        { id: 'ckc_ref', label: '* ≥ 21 toques: retorno aos treinos / ≥ 25 toques: retorno ao esporte overhead', type: 'info' }
                    ]
                },
                {
                    id: 'testes_fadiga',
                    title: 'Teste de Fadiga',
                    type: 'table',
                    columns: ['Teste', 'Esquerdo (s)', 'Resultado Esq.', 'Direito (s)', 'Resultado Dir.'],
                    rows: [
                        { id: 'fadiga_serratil', label: 'Fadiga Serrátil Anterior (> 109,5s)', fields: ['fadiga_serratil_esq', 'fadiga_serratil_res_esq', 'fadiga_serratil_dir', 'fadiga_serratil_res_dir'] }
                    ]
                }
            ],
            fields: [{ id: 'testes_especiais_obs', label: 'Observações Especiais', type: 'textarea' }]
        },
        {
            id: 'palpacao_miofascial',
            title: 'Palpação Miofascial (Pontos Gatilhos)',
            type: 'table',
            columns: ['Músculo', 'Esquerdo', 'Direito'],
            rows: [
                { id: 'trapezio_sup', label: 'Trapézio Superior', fields: [{ id: 'trapezio_sup_esq', type: 'checkbox' }, { id: 'trapezio_sup_dir', type: 'checkbox' }] },
                { id: 'deltoide_ant', label: 'Deltoide Anterior', fields: [{ id: 'deltoide_ant_esq', type: 'checkbox' }, { id: 'deltoide_ant_dir', type: 'checkbox' }] },
                { id: 'deltoide_med', label: 'Deltoide Médio', fields: [{ id: 'deltoide_med_esq', type: 'checkbox' }, { id: 'deltoide_med_dir', type: 'checkbox' }] },
                { id: 'deltoide_pos', label: 'Deltoide Posterior', fields: [{ id: 'deltoide_pos_esq', type: 'checkbox' }, { id: 'deltoide_pos_dir', type: 'checkbox' }] },
                { id: 'peitoral_maior', label: 'Peitoral Maior', fields: [{ id: 'peitoral_maior_esq', type: 'checkbox' }, { id: 'peitoral_maior_dir', type: 'checkbox' }] },
                { id: 'peitoral_menor', label: 'Peitoral Menor', fields: [{ id: 'peitoral_menor_esq', type: 'checkbox' }, { id: 'peitoral_menor_dir', type: 'checkbox' }] },
                { id: 'subclavio', label: 'Subclávio', fields: [{ id: 'subclavio_esq', type: 'checkbox' }, { id: 'subclavio_dir', type: 'checkbox' }] },
                { id: 'grande_dorsal', label: 'Grande Dorsal', fields: [{ id: 'grande_dorsal_esq', type: 'checkbox' }, { id: 'grande_dorsal_dir', type: 'checkbox' }] },
                { id: 'redondo_menor', label: 'Redondo Menor', fields: [{ id: 'redondo_menor_esq', type: 'checkbox' }, { id: 'redondo_menor_dir', type: 'checkbox' }] },
                { id: 'supra_espinhoso', label: 'Supra Espinhoso', fields: [{ id: 'supra_espinhoso_esq', type: 'checkbox' }, { id: 'supra_espinhoso_dir', type: 'checkbox' }] },
                { id: 'infraespinhoso', label: 'Infraespinhoso', fields: [{ id: 'infraespinhoso_esq', type: 'checkbox' }, { id: 'infraespinhoso_dir', type: 'checkbox' }] },
                { id: 'romboide', label: 'Romboide', fields: [{ id: 'romboide_esq', type: 'checkbox' }, { id: 'romboide_dir', type: 'checkbox' }] },
                { id: 'extensores_toracicos', label: 'Extensores Torácicos', fields: [{ id: 'extensores_toracicos_esq', type: 'checkbox' }, { id: 'extensores_toracicos_dir', type: 'checkbox' }] },
                { id: 'biceps', label: 'Bíceps', fields: [{ id: 'biceps_esq', type: 'checkbox' }, { id: 'biceps_dir', type: 'checkbox' }] },
                { id: 'triceps', label: 'Tríceps', fields: [{ id: 'triceps_esq', type: 'checkbox' }, { id: 'triceps_dir', type: 'checkbox' }] }
            ],
            fields: [{ id: 'palpacao_obs', label: 'Observações Miofasciais', type: 'textarea' }]
        },
        {
            id: 'dinamometria',
            title: 'Força Muscular do Ombro (kgF) - Torque',
            type: 'table',
            columns: ['Movimento', 'Esquerdo', 'Direito', '% Déficit', 'Resultado'],
            rows: [
                { id: 'abd_forca', label: 'Abdução', fields: ['forca_abd_esq', 'forca_abd_dir', 'forca_abd_deficit', 'forca_abd_deficit_res'] },
                { id: 'rl_forca', label: 'Rotadores Laterais (RL)', fields: ['forca_rl_esq', 'forca_rl_dir', 'forca_rl_deficit', 'forca_rl_deficit_res'] },
                { id: 'rm_forca', label: 'Rotadores Mediais (RM)', fields: ['forca_rm_esq', 'forca_rm_dir', 'forca_rm_deficit', 'forca_rm_deficit_res'] },
                { id: 'ratio_forca', label: 'Relação RL/RM (76%)', fields: ['rl_rm_ratio_esq', 'rl_rm_ratio_dir', '-', '-'] }
            ],
            fields: [{ id: 'forca_obs', label: 'Observações de Força', type: 'textarea' }]
        },
        {
            id: 'quickdash_integracao',
            title: 'QuickDASH (Disabilities of the Arm, Shoulder and Hand)',
            fields: [
                { id: 'quickdash_novo', label: 'Preencher novo QuickDASH', type: 'button' }

            ]
        },
        {
            id: 'diagnostico_conclusoes',
            title: 'Diagnóstico e Conclusões',
            fields: [
                { id: 'diagnostico', label: 'Diagnóstico Cinético Funcional', type: 'textarea' },
                { id: 'conclusao', label: 'Metas e Conduta Terapêutica', type: 'textarea' }
            ]
        }
    ]
  },
  afGeriatria: {
    id: 'afGeriatria',
    type: 'clinical',
    segment: 'geriatria',
    title: 'Avaliação Funcional Geriátrica',
    description: 'Avaliação clínica e testes funcionais (mobilidade, força e equilíbrio) específicos para idosos.',
    clinicalFlags: [
      {
        id: 'red_flag_fall_risk',
        label: 'Red Flag: Alto Risco de Quedas',
        level: 'red',
        message: 'O paciente apresenta critérios de alto risco para quedas (TUG > 12.4s ou Apoio Unipodal < 10s). Recomenda-se intervenção imediata focada em equilíbrio e segurança domiciliar.',
        criteria: (answers: any) => {
          const tug = parseFloat(String(answers['tug'] || '0').replace(',', '.'));
          const unipEsq = parseFloat(String(answers['unipodal_esq'] || '11').replace(',', '.'));
          const unipDir = parseFloat(String(answers['unipodal_dir'] || '11').replace(',', '.'));
          return (tug >= 12.4 && tug > 0) || (unipEsq < 10 && answers['unipodal_esq'] !== undefined) || (unipDir < 10 && answers['unipodal_dir'] !== undefined);
        }
      },
      {
        id: 'yellow_flag_frailty',
        label: 'Yellow Flag: Sinais de Fragilidade',
        level: 'yellow',
        message: 'Velocidade de marcha reduzida (< 0.8 m/s). Indicativo de fragilidade física inicial e maior vulnerabilidade a desfechos negativos de saúde.',
        criteria: (answers: any) => {
          const vel = parseFloat(String(answers['vel_marcha'] || '1').replace(',', '.'));
          return vel < 0.8 && vel > 0;
        }
      }
    ],
    sections: [
        {
            id: 'anamnese',
            title: 'Anamnese e Exames',
            fields: [
                { id: 'queixa', label: 'Queixa Principal', type: 'textarea' },
                { id: 'intensidade_dor', label: 'Intensidade da Dor', type: 'range', min: 0, max: 10, step: 1 },
                { id: 'area_dor', label: 'Área da Dor (Pinte as áreas afetadas)', type: 'bodyschema', image: '/img/esquema_corpo_inteiro.png' },
                { id: 'historia', label: 'História Atual e Pregressa', type: 'textarea' },
                { id: 'exames', label: 'Exames Complementares', type: 'textarea' }
            ]
        },
        {
            id: 'adm',
            title: 'Exame Físico - Amplitude de Movimento (ADM)',
            type: 'table',
            columns: ['Movimento', 'Esquerdo', 'Direito'],
            rows: [
                { id: 'adm_quadril', label: 'Flexão de Quadril', fields: ['adm_quadril_esq', 'adm_quadril_dir'] },
                { id: 'extensao_joelho', label: 'Extensão do Joelho', fields: ['ext_joelho_esq', 'ext_joelho_dir'] },
                { id: 'flexao_joelho', label: 'Flexão do Joelho', fields: ['flex_joelho_esq', 'flex_joelho_dir'] },
                { id: 'dorsiflexao', label: 'Dorsiflexão', fields: ['dorsi_esq', 'dorsi_dir'] },
                { id: 'flexao_plantar', label: 'Flexão Plantar', fields: ['plantar_esq', 'plantar_dir'] }
            ],
            fields: [{ id: 'adm_geriatria_obs', label: 'Observações', type: 'textarea' }]
        },
        {
            id: 'testes_equilibrio',
            title: 'Testes de Equilíbrio Estático',
            type: 'table',
            columns: ['Teste', 'Tempo (s)', 'Resultado'],
            rows: [
                { id: 'pes_juntos_row', label: 'Pés Juntos (Obj: 30s)', fields: ['pes_juntos', 'pes_juntos_res'] },
                { id: 'semi_tandem_row', label: 'Semi-tandem (Obj: 30s)', fields: ['semi_tandem', 'semi_tandem_res'] },
                { id: 'tandem_row', label: 'Tandem (Obj: >17.56s)', fields: ['tandem', 'tandem_res'] }
            ]
        },
        {
            id: 'equilibrio_funcional',
            title: 'Testes de Equilíbrio Unipodal / Dinâmico',
            type: 'table',
            columns: ['Teste', 'Valor', 'Resultado'],
            rows: [
                { id: 'unipodal_dir_row', label: 'Apoio Unipodal Direita (Obj: >10s)', fields: ['unipodal_dir', 'unipodal_dir_res'] },
                { id: 'unipodal_esq_row', label: 'Apoio Unipodal Esquerda (Obj: >10s)', fields: ['unipodal_esq', 'unipodal_esq_res'] },
                { id: 'toques_consecutivos_row', label: 'Oito Toques Consecutivos (Obj: 8 ou mais)', fields: ['toques_valor', 'toques_res'] }
            ]
        },
        {
            id: 'levantar_braco',
            title: 'Em pé: Levantar o Braço (Ajuste antecipatório)',
            fields: [
                { id: 'levantar_braco_res', label: 'Realizou os ajustes necessários sem desequilibrar?', type: 'select', options: ['Bom Equilíbrio', 'Dificuldade em Equilibrar-se'] }
            ]
        },
        {
            id: 'testes_mobilidade',
            title: 'Testes de Mobilidade e Força',
            type: 'table',
            columns: ['Teste', 'Resultado', 'Classificação'],
            rows: [
                { id: 'tug_row', label: 'TUG (Obj: <12.47s)', fields: ['tug', 'tug_res'] },
                { id: 'vel_marcha_row', label: 'Velocidade da Marcha (Obj: >0.8m/s)', fields: ['vel_marcha', 'vel_marcha_res'] },
                { id: 'sentar_levantar_row', label: 'Sentar/Levantar 5x', fields: ['sentar_levantar', 'sentar_levantar_res'] }
            ]
        },
        {
            id: 'teste_forca',
            title: 'Teste de Força',
            type: 'table',
            columns: ['Teste', 'Esq.', 'Resultado Esq.', 'Dir.', 'Resultado Dir.'],
            rows: [
                { id: 'preensao_palmar_row', label: 'Força de Preensão Palmar (Obj: >16kg F / >27kg M)', fields: ['preensao_esq', 'preensao_res_esq', 'preensao_dir', 'preensao_res_dir'] }
            ],
            chart: 'normative_strength'
        },
        {
            id: 'questionarios_geriatria_integracao',
            title: 'Questionários Complementares',
            fields: [
                { id: 'man_novo', label: 'Preencher novo MAN', type: 'button' },
                { id: 'ves13_novo', label: 'Preencher novo VES-13', type: 'button' },
                { id: 'lbpq_novo', label: 'Preencher novo LBPQ', type: 'button' },
                { id: 'brief_novo', label: 'Preencher novo BPI-SF', type: 'button' }
            ]
        },
        {
            id: 'resultados_diagnostico',
            title: 'Resultados, Diagnóstico e Risco de Quedas',
            fields: [
                { id: 'diagnostico_funcional', label: 'Resultados e Diagnóstico Funcional', type: 'textarea' },
                { id: 'risco_quedas', label: 'Classificação do Risco de Quedas', type: 'textarea' }
            ]
        },
        {
            id: 'sugestoes',
            title: 'Sugestões Terapêuticas',
            fields: [
                { id: 'sugestoes_obs', label: 'Sugestões e Considerações Terapêuticas', type: 'textarea' }
            ]
        }
    ],
    calculateScore: () => ({ score: 0, max: 0, percentage: 100, interpretation: 'Avaliação Concluída', unit: '%' })
  },
  man: {
    id: 'man',
    segment: 'geriatria',
    title: 'MAN - Mini Avaliação Nutricional',
    description: 'Ferramenta validada para identificar idosos desnutridos ou em risco de desnutrição.',
    questions: [
        { text: 'TRIAGEM (Parte 1 — máximo 14 pontos)', isInstruction: true },
        {
            text: 'A. Nos últimos 3 meses, houve diminuição da ingesta alimentar devido a perda de apetite, problemas digestivos ou dificuldade para mastigar ou deglutir?',
            options: [
                { value: 0, label: 'Diminuição grave da ingesta' },
                { value: 1, label: 'Diminuição moderada da ingesta' },
                { value: 2, label: 'Sem diminuição da ingesta' }
            ]
        },
        {
            text: 'B. Perda de peso nos últimos 3 meses.',
            options: [
                { value: 0, label: 'Superior a 3 kg' },
                { value: 1, label: 'Não sabe informar' },
                { value: 2, label: 'Entre 1 e 3 kg' },
                { value: 3, label: 'Sem perda de peso' }
            ]
        },
        {
            text: 'C. Mobilidade.',
            options: [
                { value: 0, label: 'Restrito ao leito ou à cadeira de rodas' },
                { value: 1, label: 'Deambula, mas não é capaz de sair de casa' },
                { value: 2, label: 'Normal' }
            ]
        },
        {
            text: 'D. Passou por algum estresse psicológico ou doença aguda nos últimos 3 meses?',
            options: [
                { value: 0, label: 'Sim' },
                { value: 2, label: 'Não' }
            ]
        },
        {
            text: 'E. Problemas neuropsicológicos.',
            options: [
                { value: 0, label: 'Demência ou depressão grave' },
                { value: 1, label: 'Demência ligeira' },
                { value: 2, label: 'Sem problemas psicológicos' }
            ]
        },
        {
            text: 'F1. Índice de Massa Corporal (IMC) = [peso (kg)] / [estatura (m)]²',
            options: [
                { value: 0, label: 'IMC < 19' },
                { value: 1, label: '19 ≤ IMC < 21' },
                { value: 2, label: '21 ≤ IMC < 23' },
                { value: 3, label: 'IMC ≥ 23' }
            ]
        },
        { text: 'AVALIAÇÃO (Parte 2 — máximo 16 pontos)', isInstruction: true },
        {
            text: 'G. O paciente vive em sua própria casa (independente)?',
            options: [
                { value: 0, label: 'Não' },
                { value: 1, label: 'Sim' }
            ]
        },
        {
            text: 'H. Utiliza mais de 3 medicamentos diferentes por dia?',
            options: [
                { value: 0, label: 'Sim' },
                { value: 1, label: 'Não' }
            ]
        },
        {
            text: 'I. Lesões de pele ou escaras?',
            options: [
                { value: 0, label: 'Sim' },
                { value: 1, label: 'Não' }
            ]
        },
        {
            text: 'J. Quantas refeições faz por dia?',
            options: [
                { value: 0, label: '1 refeição' },
                { value: 1, label: '2 refeições' },
                { value: 2, label: '3 refeições' }
            ]
        },
        {
            text: 'K. Consumo de proteínas (quantas das 3 opções são "Sim"?): Pelo menos 1 porção diária de leite/derivados? | 2 ou mais porções semanais de leguminosas/ovos? | Carne, peixe ou aves todos os dias?',
            options: [
                { value: 0, label: '0 ou 1 resposta "Sim"' },
                { value: 1, label: '2 respostas "Sim"' },
                { value: 2, label: '3 respostas "Sim"' }
            ]
        },
        {
            text: 'L. Consome 2 ou mais porções diárias de frutas ou hortaliças?',
            options: [
                { value: 0, label: 'Não' },
                { value: 1, label: 'Sim' }
            ]
        },
        {
            text: 'M. Quantos copos de líquidos (água, suco, café, chá, leite) consome por dia?',
            options: [
                { value: 0, label: 'Menos de 3 copos' },
                { value: 1, label: '3 a 5 copos' },
                { value: 2, label: 'Mais de 5 copos' }
            ]
        },
        {
            text: 'N. Modo de se alimentar.',
            options: [
                { value: 0, label: 'Não é capaz de se alimentar sozinho' },
                { value: 1, label: 'Alimenta-se sozinho, porém com dificuldade' },
                { value: 2, label: 'Alimenta-se sozinho, sem dificuldade' }
            ]
        },
        {
            text: 'O. O paciente acredita ter algum problema nutricional?',
            options: [
                { value: 0, label: 'Acredita estar desnutrido' },
                { value: 1, label: 'Não sabe dizer' },
                { value: 2, label: 'Acredita não ter problema nutricional' }
            ]
        },
        {
            text: 'P. Em comparação com outras pessoas da mesma idade, como o paciente considera a sua própria saúde?',
            options: [
                { value: 0, label: 'Pior' },
                { value: 1, label: 'Não sabe' },
                { value: 2, label: 'Igual' },
                { value: 3, label: 'Melhor' }
            ]
        },
        {
            text: 'Q. Perímetro braquial (PB) em cm.',
            options: [
                { value: 0, label: 'PB < 21 cm' },
                { value: 1, label: '21 cm ≤ PB ≤ 22 cm' },
                { value: 2, label: 'PB > 22 cm' }
            ]
        },
        {
            text: 'R. Perímetro da perna (PP) em cm.',
            options: [
                { value: 0, label: 'PP < 31 cm' },
                { value: 1, label: 'PP ≥ 31 cm' }
            ]
        }
    ],
    calculateScore: (answers: Record<string, any>) => {
        const values = Object.entries(answers)
            .filter(([k, v]) => !isNaN(Number(k)) && v !== undefined && v !== "" && typeof v !== 'boolean')
            .map(([_, v]) => Number(v))
            .filter(v => !isNaN(v));
            
        if (values.length === 0) return { score: 0, percentage: 0, interpretation: 'Nenhuma resposta' };
        const totalScore = values.reduce((a, b) => a + b, 0);
        let interpretation = '';
        if (totalScore >= 24) interpretation = 'Estado Nutricional Normal';
        else if (totalScore >= 17) interpretation = 'Risco de Desnutrição';
        else interpretation = 'Desnutrido';
        return { score: totalScore, max: 30, percentage: Math.round((totalScore/30)*100), interpretation, unit: 'pontos' };
    }
  },
  ves13: {
    id: 'ves13',
    segment: 'geriatria',
    title: 'VES-13 — Vulnerable Elders Survey',
    description: 'Rastreamento rápido para identificar idosos em risco de declínio funcional ou morte.',
    questions: [
        { text: 'Instrução: As questões a seguir são sobre a saúde e atividades físicas do paciente. Por favor, responda conforme a condição atual.', isInstruction: true },
        {
            id: 'ves_q1',
            text: '1. Qual é a idade do paciente?',
            options: [
                { value: 0, label: '65 a 74 anos' },
                { value: 1, label: '75 a 84 anos' },
                { value: 3, label: '85 anos ou mais' }
            ]
        },
        {
            id: 'ves_q2',
            text: '2. Em geral, comparando com outras pessoas da sua idade, você diria que sua saúde é:',
            options: [
                { value: 0, label: 'Excelente' },
                { value: 0, label: 'Muito boa' },
                { value: 0, label: 'Boa' },
                { value: 1, label: 'Regular' },
                { value: 1, label: 'Ruim' }
            ]
        },
        { text: 'LIMITAÇÃO FÍSICA — Em média, quanta dificuldade você tem para: (1 ponto para cada "Muita dificuldade" ou "Incapaz", máximo 2 pontos nesta seção)', isInstruction: true },
        {
            id: 'ves_q3a',
            text: '3a. Curvar-se, agachar ou ajoelhar-se?',
            options: [
                { value: 0, label: 'Nenhuma dificuldade' }, { value: 0, label: 'Um pouco de dificuldade' }, { value: 0, label: 'Alguma dificuldade' },
                { value: 1, label: 'Muita dificuldade' }, { value: 1, label: 'Incapaz de fazer' }
            ]
        },
        {
            id: 'ves_q3b',
            text: '3b. Levantar ou carregar objetos com peso aproximado de 5 kg?',
            options: [
                { value: 0, label: 'Nenhuma dificuldade' }, { value: 0, label: 'Um pouco de dificuldade' }, { value: 0, label: 'Alguma dificuldade' },
                { value: 1, label: 'Muita dificuldade' }, { value: 1, label: 'Incapaz de fazer' }
            ]
        },
        {
            id: 'ves_q3c',
            text: '3c. Elevar ou estender os braços acima do nível do ombro?',
            options: [
                { value: 0, label: 'Nenhuma dificuldade' }, { value: 0, label: 'Um pouco de dificuldade' }, { value: 0, label: 'Alguma dificuldade' },
                { value: 1, label: 'Muita dificuldade' }, { value: 1, label: 'Incapaz de fazer' }
            ]
        },
        {
            id: 'ves_q3d',
            text: '3d. Escrever ou manusear e segurar pequenos objetos?',
            options: [
                { value: 0, label: 'Nenhuma dificuldade' }, { value: 0, label: 'Um pouco de dificuldade' }, { value: 0, label: 'Alguma dificuldade' },
                { value: 1, label: 'Muita dificuldade' }, { value: 1, label: 'Incapaz de fazer' }
            ]
        },
        {
            id: 'ves_q3e',
            text: '3e. Andar 400 metros (aproximadamente quatro quarteirões)?',
            options: [
                { value: 0, label: 'Nenhuma dificuldade' }, { value: 0, label: 'Um pouco de dificuldade' }, { value: 0, label: 'Alguma dificuldade' },
                { value: 1, label: 'Muita dificuldade' }, { value: 1, label: 'Incapaz de fazer' }
            ]
        },
        {
            id: 'ves_q3f',
            text: '3f. Fazer serviço doméstico pesado, como esfregar o chão ou limpar janelas?',
            options: [
                { value: 0, label: 'Nenhuma dificuldade' }, { value: 0, label: 'Um pouco de dificuldade' }, { value: 0, label: 'Alguma dificuldade' },
                { value: 1, label: 'Muita dificuldade' }, { value: 1, label: 'Incapaz de fazer' }
            ]
        },
        { text: 'INCAPACIDADES — Por causa da sua saúde ou condição física, você tem dificuldade para: (4 pontos se 1 ou mais respostas "Sim", máximo 4 pontos nesta seção)', isInstruction: true },
        {
            id: 'ves_q4a',
            text: '4a. Fazer compras de itens pessoais (produtos de higiene pessoal ou medicamentos)?',
            options: [ { value: 0, label: 'Não' }, { value: 4, label: 'Sim' } ]
        },
        {
            id: 'ves_q4b',
            text: '4b. Lidar com dinheiro (controlar despesas, gastos ou pagar contas)?',
            options: [ { value: 0, label: 'Não' }, { value: 4, label: 'Sim' } ]
        },
        {
            id: 'ves_q4c',
            text: '4c. Atravessar o quarto andando ou caminhar pela sala?',
            options: [ { value: 0, label: 'Não' }, { value: 4, label: 'Sim' } ]
        },
        {
            id: 'ves_q4d',
            text: '4d. Realizar tarefas domésticas leves (lavar louça, arrumar a casa ou limpeza leve)?',
            options: [ { value: 0, label: 'Não' }, { value: 4, label: 'Sim' } ]
        },
        {
            id: 'ves_q4e',
            text: '4e. Tomar banho sozinho(a) de chuveiro ou banheira?',
            options: [ { value: 0, label: 'Não' }, { value: 4, label: 'Sim' } ]
        }
    ],
    calculateScore: (answers: Record<string, any>) => {
        const getVal = (idx: any) => {
            const val = answers[idx];
            return (val !== undefined && val !== "" && typeof val !== 'boolean') ? Number(val) : undefined;
        };

        let score = 0;
        const q1 = getVal(1);
        if (q1 !== undefined) score += q1; // Q1 age
        const q2 = getVal(2);
        if (q2 !== undefined) score += q2; // Q2 health
        
        // Q3a-3f (physical limitations) - indicies 4 to 9
        let physLimitScore = 0;
        [4,5,6,7,8,9].forEach(idx => { 
            const val = getVal(idx);
            if (val !== undefined) physLimitScore += val; 
        });
        score += Math.min(physLimitScore, 2);

        // Q4a-4e (disabilities) - indicies 11 to 15
        let hasDisability = false;
        [11,12,13,14,15].forEach(idx => { if (getVal(idx) === 4) hasDisability = true; });
        if (hasDisability) score += 4;

        let interpretation = score >= 3 ? 'Idoso Vulnerável' : 'Idoso Robusto';
        return { score, max: 10, percentage: score*10, interpretation, unit: 'pontos' };
    }
  },
  lbpq: {
    id: 'lbpq',
    segment: 'lombar',
    title: 'Questionário Roland Morris',
    description: 'Quando sua região lombar dói, você pode achar difícil fazer algumas das coisas que normalmente faz. Este questionário foi elaborado para que possamos saber como sua dor lombar afetou sua capacidade de se locomover na vida diária. Por favor, leia cada item abaixo. Se você sentir que a descrição se aplica a você hoje, marque a caixa ao lado dela.',
    sections: [
        {
            id: 'roland_morris_funcional',
            title: 'Avaliação Funcional Roland Morris',
            fields: [
                { id: '1', label: '1. Eu fico em casa a maior parte do tempo por causa da minha coluna.', type: 'select', options: ['Não', 'Sim'] },
                { id: '2', label: '2. Eu mudo de posição frequentemente para tentar deixar minha coluna confortável.', type: 'select', options: ['Não', 'Sim'] },
                { id: '3', label: '3. Eu ando mais vagarosamente do que o habitual por causa da minha coluna.', type: 'select', options: ['Não', 'Sim'] },
                { id: '4', label: '4. Por causa da minha coluna, eu não estou fazendo nenhum dos trabalhos que habitualmente faço em casa.', type: 'select', options: ['Não', 'Sim'] },
                { id: '5', label: '5. Por causa da minha coluna, eu uso o corrimão para subir escadas.', type: 'select', options: ['Não', 'Sim'] },
                { id: '6', label: '6. Por causa da minha coluna, eu me deito para descansar mais vezes.', type: 'select', options: ['Não', 'Sim'] },
                { id: '7', label: '7. Por causa da minha coluna, eu tenho que me segurar em algo para me levantar de uma cadeira macia.', type: 'select', options: ['Não', 'Sim'] },
                { id: '8', label: '8. Por causa da minha coluna, eu tento conseguir que outras pessoas façam as coisas para mim.', type: 'select', options: ['Não', 'Sim'] },
                { id: '9', label: '9. Eu me visto mais vagarosamente do que o habitual por causa da minha coluna.', type: 'select', options: ['Não', 'Sim'] },
                { id: '10', label: '10. Eu fico em pé somente por curtos períodos de tempo por causa da minha coluna.', type: 'select', options: ['Não', 'Sim'] },
                { id: '11', label: '11. Por causa da minha coluna, eu tento não me abaixar ou me ajoelhar.', type: 'select', options: ['Não', 'Sim'] },
                { id: '12', label: '12. Eu encontro dificuldade em me levantar de uma cadeira por causa da minha coluna.', type: 'select', options: ['Não', 'Sim'] },
                { id: '13', label: '13. Minha coluna dói quase o tempo todo.', type: 'select', options: ['Não', 'Sim'] },
                { id: '14', label: '14. Eu encontro dificuldade em me virar na cama por causa da minha coluna.', type: 'select', options: ['Não', 'Sim'] },
                { id: '15', label: '15. Meu apetite não é muito bom por causa da minha coluna.', type: 'select', options: ['Não', 'Sim'] },
                { id: '16', label: '16. Eu tenho dificuldade em colocar minhas meias (ou meias calça) por causa da dor na minha coluna.', type: 'select', options: ['Não', 'Sim'] },
                { id: '17', label: '17. Eu ando somente distâncias curtas por causa da minha dor na coluna.', type: 'select', options: ['Não', 'Sim'] },
                { id: '18', label: '18. Eu durmo menos do que o habitual por causa da minha coluna.', type: 'select', options: ['Não', 'Sim'] },
                { id: '19', label: '19. Por causa da minha dor na coluna, eu me deito com ajuda de outra pessoa.', type: 'select', options: ['Não', 'Sim'] },
                { id: '20', label: '20. Eu fico sentado a maior parte do dia por causa da minha coluna.', type: 'select', options: ['Não', 'Sim'] },
                { id: '21', label: '21. Eu evito trabalhos pesados em volta da casa por causa da minha coluna.', type: 'select', options: ['Não', 'Sim'] },
                { id: '22', label: '22. Por causa da minha coluna, eu fico mais irritado e mal humorado com as pessoas do que o habitual.', type: 'select', options: ['Não', 'Sim'] },
                { id: '23', label: '23. Por causa da minha coluna, eu subo escadas mais vagarosamente do que o habitual.', type: 'select', options: ['Não', 'Sim'] },
                { id: '24', label: '24. Eu fico na cama a maior parte do dia por causa da minha coluna.', type: 'select', options: ['Não', 'Sim'] },
                { id: 'lbpq_obs', label: 'Observações Roland Morris', type: 'textarea' }
            ]
        }
    ]
  },
  brief: {
    id: 'brief',
    segment: 'geriatria',
    title: 'Brief Pain Inventory (BPI-SF)',
    description: 'Inventário Breve de Dor: avalia a intensidade da dor e seu impacto nas atividades diárias.',
    questions: [
        { text: 'INTENSIDADE DA DOR (0-10)', isInstruction: true },
        { text: '1. A pior dor que você sentiu nas últimas 24 horas.', options: scores0to5.concat(["6", "7", "8", "9", "10"]).map(v => ({ value: parseInt(v), label: v })) },
        { text: '2. A dor mais fraca que você sentiu nas últimas 24 horas.', options: scores0to5.concat(["6", "7", "8", "9", "10"]).map(v => ({ value: parseInt(v), label: v })) },
        { text: '3. A média da sua dor.', options: scores0to5.concat(["6", "7", "8", "9", "10"]).map(v => ({ value: parseInt(v), label: v })) },
        { text: '4. A dor agora (neste momento).', options: scores0to5.concat(["6", "7", "8", "9", "10"]).map(v => ({ value: parseInt(v), label: v })) },
        { text: 'INTERFERÊNCIA DA DOR (0-10)', isInstruction: true },
        { text: '5. Atividade geral.', options: scores0to5.concat(["6", "7", "8", "9", "10"]).map(v => ({ value: parseInt(v), label: v })) },
        { text: '6. Humor / Disposição.', options: scores0to5.concat(["6", "7", "8", "9", "10"]).map(v => ({ value: parseInt(v), label: v })) },
        { text: '7. Capacidade de caminhar.', options: scores0to5.concat(["6", "7", "8", "9", "10"]).map(v => ({ value: parseInt(v), label: v })) },
        { text: '8. Trabalho normal.', options: scores0to5.concat(["6", "7", "8", "9", "10"]).map(v => ({ value: parseInt(v), label: v })) },
        { text: '9. Relações sociais.', options: scores0to5.concat(["6", "7", "8", "9", "10"]).map(v => ({ value: parseInt(v), label: v })) },
        { text: '10. Sono.', options: scores0to5.concat(["6", "7", "8", "9", "10"]).map(v => ({ value: parseInt(v), label: v })) },
        { text: '11. Aproveitamento da vida.', options: scores0to5.concat(["6", "7", "8", "9", "10"]).map(v => ({ value: parseInt(v), label: v })) }
    ],
    calculateScore: (answers: Record<string, any>) => {
        const getVal = (idx: any) => {
            const val = answers[idx];
            return (val !== undefined && val !== "" && typeof val !== 'boolean') ? Number(val) : undefined;
        };
        const severityIndices = [1, 2, 3, 4];
        const interferenceIndices = [6, 7, 8, 9, 10, 11, 12];
        const sevValues = severityIndices.map(getVal).filter(v => v !== undefined) as number[];
        const intValues = interferenceIndices.map(getVal).filter(v => v !== undefined) as number[];
        const sevAvg = sevValues.length ? (sevValues.reduce((a,b) => a+b, 0) / sevValues.length) : 0;
        const intAvg = intValues.length ? (intValues.reduce((a,b) => a+b, 0) / intValues.length) : 0;
        return { score: sevAvg, max: 10, percentage: sevAvg*10, interpretation: `Severidade: ${sevAvg.toFixed(1)}/10 | Interferência: ${intAvg.toFixed(1)}/10`, unit: 'média' };
    }
  },
  lysholm: {
    id: 'lysholm',
    segment: 'mmii',
    title: 'Escala de Lysholm',
    description: 'Avalia a função do joelho em pacientes com lesões ligamentares ou meniscais.',
    questions: [
        { text: '1. Claudicação (Mancar)', options: [{ value: 5, label: 'Nenhuma' }, { value: 3, label: 'Leve ou periódica' }, { value: 0, label: 'Grave e constante' }] },
        { text: '2. Apoio', options: [{ value: 5, label: 'Normal' }, { value: 2, label: 'Bengala ou muleta' }, { value: 0, label: 'Impossível colocar peso' }] },
        { text: '3. Travamento', options: [{ value: 15, label: 'Nenhum travamento ou sensação de que algo prende' }, { value: 10, label: 'Sensação de que prende, mas sem travamento real' }, { value: 6, label: 'Travamento ocasional' }, { value: 2, label: 'Travamento frequente' }, { value: 0, label: 'Travado no momento' }] },
        { text: '4. Instabilidade (Falseio)', options: [{ value: 25, label: 'Nunca falseia' }, { value: 20, label: 'Raramente durante atividades esportivas' }, { value: 15, label: 'Frequentemente durante atividades esportivas' }, { value: 10, label: 'Ocasionalmente durante atividades diárias' }, { value: 5, label: 'Frequentemente durante atividades diárias' }, { value: 0, label: 'A cada passo' }] },
        { text: '5. Dor', options: [{ value: 25, label: 'Nenhuma' }, { value: 20, label: 'Inconstante e leve durante esforço pesado' }, { value: 15, label: 'Significativa durante esforço pesado' }, { value: 10, label: 'Significativa após caminhada > 2km' }, { value: 5, label: 'Significativa após caminhada < 2km' }, { value: 0, label: 'Constante' }] },
        { text: '6. Inchaço', options: [{ value: 10, label: 'Nenhum' }, { value: 6, label: 'Durante esforço pesado' }, { value: 2, label: 'Após esforço normal' }, { value: 0, label: 'Constante' }] },
        { text: '7. Subir Escadas', options: [{ value: 10, label: 'Sem problemas' }, { value: 6, label: 'Levemente prejudicado' }, { value: 2, label: 'Um degrau de cada vez' }, { value: 0, label: 'Impossível' }] },
        { text: '8. Agachar', options: [{ value: 5, label: 'Sem problemas' }, { value: 4, label: 'Levemente prejudicado' }, { value: 2, label: 'Não além de 90 graus' }, { value: 0, label: 'Impossível' }] }
    ],
    calculateScore: (answers: Record<string, any>) => {
        const values = Object.entries(answers)
            .filter(([k, v]) => !isNaN(Number(k)) && v !== undefined && v !== "" && typeof v !== 'boolean')
            .map(([_, v]) => Number(v))
            .filter(v => !isNaN(v));
        const sum = values.reduce((a, b) => a + b, 0);
        return { score: sum, max: 100, percentage: sum, interpretation: sum >= 95 ? 'Excelente' : sum >= 84 ? 'Bom' : sum >= 65 ? 'Regular' : 'Ruim', unit: 'pontos' };
    }
  },
  womac: {
    id: 'womac',
    segment: 'mmii',
    title: 'Questionário WOMAC',
    description: 'Avalia dor, rigidez e função física em pacientes com osteoartrite do joelho/quadril.',
    questions: [
        { text: 'DOR (Quanta dor você sente ao:)', isInstruction: true },
        { text: '1. Andar em terreno plano?', options: [{ value: 0, label: 'Nenhuma' }, { value: 1, label: 'Pouca' }, { value: 2, label: 'Moderada' }, { value: 3, label: 'Muita' }, { value: 4, label: 'Extrema' }] },
        { text: '2. Subir ou descer escadas?', options: [{ value: 0, label: 'Nenhuma' }, { value: 1, label: 'Pouca' }, { value: 2, label: 'Moderada' }, { value: 3, label: 'Muita' }, { value: 4, label: 'Extrema' }] },
        { text: '3. À noite, quando deitado(a) na cama?', options: [{ value: 0, label: 'Nenhuma' }, { value: 1, label: 'Pouca' }, { value: 2, label: 'Moderada' }, { value: 3, label: 'Muita' }, { value: 4, label: 'Extrema' }] },
        { text: '4. Sentado(a) ou deitado(a)?', options: [{ value: 0, label: 'Nenhuma' }, { value: 1, label: 'Pouca' }, { value: 2, label: 'Moderada' }, { value: 3, label: 'Muita' }, { value: 4, label: 'Extrema' }] },
        { text: '5. Ficar em pé?', options: [{ value: 0, label: 'Nenhuma' }, { value: 1, label: 'Pouca' }, { value: 2, label: 'Moderada' }, { value: 3, label: 'Muita' }, { value: 4, label: 'Extrema' }] },
        { text: 'RIGIDEZ ARTICULAR (Quanta rigidez você sente ao:)', isInstruction: true },
        { text: '6. Mover-se pela primeira vez de manhã (ao acordar)?', options: [{ value: 0, label: 'Nenhuma' }, { value: 1, label: 'Pouca' }, { value: 2, label: 'Moderada' }, { value: 3, label: 'Muita' }, { value: 4, label: 'Extrema' }] },
        { text: '7. Mover-se no decorrer do dia após ficar sentado, deitado ou em repouso?', options: [{ value: 0, label: 'Nenhuma' }, { value: 1, label: 'Pouca' }, { value: 2, label: 'Moderada' }, { value: 3, label: 'Muita' }, { value: 4, label: 'Extrema' }] },
        { text: 'FUNÇÃO FÍSICA (Qual o grau de dificuldade para:)', isInstruction: true },
        { text: '8. Descer escadas?', options: [{ value: 0, label: 'Nenhuma' }, { value: 1, label: 'Pouca' }, { value: 2, label: 'Moderada' }, { value: 3, label: 'Muita' }, { value: 4, label: 'Extrema' }] },
        { text: '9. Subir escadas?', options: [{ value: 0, label: 'Nenhuma' }, { value: 1, label: 'Pouca' }, { value: 2, label: 'Moderada' }, { value: 3, label: 'Muita' }, { value: 4, label: 'Extrema' }] },
        { text: '10. Levantar-se da posição sentada?', options: [{ value: 0, label: 'Nenhuma' }, { value: 1, label: 'Pouca' }, { value: 2, label: 'Moderada' }, { value: 3, label: 'Muita' }, { value: 4, label: 'Extrema' }] },
        { text: '11. Ficar em pé?', options: [{ value: 0, label: 'Nenhuma' }, { value: 1, label: 'Pouca' }, { value: 2, label: 'Moderada' }, { value: 3, label: 'Muita' }, { value: 4, label: 'Extrema' }] },
        { text: '12. Curvar-se para pegar um objeto no chão?', options: [{ value: 0, label: 'Nenhuma' }, { value: 1, label: 'Pouca' }, { value: 2, label: 'Moderada' }, { value: 3, label: 'Muita' }, { value: 4, label: 'Extrema' }] },
        { text: '13. Andar num local plano?', options: [{ value: 0, label: 'Nenhuma' }, { value: 1, label: 'Pouca' }, { value: 2, label: 'Moderada' }, { value: 3, label: 'Muita' }, { value: 4, label: 'Extrema' }] },
        { text: '14. Entrar / sair do carro, de um ônibus?', options: [{ value: 0, label: 'Nenhuma' }, { value: 1, label: 'Pouca' }, { value: 2, label: 'Moderada' }, { value: 3, label: 'Muita' }, { value: 4, label: 'Extrema' }] },
        { text: '15. Ir às compras?', options: [{ value: 0, label: 'Nenhuma' }, { value: 1, label: 'Pouca' }, { value: 2, label: 'Moderada' }, { value: 3, label: 'Muita' }, { value: 4, label: 'Extrema' }] },
        { text: '16. Colocar suas meias / meias-calças?', options: [{ value: 0, label: 'Nenhuma' }, { value: 1, label: 'Pouca' }, { value: 2, label: 'Moderada' }, { value: 3, label: 'Muita' }, { value: 4, label: 'Extrema' }] },
        { text: '17. Levantar-se da cama?', options: [{ value: 0, label: 'Nenhuma' }, { value: 1, label: 'Pouca' }, { value: 2, label: 'Moderada' }, { value: 3, label: 'Muita' }, { value: 4, label: 'Extrema' }] },
        { text: '18. Tirar as suas meias / meias-calças?', options: [{ value: 0, label: 'Nenhuma' }, { value: 1, label: 'Pouca' }, { value: 2, label: 'Moderada' }, { value: 3, label: 'Muita' }, { value: 4, label: 'Extrema' }] },
        { text: '19. Deitar na cama?', options: [{ value: 0, label: 'Nenhuma' }, { value: 1, label: 'Pouca' }, { value: 2, label: 'Moderada' }, { value: 3, label: 'Muita' }, { value: 4, label: 'Extrema' }] },
        { text: '20. Entrar / sair do banho?', options: [{ value: 0, label: 'Nenhuma' }, { value: 1, label: 'Pouca' }, { value: 2, label: 'Moderada' }, { value: 3, label: 'Muita' }, { value: 4, label: 'Extrema' }] },
        { text: '21. Sentar-se?', options: [{ value: 0, label: 'Nenhuma' }, { value: 1, label: 'Pouca' }, { value: 2, label: 'Moderada' }, { value: 3, label: 'Muita' }, { value: 4, label: 'Extrema' }] },
        { text: '22. Sentar e levantar do vaso sanitário?', options: [{ value: 0, label: 'Nenhuma' }, { value: 1, label: 'Pouca' }, { value: 2, label: 'Moderada' }, { value: 3, label: 'Muita' }, { value: 4, label: 'Extrema' }] },
        { text: '23. Realizar tarefas domésticas pesadas?', options: [{ value: 0, label: 'Nenhuma' }, { value: 1, label: 'Pouca' }, { value: 2, label: 'Moderada' }, { value: 3, label: 'Muita' }, { value: 4, label: 'Extrema' }] },
        { text: '24. Realizar tarefas domésticas leves?', options: [{ value: 0, label: 'Nenhuma' }, { value: 1, label: 'Pouca' }, { value: 2, label: 'Moderada' }, { value: 3, label: 'Muita' }, { value: 4, label: 'Extrema' }] }
    ],
    calculateScore: (answers: Record<string, any>) => {
        const values = Object.entries(answers)
            .filter(([k, v]) => !isNaN(Number(k)) && v !== undefined && v !== "" && typeof v !== 'boolean')
            .map(([_, v]) => Number(v))
            .filter(v => !isNaN(v));
        const sum = values.reduce((a, b) => a + b, 0);
        // WOMAC: 24 questions, 0-4 scale. Max 96.
        // Interpretation: Higher score = more disability/symptoms.
        return { score: sum, max: 96, percentage: Math.round((sum / 96) * 100), interpretation: 'Score de Osteoartrite (WOMAC)', unit: 'pontos' };
    }
  },
  ikdc: {
    id: 'ikdc',
    segment: 'mmii',
    title: 'Questionário IKDC',
    description: 'Ferramenta para medir sintomas, função e atividades esportivas relacionadas ao joelho.',
    questions: [
        { text: '1. Qual é o nível de atividade mais alto que você consegue realizar sem dor significativa no joelho?', options: [{ value: 4, label: 'Atividades muito intensas (saltar, virar subitamente)' }, { value: 3, label: 'Atividades intensas (trabalho físico pesado)' }, { value: 2, label: 'Atividades moderadas (trabalho físico moderado)' }, { value: 1, label: 'Atividades leves (caminhar, tarefas diárias leves)' }, { value: 0, label: 'Incapaz de realizar qualquer uma das atividades acima' }] },
        { text: '2. Durante as últimas 4 semanas, com que frequência você teve dor?', options: [{ value: 10, label: 'Nunca' }, { value: 9, label: '9' }, { value: 8, label: '8' }, { value: 7, label: '7' }, { value: 6, label: '6' }, { value: 5, label: '5' }, { value: 4, label: '4' }, { value: 3, label: '3' }, { value: 2, label: '2' }, { value: 1, label: '1' }, { value: 0, label: 'Constantemente' }] },
        { text: '3. Se você teve dor nas últimas 4 semanas, descreva qual foi a dor de PIOR intensidade que você teve:', options: [{ value: 10, label: 'Sem dor' }, { value: 9, label: '9' }, { value: 8, label: '8' }, { value: 7, label: '7' }, { value: 6, label: '6' }, { value: 5, label: '5' }, { value: 4, label: '4' }, { value: 3, label: '3' }, { value: 2, label: '2' }, { value: 1, label: '1' }, { value: 0, label: 'Pior dor imaginável' }] },
        { text: '4. Quão frequente seu joelho apresentou rigidez (limitou movimento) nas últimas 4 semanas?', options: [{ value: 4, label: 'Nunca' }, { value: 3, label: 'Raramente' }, { value: 2, label: 'Algumas vezes' }, { value: 1, label: 'Frequentemente' }, { value: 0, label: 'Constantemente' }] },
        { text: '5. Quão frequente seu joelho apresentou inchaço nas últimas 4 semanas?', options: [{ value: 4, label: 'Nunca' }, { value: 3, label: 'Raramente' }, { value: 2, label: 'Algumas vezes' }, { value: 1, label: 'Frequentemente' }, { value: 0, label: 'Constantemente' }] },
        { text: '6. Qual é o nível mais alto de atividade que você consegue realizar sem inchaço significativo no seu joelho?', options: [{ value: 4, label: 'Atividades muito intensas' }, { value: 3, label: 'Atividades intensas' }, { value: 2, label: 'Atividades moderadas' }, { value: 1, label: 'Atividades leves' }, { value: 0, label: 'Incapaz de realizar até as mais leves' }] },
        { text: '7. Durante as últimas 4 semanas, o seu joelho travou ou bloqueou?', options: [{ value: 1, label: 'Não' }, { value: 0, label: 'Sim' }] },
        { text: '8. Qual o nível mais alto que você consegue sem que o joelho trave?', options: [{ value: 4, label: 'Atividades muito intensas' }, { value: 3, label: 'Atividades intensas' }, { value: 2, label: 'Atividades moderadas' }, { value: 1, label: 'Atividades leves' }, { value: 0, label: 'Incapaz de realizar até as mais leves' }] },
        { text: '9. Qual a frequência que o seu joelho cede (falso apoio)?', options: [{ value: 4, label: 'Nunca' }, { value: 3, label: 'Raramente' }, { value: 2, label: 'Algumas vezes' }, { value: 1, label: 'Frequentemente' }, { value: 0, label: 'Constantemente' }] },
        { text: '10. Qual o nível mais alto de atividade que consegue realizar sem falso apoio?', options: [{ value: 4, label: 'Atividades muito intensas' }, { value: 3, label: 'Atividades intensas' }, { value: 2, label: 'Atividades moderadas' }, { value: 1, label: 'Atividades leves' }, { value: 0, label: 'Incapaz de realizar até as mais leves' }] },
        { text: 'DIFICULDADE NAS ATIVIDADES:', isInstruction: true },
        { text: '11. Subir ladeiras íngremes ou escadas', options: [{ value: 4, label: 'Nenhuma Dificuldade' }, { value: 3, label: 'Dificuldade Leve' }, { value: 2, label: 'Dificuldade Moderada' }, { value: 1, label: 'Dificuldade Extrema' }, { value: 0, label: 'Incapaz de fazer' }] },
        { text: '12. Descer ladeiras íngremes ou escadas', options: [{ value: 4, label: 'Nenhuma Dificuldade' }, { value: 3, label: 'Dificuldade Leve' }, { value: 2, label: 'Dificuldade Moderada' }, { value: 1, label: 'Dificuldade Extrema' }, { value: 0, label: 'Incapaz de fazer' }] },
        { text: '13. Ajoelhar-se (ficar de joelhos)', options: [{ value: 4, label: 'Nenhuma Dificuldade' }, { value: 3, label: 'Dificuldade Leve' }, { value: 2, label: 'Dificuldade Moderada' }, { value: 1, label: 'Dificuldade Extrema' }, { value: 0, label: 'Incapaz de fazer' }] },
        { text: '14. Agachar-se', options: [{ value: 4, label: 'Nenhuma Dificuldade' }, { value: 3, label: 'Dificuldade Leve' }, { value: 2, label: 'Dificuldade Moderada' }, { value: 1, label: 'Dificuldade Extrema' }, { value: 0, label: 'Incapaz de fazer' }] },
        { text: '15. Sentar-se com os joelhos dobrados por tempo prolongado', options: [{ value: 4, label: 'Nenhuma Dificuldade' }, { value: 3, label: 'Dificuldade Leve' }, { value: 2, label: 'Dificuldade Moderada' }, { value: 1, label: 'Dificuldade Extrema' }, { value: 0, label: 'Incapaz de fazer' }] },
        { text: '16. Levantar da cadeira', options: [{ value: 4, label: 'Nenhuma Dificuldade' }, { value: 3, label: 'Dificuldade Leve' }, { value: 2, label: 'Dificuldade Moderada' }, { value: 1, label: 'Dificuldade Extrema' }, { value: 0, label: 'Incapaz de fazer' }] },
        { text: '17. Caminhar para a frente de modo continuado', options: [{ value: 4, label: 'Nenhuma Dificuldade' }, { value: 3, label: 'Dificuldade Leve' }, { value: 2, label: 'Dificuldade Moderada' }, { value: 1, label: 'Dificuldade Extrema' }, { value: 0, label: 'Incapaz de fazer' }] },
        { text: '18. Classificação da função do seu joelho hoje (0-10)', options: [{ value: 10, label: '10 (Normal)' }, { value: 9, label: '9' }, { value: 8, label: '8' }, { value: 7, label: '7' }, { value: 6, label: '6' }, { value: 5, label: '5' }, { value: 4, label: '4' }, { value: 3, label: '3' }, { value: 2, label: '2' }, { value: 1, label: '1' }, { value: 0, label: '0 (Incapaz)' }] }
    ],
    calculateScore: (answers: Record<string, any>) => {
        const values = Object.entries(answers)
            .filter(([k, v]) => !isNaN(Number(k)) && v !== undefined && v !== "" && typeof v !== 'boolean')
            .map(([_, v]) => Number(v))
            .filter(v => !isNaN(v));
        const sum = values.reduce((a, b) => a + b, 0);
        // IKDC: Max score is 87 according to the provided values.
        // Normalized to 0-100. Higher is better.
        const max = 87;
        const percentage = Math.round((sum / max) * 100);
        return { score: sum, max, percentage, interpretation: 'Formulário Subjetivo do Joelho (IKDC)', unit: 'pontos' };
    }
  },
  aofas: {
    id: 'aofas',
    segment: 'tornozelo',
    title: 'Escala AOFAS (Tornozelo e Retropé)',
    description: 'Avalia dor, função e alinhamento do tornozelo e retropé.',
    questions: [
        { id: 'aofas_dor', text: '1. Dor (intensidade)', options: [{ value: 40, label: 'Nenhuma' }, { value: 30, label: 'Leve, ocasional' }, { value: 20, label: 'Moderada, diária' }, { value: 0, label: 'Grave, quase sempre presente' }] },
        { id: 'aofas_limitacao', text: '2. Limitação de atividades e necessidade de suporte', options: [{ value: 10, label: 'Nenhuma limitação, sem suporte' }, { value: 7, label: 'Atividades diárias ok, recreacionais limitadas' }, { value: 4, label: 'Limitação diária e recreacional, uso de bengala' }, { value: 0, label: 'Limitação severa, uso de andador/cadeira' }] },
        { id: 'aofas_distancia', text: '3. Distância máxima de caminhada', options: [{ value: 5, label: '> 600 metros' }, { value: 4, label: '400 - 600 metros' }, { value: 2, label: '100 - 300 metros' }, { value: 0, label: '< 100 metros' }] },
        { id: 'aofas_superficie', text: '4. Superfícies de caminhada', options: [{ value: 5, label: 'Nenhuma dificuldade' }, { value: 3, label: 'Dificuldade em terrenos irregulares/degraus' }, { value: 0, label: 'Dificuldade severa' }] },
        { id: 'aofas_marcha', text: '5. Anormalidade da marcha', options: [{ value: 8, label: 'Normal' }, { value: 4, label: 'Óbvia (manca)' }, { value: 0, label: 'Acentuada' }] },
        { id: 'aofas_sagital', text: '6. Mobilidade Sagital (flexão + extensão)', options: [{ value: 8, label: 'Normal ou leve restrição (30° ou mais)' }, { value: 4, label: 'Restrição moderada (15° - 29°)' }, { value: 0, label: 'Restrição severa (< 15°)' }] },
        { id: 'aofas_retrope', text: '7. Mobilidade do Retropé (inversão + eversão)', options: [{ value: 6, label: '75% a 100% do normal' }, { value: 3, label: '25% a 74% do normal' }, { value: 0, label: '< 25% do normal' }] },
        { id: 'aofas_estabilidade', text: '8. Estabilidade do tornozelo-retropé', options: [{ value: 8, label: 'Estável' }, { value: 0, label: 'Definitivamente instável' }] },
        { id: 'aofas_alinhamento', text: '9. Alinhamento do tornozelo-retropé', options: [{ value: 10, label: 'Bom, pé plantígrado' }, { value: 5, label: 'Razoável, sintomático' }, { value: 0, label: 'Ruim, deformidade grave' }] }
    ],
    calculateScore: (answers: Record<string, any>) => {
        let score = 0;
        Object.keys(answers).forEach(key => {
            if (!isNaN(parseInt(key))) {
                score += Number(answers[key]);
            }
        });
        
        let interpretation = '';
        if (score >= 90) interpretation = 'Excelente';
        else if (score >= 80) interpretation = 'Bom';
        else if (score >= 70) interpretation = 'Razoável';
        else interpretation = 'Ruim';

        return { score, max: 100, percentage: score, interpretation, unit: 'pontos' };
    }
  },
  afMmii: {
    id: 'afMmii',
    type: 'clinical',
    segment: 'mmii',
    title: 'Avaliação Funcional MMII',
    description: 'Protocolo completo de membros inferiores: MMII, joelho e quadril.',
    diagnosisRules: [
        {
            id: 'mmii_forca_def',
            message: 'Déficit de força muscular significativa (> 15%) em um ou mais grupos musculares.',
            criteria: (answers: any) => {
                const muscles = ['f_flex_q_def', 'f_abd_q_def', 'f_ext_q_def', 'f_ext_j_def', 'f_flex_j_def', 'f_flex_j_p_def'];
                return muscles.some(m => parseFloat(String(answers[m] || '0').replace('%', '')) > 15);
            }
        },
        {
            id: 'mmii_iq_ratio',
            message: 'Desequilíbrio na Relação Isquiotibiais/Quadríceps (fora da faixa 0,45-0,60).',
            criteria: (answers: any) => {
                const relE = parseFloat(String(answers['rel_iq_esq'] || '0').replace(',', '.'));
                const relD = parseFloat(String(answers['rel_iq_dir'] || '0').replace(',', '.'));
                return (relE > 0 && (relE < 0.45 || relE > 0.60)) || (relD > 0 && (relD < 0.45 || relD > 0.60));
            }
        },
        {
            id: 'mmii_ybt_asym',
            message: 'Assimetria significativa no Y-Balance Test (> 10% assimetria).',
            criteria: (answers: any) => parseFloat(String(answers['ybt_diff'] || '0').replace(',', '.')) > 10
        },
        {
            id: 'mmii_stepdown_poor',
            message: 'Controle motor comprometido detectado no Step Down Test (sinais de valgo dinâmico ou instabilidade).',
            criteria: (answers: any) => parseFloat(String(answers['sd_result_esq'] || '0').replace(',', '.')) >= 2 || parseFloat(String(answers['sd_result_dir'] || '0').replace(',', '.')) >= 2
        }
    ],
    clinicalFlags: [
      {
        id: 'red_flag_neuro_mmii',
        label: 'Red Flag: Déficit Neurológico Significativo',
        level: 'red',
        message: 'Fraqueza muscular severa detectada (Grau < 3) em movimentos de quadril ou joelho. Necessária investigação de compressão radicular ou neuropatia periférica.',
        criteria: (answers: any) => {
          const mios = ['f_flex_q_esq', 'f_flex_q_dir', 'f_abd_q_esq', 'f_abd_q_dir', 'f_ext_q_esq', 'f_ext_q_dir', 'f_ext_j_esq', 'f_ext_j_dir', 'f_flex_j_esq', 'f_flex_j_dir', 'f_flex_j_p_esq', 'f_flex_j_p_dir'];
          return mios.some(m => answers[m] && parseInt(answers[m]) < 3);
        }
      }
    ],
    sections: [
        {
            id: 'anamnese',
            title: 'Anamnese',
            fields: [
                { id: 'anamnese_mmii', label: 'Anamnese', type: 'textarea', rows: 6 },
                { id: 'intensidade_dor', label: 'Intensidade da Dor', type: 'range', min: 0, max: 10, step: 1 },
                { id: 'area_dor', label: 'Área da Dor', type: 'bodyschema', image: '/img/esquema_corpo_inteiro.png' },
                { id: 'exames', label: 'Exames Complementares', type: 'textarea' }
            ]
        },
        {
            id: 'adm',
            title: 'Amplitude de Movimento (ADM)',
            type: 'multi-table',
            subsections: [
                {
                    id: 'adm_mmii_esq',
                    title: 'Membro Inferior Esquerdo',
                    type: 'table',
                    columns: ['Movimento', 'Ativa', 'Passiva'],
                    rows: [
                        { id: 'flex_q_e', label: 'Flexão de Quadril', fields: ['flex_q_ativa_e', 'flex_q_passiva_e'] },
                        { id: 'ext_q_e', label: 'Extensão de Quadril', fields: ['ext_q_ativa_e', 'ext_q_passiva_e'] },
                        { id: 'abd_q_e', label: 'Abdução de Quadril', fields: ['abd_q_ativa_e', 'abd_q_passiva_e'] },
                        { id: 'ext_j_e', label: 'Extensão de Joelho', fields: ['ext_j_ativa_e', 'ext_j_passiva_e'] },
                        { id: 'flex_j_e', label: 'Flexão de Joelho', fields: ['flex_j_ativa_e', 'flex_j_passiva_e'] }
                    ]
                },
                {
                    id: 'adm_mmii_dir',
                    title: 'Membro Inferior Direito',
                    type: 'table',
                    columns: ['Movimento', 'Ativa', 'Passiva'],
                    rows: [
                        { id: 'flex_q_d', label: 'Flexão de Quadril', fields: ['flex_q_ativa_d', 'flex_q_passiva_d'] },
                        { id: 'ext_q_d', label: 'Extensão de Quadril', fields: ['ext_q_ativa_d', 'ext_q_passiva_d'] },
                        { id: 'abd_q_d', label: 'Abdução de Quadril', fields: ['abd_q_ativa_d', 'abd_q_passiva_d'] },
                        { id: 'ext_j_d', label: 'Extensão de Joelho', fields: ['ext_j_ativa_d', 'ext_j_passiva_d'] },
                        { id: 'flex_j_d', label: 'Flexão de Joelho', fields: ['flex_j_ativa_d', 'flex_j_passiva_d'] }
                    ]
                }
            ],
            fields: [{ id: 'adm_mmii_obs', label: 'OBSERVAÇÕES', type: 'textarea' }]
        },
        {
            id: 'perimetria',
            title: 'Perimetria (cm)',
            type: 'table',
            columns: ['Local', 'Esquerdo', 'Direito', '% Déficit'],
            rows: [
                { id: 'peri_joelho', label: 'Interlinha Articular (Joelho)', fields: ['p_joe_esq', 'p_joe_dir', 'p_joe_def'] },
                { id: 'peri_coxa_15', label: 'Coxa (15 cm acima da patela)', fields: ['p_cox_esq', 'p_cox_dir', 'p_cox_def'] }
            ],
            fields: [{ id: 'peri_obs', label: 'OBSERVAÇÕES', type: 'textarea' }]
        },
        {
            id: 'forca',
            title: 'Força Muscular (kgF) - Torque',
            type: 'table',
            columns: ['MOVIMENTO', 'ESQUERDO', 'DIREITO', '% DÉFICIT', 'RESULTADO'],
            rows: [
                { id: 'flex_q_forca', label: 'Flexão de Quadril', fields: ['f_flex_q_esq', 'f_flex_q_dir', 'f_flex_q_def', 'f_flex_q_res'] },
                { id: 'abd_q_forca', label: 'Abdução de Quadril', fields: ['f_abd_q_esq', 'f_abd_q_dir', 'f_abd_q_def', 'f_abd_q_res'] },
                { id: 'ext_q_forca', label: 'Extensão de Quadril', fields: ['f_ext_q_esq', 'f_ext_q_dir', 'f_ext_q_def', 'f_ext_q_res'] },
                { id: 'ext_j_forca', label: 'Extensão de Joelho', fields: ['f_ext_j_esq', 'f_ext_j_dir', 'f_ext_j_def', 'f_ext_j_res'] },
                { id: 'flex_j_sentado_forca', label: 'Flexão de Joelho (Sentado)', fields: ['f_flex_j_esq', 'f_flex_j_dir', 'f_flex_j_def', 'f_flex_j_res'] },
                { id: 'flex_j_prono_forca', label: 'Flexão de Joelho (Prono)', fields: ['f_flex_j_p_esq', 'f_flex_j_p_dir', 'f_flex_j_p_def', 'f_flex_j_p_res'] },
                { id: 'relacao_iq', label: 'Relação I/Q', fields: [{ id: 'rel_iq_esq', isCalculated: true }, { id: 'rel_iq_dir', isCalculated: true }, '', { id: 'rel_iq_status', isCalculated: true }] }
            ],
            footer: 'Relação Isquiotibiais/Quadríceps: valor normal = 0,5 (0,45-0,60) | Considera-se equilíbrio muscular até o déficit < 15%',
            fields: [{ id: 'forca_mmii_obs', label: 'OBSERVAÇÕES', type: 'textarea' }]
        },
        {
            id: 'endurance',
            title: 'Endurance Muscular (segundos)',
            type: 'table',
            columns: ['Teste', 'Tempo (s)', 'Percentual (%)', 'Resultado'],
            rows: [
                { id: 'res_sorensen_row', label: 'Teste de Sorensen (Posterior)', fields: ['sorensen', { id: 'sorensen_pct', isCalculated: true }, 'sorensen_res'] },
                { id: 'res_flex_60_row', label: 'Flexão 60º (Anterior)', fields: ['flexao_60', { id: 'flexao_60_pct', isCalculated: true }, 'flexao_60_res'] }
            ],
            fields: [
                { id: 'endurance_obs', label: 'OBSERVAÇÕES', type: 'textarea' }
            ]
        },
        {
            id: 'ybt',
            title: 'Y-Balance Test (YBT)',
            fields: [
                { id: 'ybt_esq', label: 'Y Apoio Esq. (%)', type: 'number' },
                { id: 'ybt_dir', label: 'Y Apoio Dir. (%)', type: 'number' },
                { id: 'ybt_diff', label: 'Assimetria (%)', type: 'text', isCalculated: true },
                { id: 'ybt_calc', label: 'Calculadora YBT', type: 'button' },
                { id: 'ybt_obs', label: 'OBSERVAÇÕES', type: 'textarea' }
            ]
        },
        {
            id: 'integracao',
            title: 'Questionários Complementares',
            fields: [
                { id: 'lysholm_novo', label: 'Lysholm', type: 'button' },
                { id: 'womac_novo', label: 'WOMAC', type: 'button' },
                { id: 'ikdc_novo', label: 'IKDC', type: 'button' },
                { id: 'aofas_novo', label: 'AOFAS', type: 'button' }
            ]
        },
        {
            id: 'diagnostico_conclusoes',
            title: 'Diagnostico e Conclusões',
            fields: [
                { id: 'diag_button', label: 'Gerar Diagnóstico', type: 'button' },
                { id: 'diagnostico', label: 'Diagnóstico Cinético Funcional', type: 'textarea' },
                { id: 'surg_button', label: 'Gerar Sugestões', type: 'button' },
                { id: 'conclusao', label: 'Conclusões e Sugestões Terapêuticas', type: 'textarea' }
            ]
        }
    ]
  },

  afTornozelo: {
    id: 'afTornozelo',
    type: 'clinical',
    segment: 'tornozelo',
    title: 'Avaliação Funcional de Tornozelo e Pé',
    description: 'Protocolo clínico para avaliação de entorses, tendinopatias e disfunções do complexo tornozelo-pé.',
    clinicalFlags: [
      {
        id: 'red_flag_thompson',
        label: 'Red Flag: Ruptura do Tendão de Aquiles',
        level: 'red',
        message: 'Teste de Thompson positivo detectado. Alta suspeita de ruptura total do tendão de calcâneo. Encaminhamento ortopédico imediato é necessário.',
        criteria: (answers: any) => answers['test_thompson_esq'] === true || answers['test_thompson_dir'] === true
      },
      {
        id: 'red_flag_sindesmose',
        label: 'Red Flag: Lesão da Sindesmose',
        level: 'red',
        message: 'Testes de Kleiger ou Squeeze positivos. Possível lesão da sindesmose tibiofibular (entorse alta). Recomenda-se cautela na descarga de peso inicial.',
        criteria: (answers: any) => answers['test_kleiger_esq'] === true || answers['test_kleiger_dir'] === true || answers['test_squeeze_esq'] === true || answers['test_squeeze_dir'] === true
      },
      {
        id: 'yellow_flag_wblt_asymmetry',
        label: 'Yellow Flag: Assimetria na Dorsiflexão',
        level: 'yellow',
        message: 'Déficit significativo no teste WBLT detectado (> 22%). Restrição de mobilidade de tornozelo pode sobrecarregar outras articulações (joelho/quadril).',
        criteria: (answers: any) => {
            const def = parseFloat(String(answers['wblt_def'] || '0').replace('%', ''));
            return def >= 22;
        }
      }
    ],
    sections: [
        {
            id: 'anamnese',
            title: 'Anamnese',
            fields: [
                { id: 'anamnese_texto', label: 'ANAMNESE', type: 'textarea' },
                { id: 'intensidade_dor', label: 'Intensidade da Dor (EVA)', type: 'range', min: 0, max: 10, step: 1 },
                { id: 'area_dor', label: 'Área da Dor', type: 'bodyschema', image: '/img/esquema_corpo_inteiro.png' },
                { id: 'exames_complementares', label: 'EXAMES COMPLEMENTARES', type: 'textarea' }
            ]
        },
        {
            id: 'inspecao_testes_func',
            title: 'Inspeção e Testes Especiais',
            type: 'multi-table',
            subsections: [
                {
                    id: 'perimetria_sub',
                    title: 'Perimetria (cm)',
                    type: 'table',
                    columns: ['Local', 'Esquerdo (cm)', 'Direito (cm)', 'DÉFICIT %'],
                    rows: [
                        { id: 'figura_8', label: 'Figura em 8', fields: ['fig8_esq', 'fig8_dir', 'fig8_def'] },
                        { id: 'p_perna_tat', label: 'Perimetria da perna (10 cm abaixo da TAT)', fields: ['p_perna_tat_esq', 'p_perna_tat_dir', 'p_perna_tat_def'] }
                    ]
                },
                {
                    id: 'testes_funcionais',
                    title: 'Testes Especiais', // Título solicitado pelo usuário
                    type: 'table',
                    columns: ['Teste', 'Esquerdo (reps)', 'Direito (reps)'],
                    rows: [
                        { id: 'slhrt', label: 'Single Leg Heel Raise Test', fields: ['slhrt_esq', 'slhrt_dir'] }
                    ],
                    fields: [
                        { id: 'slhrt_class', label: 'Classificação Single Leg Heel Raise', type: 'textarea' }
                    ]
                }
            ],
            fields: [
                { id: 'inspecao_text', label: 'Inspeção (Deformidades, Edema, Trofismo)', type: 'textarea' },
                { id: 'obs_perimetria', label: 'OBSERVAÇÕES', type: 'textarea' }
            ]
        },
        {
            id: 'palpacao',
            title: 'Palpação',
            type: 'multi-table',
            subsections: [
                {
                    id: 'palpacao_articular',
                    title: 'Palpação Articular',
                    type: 'table',
                    columns: ['Estrutura', 'Esquerdo', 'Direito'],
                    rows: [
                        { id: 'maleolo_lateral', label: 'Maléolo Lateral', fields: [{ id: 'palp_mlat_esq', type: 'checkbox' }, { id: 'palp_mlat_dir', type: 'checkbox' }] },
                        { id: 'maleolo_medial', label: 'Maléolo Medial', fields: [{ id: 'palp_mmed_esq', type: 'checkbox' }, { id: 'palp_mmed_dir', type: 'checkbox' }] },
                        { id: 'calcaneo', label: 'Calcâneo', fields: [{ id: 'palp_calcp_esq', type: 'checkbox' }, { id: 'palp_calcp_dir', type: 'checkbox' }] },
                        { id: 'base_5_meta', label: 'Base do 5º Metatarso', fields: [{ id: 'palp_5meta_esq', type: 'checkbox' }, { id: 'palp_5meta_dir', type: 'checkbox' }] }
                    ]
                },
                {
                    id: 'palpacao_miofascial',
                    title: 'Palpação Miofascial',
                    type: 'table',
                    columns: ['Estrutura', 'Esquerdo', 'Direito'],
                    rows: [
                        { id: 'aquiles', label: 'Tendão de Aquiles', fields: [{ id: 'palp_aquiles_esq', type: 'checkbox' }, { id: 'palp_aquiles_dir', type: 'checkbox' }] },
                        { id: 'fascia_plantar', label: 'Fáscia Plantar', fields: [{ id: 'palp_fascia_esq', type: 'checkbox' }, { id: 'palp_fascia_dir', type: 'checkbox' }] },
                        { id: 'tibial_anterior', label: 'Tibial Anterior', fields: [{ id: 'palp_tanterior_esq', type: 'checkbox' }, { id: 'palp_tanterior_dir', type: 'checkbox' }] },
                        { id: 'tibial_posterior', label: 'Tibial posterior', fields: [{ id: 'palp_tpost_esq', type: 'checkbox' }, { id: 'palp_tpost_dir', type: 'checkbox' }] },
                        { id: 'gastrocnemio', label: 'Gastrocnêmio', fields: [{ id: 'palp_gastro_esq', type: 'checkbox' }, { id: 'palp_gastro_dir', type: 'checkbox' }] },
                        { id: 'soleo', label: 'Sóleo', fields: [{ id: 'palp_soleo_esq', type: 'checkbox' }, { id: 'palp_soleo_dir', type: 'checkbox' }] },
                        { id: 'extensor_curto', label: 'Extensor curto dos dedos', fields: [{ id: 'palp_extcurto_esq', type: 'checkbox' }, { id: 'palp_extcurto_dir', type: 'checkbox' }] },
                        { id: 'fibulares', label: 'Fibulares', fields: [{ id: 'palp_fibulares_esq', type: 'checkbox' }, { id: 'palp_fibulares_dir', type: 'checkbox' }] }
                    ]
                },
                {
                    id: 'obs_palpacao_sub',
                    title: 'Observações - Palpação',
                    fields: [{ id: 'obs_palpacao', label: 'OBSERVAÇÕES', type: 'textarea' }]
                }
            ]
        },
        {
            id: 'amplitude_movimento',
            title: 'Amplitude de Movimento',
            type: 'multi-table',
            subsections: [
                {
                    id: 'adm_tornozelo_at',
                    title: 'Tornozelo (Ativo)',
                    type: 'table',
                    columns: ['Movimento', 'Esquerdo (°)', 'Direito (°)', 'DÉFICIT %'],
                    rows: [
                        { id: 'flex_pla_at', label: 'Flexão Plantar', fields: ['flex_pla_at_esq', 'flex_pla_at_dir', 'flex_pla_at_def'] },
                        { id: 'dorsi_at', label: 'Dorsiflexão', fields: ['dorsi_at_esq', 'dorsi_at_dir', 'dorsi_at_def'] },
                        { id: 'inv_at', label: 'Inversão', fields: ['inv_at_esq', 'inv_at_dir', 'inv_at_def'] },
                        { id: 'eve_at', label: 'Eversão', fields: ['eve_at_esq', 'eve_at_dir', 'eve_at_def'] }
                    ]
                },
                {
                    id: 'adm_tornozelo_ps',
                    title: 'Tornozelo (Passivo)',
                    type: 'table',
                    columns: ['Movimento', 'Esquerdo (°)', 'Direito (°)', 'DÉFICIT %'],
                    rows: [
                        { id: 'flex_pla_ps', label: 'Flexão Plantar', fields: ['flex_pla_ps_esq', 'flex_pla_ps_dir', 'flex_pla_ps_def'] },
                        { id: 'dorsi_ps', label: 'Dorsiflexão', fields: ['dorsi_ps_esq', 'dorsi_ps_dir', 'dorsi_ps_def'] },
                        { id: 'inv_ps', label: 'Inversão', fields: ['inv_ps_esq', 'inv_ps_dir', 'inv_ps_def'] },
                        { id: 'eve_ps', label: 'Eversão', fields: ['eve_ps_esq', 'eve_ps_dir', 'eve_ps_def'] }
                    ]
                },
                {
                    id: 'wblt_test',
                    title: 'Weight Bearing Lunge Test (cm)',
                    type: 'table',
                    columns: ['Teste', 'Esquerdo (cm)', 'Direito (cm)', 'DÉFICIT %'],
                    rows: [
                        { id: 'wblt', label: 'WBLT', fields: ['wblt_esq', 'wblt_dir', 'wblt_def'] }
                    ]
                },
                {
                    id: 'obs_adm_tornozelo_div',
                    title: 'Observações - ADM',
                    fields: [{ id: 'obs_adm_tornozelo', label: 'Observações', type: 'textarea' }]
                }
            ]
        },
        {
            id: 'forca_tornozelo',
            title: 'Força Muscular (kgF)',
            type: 'table',
            columns: ['Movimento', 'Esquerdo', 'Direito', 'DÉFICIT %'],
            rows: [
                { id: 'f_pla_tor', label: 'Flexão Plantar', fields: ['f_pla_tor_esq', 'f_pla_tor_dir', 'f_pla_tor_def'] },
                { id: 'f_dor_tor', label: 'Dorsiflexão', fields: ['f_dor_tor_esq', 'f_dor_tor_dir', 'f_dor_tor_def'] },
                { id: 'f_inv_tor', label: 'Inversão', fields: ['f_inv_tor_esq', 'f_inv_tor_dir', 'f_inv_tor_def'] },
                { id: 'f_eve_tor', label: 'Eversão', fields: ['f_eve_tor_esq', 'f_eve_tor_dir', 'f_eve_tor_def'] }
            ],
            fields: [{ id: 'obs_forca_tornozelo', label: 'OBSERVAÇÕES', type: 'textarea' }]
        },
        {
            id: 'testes_especiais',
            title: 'Testes Especiais',
            type: 'table',
            columns: ['Teste', 'Esquerdo', 'Direito'],
            rows: [
                { id: 'gaveta_ant', label: 'Gaveta Anterior', fields: [{ id: 'test_gaveta_esq', type: 'checkbox' }, { id: 'test_gaveta_dir', type: 'checkbox' }] },
                { id: 'talar_tilt', label: 'Talar Tilt', fields: [{ id: 'test_talar_esq', type: 'checkbox' }, { id: 'test_talar_dir', type: 'checkbox' }] },
                { id: 'thompson', label: 'Teste de Thompson', fields: [{ id: 'test_thompson_esq', type: 'checkbox' }, { id: 'test_thompson_dir', type: 'checkbox' }] },
                { id: 'kleiger', label: 'Teste de Kleiger (Sindesmose)', fields: [{ id: 'test_kleiger_esq', type: 'checkbox' }, { id: 'test_kleiger_dir', type: 'checkbox' }] },
                { id: 'squeeze', label: 'Squeeze Test (Sindesmose)', fields: [{ id: 'test_squeeze_esq', type: 'checkbox' }, { id: 'test_squeeze_dir', type: 'checkbox' }] }
            ],
            fields: [{ id: 'obs_testes_esp', label: 'OBSERVAÇÕES', type: 'textarea' }]
        },
        {
            id: 'ybt',
            title: 'Y-Balance Test (YBT)',
            fields: [
                { id: 'ybt_esq', label: 'Y Apoio Esq. (%)', type: 'number' },
                { id: 'ybt_dir', label: 'Y Apoio Dir. (%)', type: 'number' },
                { id: 'ybt_diff', label: 'Assimetria (%)', type: 'text' },
                { id: 'ybt_calc', label: 'Calculadora YBT', type: 'button' },
                { id: 'ybt_obs', label: 'OBSERVAÇÕES', type: 'textarea' }
            ]
        },
        {
            id: 'questionarios',
            title: 'Questionários e Escalas',
            fields: [
                { id: 'aofas_novo', label: 'Escala AOFAS', type: 'button' }
            ]
        },
        {
            id: 'diagnostico_conclusoes',
            title: 'Diagnóstico e Conclusões',
            fields: [
                { id: 'diagnostico', label: 'Diagnóstico Cinético Funcional', type: 'textarea' },
                { id: 'conclusao', label: 'Conclusões e Sugestões Terapêuticas', type: 'textarea' }
            ]
        }
    ],
    calculateScore: (answers: Record<string, any>) => ({ score: 0, max: 0, percentage: 100, interpretation: 'Avaliação Concluída', unit: '%' })
  },

  afMao: {
    id: 'afMao',
    type: 'clinical',
    segment: 'mao',
    title: 'Avaliação Funcional de Mão e Punho',
    description: 'Protocolo clínico para avaliação de túnel do carpo, tendinites e outras disfunções da mão e punho.',
    clinicalFlags: [
      {
        id: 'red_flag_carpal_tunnel_severe',
        label: 'Red Flag: Túnel do Carpo Grave',
        level: 'red',
        message: 'Sinal de Tinel e Phalen positivos com relato de perda de força ou atrofia tênar. Risco de dano neurológico irreversível no nervo mediano.',
        criteria: (answers: any) => (answers['test_phalen_esq'] === true || answers['test_phalen_dir'] === true) && (answers['test_tinelm_esq'] === true || answers['test_tinelm_dir'] === true)
      },
      {
        id: 'red_flag_vascular',
        label: 'Red Flag: Insuficiência Vascular',
        level: 'red',
        message: 'Teste de Allen positivo. Comprometimento da circulação colateral da mão (artéria radial ou ulnar). Necessita avaliação vascular.',
        criteria: (answers: any) => answers['test_allen_esq'] === true || answers['test_allen_dir'] === true
      }
    ],
    sections: [
        {
            id: 'anamnese',
            title: 'Anamnese',
            fields: [
                { id: 'anamnese_texto', label: 'ANAMNESE', type: 'textarea' },
                { id: 'intensidade_dor', label: 'Intensidade da Dor (EVA)', type: 'range', min: 0, max: 10, step: 1 },
                { id: 'area_dor', label: 'Área da Dor', type: 'bodyschema', image: '/img/esquema_corpo_inteiro.png' },
                { id: 'exames_complementares', label: 'EXAMES COMPLEMENTARES', type: 'textarea' }
            ]
        },
        {
            id: 'perimetria',
            title: 'Inspeção e Perimetria',
            type: 'table',
            columns: ['Local', 'Esquerdo (cm)', 'Direito (cm)', 'DÉFICIT %'],
            rows: [
                { id: 'p_ant_sup', label: 'Antebraço Superior', fields: ['peri_ant_sup_esq', 'peri_ant_sup_dir', 'peri_ant_sup_def'] },
                { id: 'p_ant_inf', label: 'Antebraço Inferior', fields: ['peri_ant_inf_esq', 'peri_ant_inf_dir', 'peri_ant_inf_def'] },
                { id: 'p_punho', label: 'Punho', fields: ['peri_punho_esq', 'peri_punho_dir', 'peri_punho_def'] }
            ],
            fields: [
                { id: 'inspecao', label: 'Inspeção (Deformidades, Edema, Cicatrizes, Trofismo)', type: 'textarea' },
                { id: 'obs_perimetria', label: 'OBSERVAÇÕES', type: 'textarea' }
            ]
        },
        {
            id: 'palpacao',
            title: 'PALPAÇÃO',
            type: 'multi-table',
            subsections: [
                {
                    id: 'palpacao_articular',
                    title: 'Palpação Articular',
                    type: 'table',
                    columns: ['Estrutura', 'Esquerdo', 'Direito'],
                    rows: [
                        { id: 'estilioide_radial', label: 'Estiloide Radial', fields: [{ id: 'palp_estrad_esq', type: 'checkbox' }, { id: 'palp_estrad_dir', type: 'checkbox' }] },
                        { id: 'estilioide_ulnar', label: 'Estiloide Ulnar', fields: [{ id: 'palp_estuln_esq', type: 'checkbox' }, { id: 'palp_estuln_dir', type: 'checkbox' }] },
                        { id: 'scaphoide', label: 'Escafoide', fields: [{ id: 'palp_esc_esq', type: 'checkbox' }, { id: 'palp_esc_dir', type: 'checkbox' }] },
                        { id: 'tunelcarpiano', label: 'Túnel do Carpo (face palmar)', fields: [{ id: 'palp_tunel_esq', type: 'checkbox' }, { id: 'palp_tunel_dir', type: 'checkbox' }] }
                    ]
                },
                {
                    id: 'palpacao_miofascial',
                    title: 'Palpação Miofascial',
                    type: 'table',
                    columns: ['Músculo', 'Esquerdo', 'Direito'],
                    rows: [
                        { id: 'extensores_punho', label: 'Extensores do Punho', fields: [{ id: 'mio_extp_esq', type: 'checkbox' }, { id: 'mio_extp_dir', type: 'checkbox' }] },
                        { id: 'flexores_punho', label: 'Flexores do Punho', fields: [{ id: 'mio_flexp_esq', type: 'checkbox' }, { id: 'mio_flexp_dir', type: 'checkbox' }] },
                        { id: 'tenar', label: 'Musculatura Tênar', fields: [{ id: 'mio_tenar_esq', type: 'checkbox' }, { id: 'mio_tenar_dir', type: 'checkbox' }] },
                        { id: 'hipotenar', label: 'Musculatura Hipotênar', fields: [{ id: 'mio_hipo_esq', type: 'checkbox' }, { id: 'mio_hipo_dir', type: 'checkbox' }] }
                    ]
                },
                {
                    id: 'obs_palpacao_sub',
                    title: 'Observações - Palpação',
                    fields: [{ id: 'obs_palpacao', label: 'OBSERVAÇÕES', type: 'textarea' }]
                }
            ]
        },
        {
            id: 'amplitude_movimento',
            title: 'AMPLITUDE DE MOVIMENTO',
            type: 'multi-table',
            subsections: [
                {
                    id: 'adm_punho_at',
                    title: 'Punho (Ativo)',
                    type: 'table',
                    columns: ['Movimento', 'Esquerdo (°)', 'Direito (°)', 'DÉFICIT %'],
                    rows: [
                        { id: 'flexao_pun_at', label: 'Flexão', fields: ['flexao_pun_at_esq', 'flexao_pun_at_dir', 'flexao_pun_at_def'] },
                        { id: 'extensao_pun_at', label: 'Extensão', fields: ['extensao_pun_at_esq', 'extensao_pun_at_dir', 'extensao_pun_at_def'] },
                        { id: 'desv_radial_at', label: 'Desvio Radial', fields: ['desv_radial_at_esq', 'desv_radial_at_dir', 'desv_radial_at_def'] },
                        { id: 'desv_ulnar_at', label: 'Desvio Ulnar', fields: ['desv_ulnar_at_esq', 'desv_ulnar_at_dir', 'desv_ulnar_at_def'] }
                    ]
                },
                {
                    id: 'adm_punho_ps',
                    title: 'Punho (Passivo)',
                    type: 'table',
                    columns: ['Movimento', 'Esquerdo (°)', 'Direito (°)', 'DÉFICIT %'],
                    rows: [
                        { id: 'flexao_pun_ps', label: 'Flexão', fields: ['flexao_pun_ps_esq', 'flexao_pun_ps_dir', 'flexao_pun_ps_def'] },
                        { id: 'extensao_pun_ps', label: 'Extensão', fields: ['extensao_pun_ps_esq', 'extensao_pun_ps_dir', 'extensao_pun_ps_def'] },
                        { id: 'desv_radial_ps', label: 'Desvio Radial', fields: ['desv_radial_ps_esq', 'desv_radial_ps_dir', 'desv_radial_ps_def'] },
                        { id: 'desv_ulnar_ps', label: 'Desvio Ulnar', fields: ['desv_ulnar_ps_esq', 'desv_ulnar_ps_dir', 'desv_ulnar_ps_def'] }
                    ]
                },
                {
                    id: 'obs_adm_punho_div',
                    title: 'Observações - Punho',
                    fields: [{ id: 'obs_adm_punho', label: 'Observações', type: 'textarea' }]
                },
                {
                    id: 'adm_mao_at',
                    title: 'Mão e Dedos (Ativo)',
                    type: 'table',
                    columns: ['Articulação / Movimento', 'Esquerdo (°)', 'Direito (°)', 'DÉFICIT %'],
                    rows: [
                        { id: 'flex_mcf_at', label: 'Flexão MCF (dedos)', fields: ['flex_mcf_at_esq', 'flex_mcf_at_dir', 'flex_mcf_at_def'] },
                        { id: 'ext_mcf_at', label: 'Extensão MCF (dedos)', fields: ['ext_mcf_at_esq', 'ext_mcf_at_dir', 'ext_mcf_at_def'] },
                        { id: 'flex_ifp_at', label: 'Flexão IFP', fields: ['flex_ifp_at_esq', 'flex_ifp_at_dir', 'flex_ifp_at_def'] },
                        { id: 'flex_ifd_at', label: 'Flexão IFD', fields: ['flex_ifd_at_esq', 'flex_ifd_at_dir', 'flex_ifd_at_def'] },
                        { id: 'oposicao_polegar_at', label: 'Oposição do Polegar', fields: ['oposicao_polegar_at_esq', 'oposicao_polegar_at_dir', 'oposicao_polegar_at_def'] }
                    ]
                },
                {
                    id: 'adm_mao_ps',
                    title: 'Mão e Dedos (Passivo)',
                    type: 'table',
                    columns: ['Articulação / Movimento', 'Esquerdo (°)', 'Direito (°)', 'DÉFICIT %'],
                    rows: [
                        { id: 'flex_mcf_ps', label: 'Flexão MCF (dedos)', fields: ['flex_mcf_ps_esq', 'flex_mcf_ps_dir', 'flex_mcf_ps_def'] },
                        { id: 'ext_mcf_ps', label: 'Extensão MCF (dedos)', fields: ['ext_mcf_ps_esq', 'ext_mcf_ps_dir', 'ext_mcf_ps_def'] },
                        { id: 'flex_ifp_ps', label: 'Flexão IFP', fields: ['flex_ifp_ps_esq', 'flex_ifp_ps_dir', 'flex_ifp_ps_def'] },
                        { id: 'flex_ifd_ps', label: 'Flexão IFD', fields: ['flex_ifd_ps_esq', 'flex_ifd_ps_dir', 'flex_ifd_ps_def'] },
                        { id: 'oposicao_polegar_ps', label: 'Oposição do Polegar', fields: ['oposicao_polegar_ps_esq', 'oposicao_polegar_ps_dir', 'oposicao_polegar_ps_def'] }
                    ]
                },
                {
                    id: 'obs_adm_mao_div',
                    title: 'Observações - Mão',
                    fields: [{ id: 'obs_adm_mao', label: 'Observações', type: 'textarea' }]
                }
            ]
        },

        {
            id: 'testes_especiais',
            title: 'Testes Especiais',
            type: 'table',
            columns: ['Teste', 'Esquerdo', 'Direito'],
            rows: [
                { id: 'phalen', label: 'Teste de Phalen (Túnel do Carpo)', fields: [{ id: 'test_phalen_esq', type: 'checkbox' }, { id: 'test_phalen_dir', type: 'checkbox' }] },
                { id: 'phalen_inv', label: 'Teste de Phalen Invertido', fields: [{ id: 'test_phaleni_esq', type: 'checkbox' }, { id: 'test_phaleni_dir', type: 'checkbox' }] },
                { id: 'tinel_carpo', label: 'Sinal de Tinel (Túnel do Carpo)', fields: [{ id: 'test_tinelm_esq', type: 'checkbox' }, { id: 'test_tinelm_dir', type: 'checkbox' }] },
                { id: 'finkelstein', label: 'Teste de Finkelstein (De Quervain)', fields: [{ id: 'test_fink_esq', type: 'checkbox' }, { id: 'test_fink_dir', type: 'checkbox' }] },
                { id: 'allen', label: 'Teste de Allen (Vascularização)', fields: [{ id: 'test_allen_esq', type: 'checkbox' }, { id: 'test_allen_dir', type: 'checkbox' }] },
                { id: 'watson', label: 'Teste de Watson (Instabilidade Escafoide)', fields: [{ id: 'test_watson_esq', type: 'checkbox' }, { id: 'test_watson_dir', type: 'checkbox' }] }
            ],
            fields: [
                { id: 'obs_testes_esp', label: 'OBSERVAÇÕES', type: 'textarea' }
            ]
        },
        {
            id: 'forca_preensao',
            title: 'Força de Preensão e Pinça (kgF)',
            type: 'table',
            columns: ['Teste', 'Esquerdo', 'Direito', 'DÉFICIT %'],
            rows: [
                { id: 'preensao_palmar', label: 'Preensão Palmar (Dinamômetro)', fields: ['preensao_esq', 'preensao_dir', 'preensao_def'] },
                { id: 'pinca_polpa', label: 'Pinça Polpa a Polpa', fields: ['polpa_esq', 'polpa_dir', 'polpa_def'] },
                { id: 'pinca_lateral', label: 'Pinça Lateral (Chave)', fields: ['lateral_esq', 'lateral_dir', 'lateral_def'] },
                { id: 'pinca_tripode', label: 'Pinça Trípode (3 dedos)', fields: ['tripode_esq', 'tripode_dir', 'tripode_def'] }
            ],
            fields: [
                { id: 'obs_forca_preensao', label: 'OBSERVAÇÕES', type: 'textarea' }
            ]
        },
        {
            id: 'quickdash_integracao',
            title: 'Quick DASH (Braço, Ombro e Mão)',
            fields: [
                { id: 'quickdash_novo', label: 'Quick DASH', type: 'button' }
            ]
        },
        {
            id: 'diagnostico_conclusoes',
            title: 'Diagnóstico e Conclusões',
            fields: [
                { id: 'diagnostico', label: 'Diagnóstico Cinético Funcional', type: 'textarea' },
                { id: 'conclusao', label: 'Conclusões e Sugestões Terapêuticas', type: 'textarea' }
            ]
        }
    ],
    calculateScore: (answers: Record<string, any>) => ({ score: 0, max: 0, percentage: 100, interpretation: 'Avaliação Concluída', unit: '%' })
  },
  afSensibilidade: {
    id: 'afSensibilidade',
    type: 'clinical',
    segment: 'diversas',
    title: 'Teste de Sensibilidade',
    description: 'Mapeamento dermatômico e avaliação de sensibilidade com monofilamentos.',
    sections: [
        {
            id: 'testeSensibilidade',
            title: 'Avaliação Clínica e Mapa de Sensibilidade',
            fields: [
                { id: 'diagnostico', label: 'Diagnóstico Clínico', type: 'textarea' },
                {
                    id: 'mapa_sensibilidade',
                    label: 'Marque no mapa o nível de sensibilidade encontrado',
                    type: 'paintmap',
                    image: '/img/mapa_sensibilidade.png',
                    colors: [
                        { hex: '#00FF00', label: 'Normal' },
                        { hex: '#0000FF', label: 'Diminuída' },
                        { hex: '#8A2BE2', label: 'Protetora diminuída' },
                        { hex: '#8B0000', label: 'Perda protetora' },
                        { hex: '#FFA500', label: 'Laranja (Perda protetora pé)' },
                        { hex: '#FF00FF', label: 'Apenas pressão profunda' },
                        { hex: '#000000', label: 'Nenhuma resposta' }
                    ]
                }
            ]
        }
    ],
    calculateScore: (answers: Record<string, any>) => ({ score: 0, max: 0, percentage: 100, interpretation: 'Avaliação Concluída', unit: '%' })
  },
  afAnaliseAngular: {
    id: 'afAnaliseAngular',
    type: 'clinical',
    segment: 'diversas',
    title: 'Análise Angular (Estúdio)',
    description: 'Faça o upload de uma foto e trace ângulos articulares ou posturais.',
    sections: [
        {
            id: 'analiseAngular',
            title: 'Informações e Estúdio de Análise',
            fields: [
                { id: 'diagnostico', label: 'Descrição da Postura/Movimento', type: 'textarea' },
                { id: 'observacoes', label: 'Observações Adicionais', type: 'textarea' },
                {
                    id: 'canvas_angular',
                    label: 'Clique abaixo para carregar a foto e marcar os 3 pontos do ângulo.',
                    type: 'angle_measurement'
                }
            ]
        }
    ],
    calculateScore: (answers: Record<string, any>) => ({ score: 0, max: 0, percentage: 100, interpretation: 'Análise Concluída', unit: '%' })
  },
  afOrientacao: {
    id: 'afOrientacao',
    type: 'clinical',
    segment: 'diversas',
    title: 'Orientação para o Paciente',
    description: 'Desenhe esquemas, orientações e diagramas personalizados para o paciente.',
    sections: [
        {
            id: 'desenho_observacoes',
            title: 'Orientação e Observações',
            fields: [
                { id: 'obs_texto', label: 'Notas complementares e orientações textuais', type: 'textarea' },
                {
                    id: 'canvas_orientacao',
                    label: 'Use o canvas abaixo para desenhar orientações',
                    type: 'freecanvas'
                }
            ]
        }
    ],
    calculateScore: (answers: Record<string, any>) => ({ score: 0, max: 0, percentage: 100, interpretation: 'Orientação Registrada', unit: '%' })
  }
};

