// Updated shoulder logic - forcing reload
export interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: 'Fortalecimento' | 'Mobilidade' | 'Manual' | 'Educação';
  type?: 'musculo' | 'vertebra' | 'outro';
}

export interface SuggestionGroup {
  category: string;
  items: Suggestion[];
}

const safeParse = (val: any) => {
  if (val === undefined || val === null || val === '') return 0;
  return parseFloat(String(val).replace(',', '.'));
};

export function getTherapeuticSuggestions(questionnaireId: string, answers: Record<string, any>): SuggestionGroup[] {
  const suggestions: Suggestion[] = [];
  const hasValue = (val: any) => val !== undefined && val !== null && val !== "" && val !== false;

  // -- LOGIC FOR LUMBAR (afLombar) --
  if (questionnaireId === 'afLombar') {
    // 1. ADM (ROM)
    if (parseFloat(answers['flexao_graus']) < 40) {
      suggestions.push({ id: 'adm_l_flex', title: 'Restrição de Flexão Lombar', description: 'Trabalhar mobilidade de flexão e alongamento de cadeia posterior.', category: 'Mobilidade' });
    }
    if (parseFloat(answers['extensao_graus']) < 20) {
      suggestions.push({ id: 'adm_l_ext', title: 'Restrição de Extensão Lombar', description: 'Trabalhar mobilidade de extensão (exercícios tipo McKenzie se indicado).', category: 'Mobilidade' });
    }
    if (parseFloat(answers['incl_esq_graus']) < 15 || parseFloat(answers['incl_dir_graus']) < 15) {
      suggestions.push({ id: 'adm_l_incl', title: 'Restrição de Inclinação Lombar', description: 'Melhorar mobilidade lateral e flexibilidade de quadrado lombar.', category: 'Mobilidade' });
    }

    // 2. Endurance
    if (answers['sorensen_res'] === 'Reduzido') {
      suggestions.push({ id: 'lombar_extensores', title: 'Fortalecimento de Cadeia Posterior', description: 'Focar em resistência de extensores de tronco.', category: 'Fortalecimento' });
    }
    if (answers['flexao_60_res'] === 'Reduzido') {
      suggestions.push({ id: 'lombar_flexores', title: 'Fortalecimento de Cadeia Anterior', description: 'Focar em estabilização de core anterior.', category: 'Fortalecimento' });
    }

    // 3. Neural Tension
    if (hasValue(answers['tensao_lasegue_esq']) || hasValue(answers['tensao_lasegue_dir'])) {
      suggestions.push({ id: 'neuro_isquiatico', title: 'Mobilização Neural (Isquiático/Lasegue)', description: 'Técnicas de deslizamento para nervo isquiático.', category: 'Mobilidade' });
    }
    if (hasValue(answers['tensao_slump_esq']) || hasValue(answers['tensao_slump_dir'])) {
      suggestions.push({ id: 'neuro_slump', title: 'Mobilização Neural (Eixo Neural)', description: 'Tratamento de mecânico-sensibilidade do sistema nervoso.', category: 'Mobilidade' });
    }
    if (hasValue(answers['tensao_femoral_esq']) || hasValue(answers['tensao_femoral_dir'])) {
      suggestions.push({ id: 'neuro_femoral', title: 'Mobilização Neural (Femoral)', description: 'Técnicas de deslizamento para nervo femoral.', category: 'Mobilidade' });
    }

    // 4. Trigger Points (Miofascial)
    const mioFields: Record<string, string> = {
      'mio_quadrado_lombar': 'Quadrado Lombar',
      'mio_gluteo_maximo': 'Glúteo Máximo',
      'mio_gluteo_medio': 'Glúteo Médio',
      'mio_gluteo_minimo': 'Glúteo Mínimo',
      'mio_piriforme': 'Piriforme',
      'mio_tfl': 'Tensor da Fáscia Lata',
      'mio_iliopsoas': 'Iliopsoas'
    };

    Object.keys(mioFields).forEach(key => {
      if (hasValue(answers[`${key}_esq`]) || hasValue(answers[`${key}_dir`])) {
        const side = (hasValue(answers[`${key}_esq`]) && hasValue(answers[`${key}_dir`])) ? '(Bilateral)' : hasValue(answers[`${key}_esq`]) ? '(Esq)' : '(Dir)';
        suggestions.push({
          id: `tp_${key}`,
          title: mioFields[key],
          description: side,
          category: 'Manual',
          type: 'musculo'
        });
      }
    });

    // 5. Irritability (Vertebral Levels)
    const levels = ['t7', 't8', 't9', 't10', 't11', 't12', 'l1', 'l2', 'l3', 'l4', 'l5', 'sacro'];
    levels.forEach(lvl => {
      if (hasValue(answers[`palp_${lvl}_dor`])) {
        suggestions.push({
          id: `irr_l_${lvl}`,
          title: lvl.toUpperCase(),
          description: 'Sensibilidade detectada',
          category: 'Manual',
          type: 'vertebra'
        });
      }
    });
  }

  // -- LOGIC FOR HAND (afMao) --
  if (questionnaireId === 'afMao') {
    // 1. ADM
    if (safeParse(answers['extensao_pun_at_esq']) < 60 || safeParse(answers['extensao_pun_at_dir']) < 60) {
      suggestions.push({ id: 'mao_adm_ext', title: 'Ganho de Extensão de Punho', description: 'Exercícios de mobilidade e alongamento de flexores de punho.', category: 'Mobilidade' });
    }
    if (safeParse(answers['flexao_pun_at_esq']) < 60 || safeParse(answers['flexao_pun_at_dir']) < 60) {
      suggestions.push({ id: 'mao_adm_flex', title: 'Ganho de Flexão de Punho', description: 'Exercícios de mobilidade e alongamento de extensores de punho.', category: 'Mobilidade' });
    }

    // 2. Strength
    const gripE = safeParse(answers['preensao_esq']);
    const gripD = safeParse(answers['preensao_dir']);
    const gender = (answers['gender'] || '').toLowerCase();
    const gripRef = gender === 'masculino' ? 27 : 16;
    if ((gripE > 0 && gripE < gripRef) || (gripD > 0 && gripD < gripRef)) {
      suggestions.push({ id: 'mao_fort_grip', title: 'Fortalecimento de Preensão', description: 'Exercícios compressivos e globais de mão.', category: 'Fortalecimento' });
    }

    // 3. Special Tests / Nerve
    if (answers['test_phalen_esq'] || answers['test_phalen_dir'] || answers['test_tinelm_esq'] || answers['test_tinelm_dir']) {
      suggestions.push({ id: 'mao_neuro_mediano', title: 'Deslizamento de Nervo Mediano', description: 'Técnicas de mobilização neural para túnel do carpo.', category: 'Manual' });
      suggestions.push({ id: 'mao_ed_posicao', title: 'Educação: Posicionamento Neutro', description: 'Orientação sobre ergonomia e repouso articular.', category: 'Educação' });
    }
    if (answers['test_fink_esq'] || answers['test_fink_dir']) {
      suggestions.push({ id: 'mao_t_glide', title: 'Deslizamento Tendíneo (De Quervain)', description: 'Exercícios suaves para o 1º compartimento extensor.', category: 'Mobilidade' });
    }
  }

  // -- LOGIC FOR CERVICAL (afCervical) --
  if (questionnaireId === 'afCervical') {
    // 1. ADM
    if (parseFloat(answers['flexao_graus']) < 50) {
      suggestions.push({ id: 'adm_c_flex', title: 'Restrição de Flexão Cervical', description: 'Trabalhar mobilidade de flexão crânio-cervical.', category: 'Mobilidade' });
    }
    if (parseFloat(answers['extensao_graus']) < 50) {
      suggestions.push({ id: 'adm_c_ext', title: 'Restrição de Extensão Cervical', description: 'Trabalhar mobilidade segmentar de extensão.', category: 'Mobilidade' });
    }
    if (parseFloat(answers['rot_esq_graus']) < 70 || parseFloat(answers['rot_dir_graus']) < 70) {
      suggestions.push({ id: 'adm_c_rot', title: 'Restrição de Rotação Cervical', description: 'Melhorar mobilidade rotacional (C1-C2 focus).', category: 'Mobilidade' });
    }

    // 2. Endurance
    if (answers['resist_flexora_res'] === 'Reduzido') {
      suggestions.push({ id: 'cervical_flexores', title: 'Resistência de Flexores Profundos', description: 'Exercícios de flexão crânio-cervical.', category: 'Fortalecimento' });
    }
    if (answers['resist_extensora_res'] === 'Reduzido') {
      suggestions.push({ id: 'cervical_extensores', title: 'Estabilidade Extensora', description: 'Treino de extensores profundos.', category: 'Fortalecimento' });
    }

    // 3. Neural Tension (ULNT)
    if (hasValue(answers['tensao_mediano_esq']) || hasValue(answers['tensao_mediano_dir'])) {
      suggestions.push({ id: 'neuro_mediano', title: 'Mobilização Neural (Mediano)', description: 'Deslizamento neural para membro superior (ULNT1).', category: 'Mobilidade' });
    }
    if (hasValue(answers['tensao_ulnar_esq']) || hasValue(answers['tensao_ulnar_dir'])) {
      suggestions.push({ id: 'neuro_ulnar', title: 'Mobilização Neural (Ulnar)', description: 'Deslizamento neural para membro superior (ULNT3).', category: 'Mobilidade' });
    }
    if (hasValue(answers['tensao_radial_esq']) || hasValue(answers['tensao_radial_dir'])) {
      suggestions.push({ id: 'neuro_radial', title: 'Mobilização Neural (Radial)', description: 'Deslizamento neural para membro superior (ULNT2).', category: 'Mobilidade' });
    }

    // 4. Trigger Points (Miofascial)
    const mioFieldsC: Record<string, string> = {
      'mio_suboccipitais': 'Suboccipitais',
      'mio_esplenios': 'Esplênios',
      'mio_escalenos': 'Escalenos',
      'mio_ecom': 'ECOM',
      'mio_trapezio': 'Trapézio Superior',
      'mio_lev_escapula': 'Elevador da Escápula',
      'mio_romboides': 'Romboides',
      'mio_peitorais': 'Peitorais'
    };

    Object.keys(mioFieldsC).forEach(key => {
      if (hasValue(answers[`${key}_esq`]) || hasValue(answers[`${key}_dir`])) {
        const side = (hasValue(answers[`${key}_esq`]) && hasValue(answers[`${key}_dir`])) ? '(Bilateral)' : hasValue(answers[`${key}_esq`]) ? '(Esq)' : '(Dir)';
        suggestions.push({
          id: `tp_c_${key}`,
          title: mioFieldsC[key],
          description: side,
          category: 'Manual',
          type: 'musculo'
        });
      }
    });

    // 5. Irritability (Vertebral Levels)
    const cLevels = ['c2', 'c3', 'c4', 'c5', 'c6', 'c7', 't1', 't2', 't3', 't4', 't5', 't6', 't7'];
    cLevels.forEach(lvl => {
      if (hasValue(answers[`palp_${lvl}_dor`])) {
        suggestions.push({
          id: `irr_c_${lvl}`,
          title: lvl.toUpperCase(),
          description: 'Sensibilidade detectada',
          category: 'Manual',
          type: 'vertebra'
        });
      }
    });
  }

  // -- LOGIC FOR GERIATRICS (afGeriatria) -- 
  if (questionnaireId === 'afGeriatria') {
    const tug = safeParse(answers['tug']);
    const gaitSpeed = safeParse(answers['vel_marcha']);
    const unipDir = safeParse(answers['unipodal_dir']);
    const unipEsq = safeParse(answers['unipodal_esq']);
    const sits = safeParse(answers['sentar_levantar']);
    const gripE = safeParse(answers['preensao_esq']);
    const gripD = safeParse(answers['preensao_dir']);

    // 1. Fall Risk & Balance
    if (tug > 12.47 || unipDir < 10 || unipEsq < 10 || safeParse(answers['tandem']) < 17.56) {
      suggestions.push({ id: 'ger_balance', title: 'Treino de Equilíbrio e Propriocepção', description: 'Exercícios de transferência de peso, marcha em tandem e apoio unipodal desafiado.', category: 'Mobilidade' });
      suggestions.push({ id: 'ger_home_safety', title: 'Educação: Segurança Domiciliar', description: 'Orientar sobre retirada de tapetes, iluminação adequada e uso de barras de apoio para prevenir quedas.', category: 'Educação' });
    }

    // 2. Strength / Sarcopenia Risk
    if (sits > 12 || gripE < 16 || gripD < 16) {
      suggestions.push({ id: 'ger_strength', title: 'Fortalecimento de Membros Inferiores', description: 'Focar em grandes grupos musculares (quadríceps, glúteos) para melhorar funcionalidade e independência.', category: 'Fortalecimento' });
    }

    // 3. Mobility / ADM
    if (safeParse(answers['adm_quadril_esq']) < 90 || safeParse(answers['adm_quadril_dir']) < 90) {
      suggestions.push({ id: 'ger_hip_mob', title: 'Mobilidade de Quadril', description: 'Exercícios para ganho de amplitude em flexão e rotações de quadril.', category: 'Mobilidade' });
    }

    // 4. Manual Therapy
    if (hasValue(answers['adm_geriatria_obs'])) {
      suggestions.push({ id: 'ger_manual', title: 'Terapia Manual Assistida', description: 'Mobilização articular suave e liberação miofascial se houver pontos gatilhos detectados.', category: 'Manual' });
    }
  }
  // -- LOGIC FOR SHOULDER (afOmbro) --
  if (questionnaireId === 'afOmbro') {
    // 1. ADM / Capsular
    const rlPassivaE = safeParse(answers['rl_passiva_e']);
    const rlPassivaD = safeParse(answers['rl_passiva_d']);
    const abdPassivaE = safeParse(answers['abd_f_passiva_e']);
    const abdPassivaD = safeParse(answers['abd_f_passiva_d']);

    if ((rlPassivaE > 0 && rlPassivaE < 45) || (rlPassivaD > 0 && rlPassivaD < 45)) {
      suggestions.push({ id: 'ombro_capsular', title: 'Mobilidade Capsular', description: 'Ganho de ADM passiva e mobilização articular (graus III/IV de Maitland).', category: 'Mobilidade' });
      suggestions.push({ id: 'ombro_edu_dor', title: 'Educação: Proteção e Dor', description: 'Orientar sobre curso natural da capsulite adesiva e controle de dor.', category: 'Educação' });
    }

    // 2. Strength / Rotator Cuff
    const deficitAbd = safeParse(answers['forca_abd_deficit']);
    const deficitRL = safeParse(answers['forca_rl_deficit']);
    if (deficitAbd > 15 || deficitRL > 15) {
      suggestions.push({ id: 'ombro_manguito', title: 'Fortalecimento de Manguito', description: 'Exercícios isométricos e isotônicos para rotadores laterais e abdutores.', category: 'Fortalecimento' });
    }

    // 3. Functional / CKCUEST
    if (answers['ckcuest_res_esq'] === 'Abaixo' || answers['ckcuest_res_dir'] === 'Abaixo') {
      suggestions.push({ id: 'ombro_estabilidade', title: 'Estabilidade Dinâmica', description: 'Treino de controle motor em cadeia cinética fechada e propriocepção.', category: 'Fortalecimento' });
    }

    // 4. Trigger Points (Miofascial)
    const mioFieldsS: Record<string, string> = {
      'trapezio_sup': 'Trapézio Superior',
      'deltoide_ant': 'Deltoide Anterior',
      'deltoide_med': 'Deltoide Médio',
      'deltoide_pos': 'Deltoide Posterior',
      'peitoral_maior': 'Peitoral Maior',
      'peitoral_menor': 'Peitoral Menor',
      'subclavio': 'Subclávio',
      'grande_dorsal': 'Grande Dorsal',
      'redondo_menor': 'Redondo Menor',
      'supra_espinhoso': 'Supra Espinhoso',
      'infraespinhoso': 'Infraespinhoso',
      'romboide': 'Romboide',
      'extensores_toracicos': 'Extensores Torácicos',
      'biceps': 'Bíceps',
      'triceps': 'Tríceps'
    };

    Object.keys(mioFieldsS).forEach(key => {
      if (hasValue(answers[`${key}_esq`]) || hasValue(answers[`${key}_dir`])) {
        const side = (hasValue(answers[`${key}_esq`]) && hasValue(answers[`${key}_dir`])) ? '(Bilateral)' : hasValue(answers[`${key}_esq`]) ? '(Esq)' : '(Dir)';
        suggestions.push({
          id: `tp_s_${key}`,
          title: `Liberação de ${mioFieldsS[key]}`,
          description: `Técnica manual ou agulhamento para desativar pontos gatilhos ${side}.`,
          category: 'Manual',
          type: 'musculo'
        });
      }
    });

    // 5. Agonist/Antagonist Balance (Ratio)
    const ratioE = parseInt(String(answers['rl_rm_ratio_esq'] || '0').replace('%', ''));
    const ratioD = parseInt(String(answers['rl_rm_ratio_dir'] || '0').replace('%', ''));
    if ((ratioE > 0 && ratioE < 72) || (ratioD > 0 && ratioD < 72)) {
      suggestions.push({ id: 'ombro_ratio', title: 'Equilíbrio RL/RM', description: 'Focar no fortalecimento isolado de rotadores laterais para equilibrar a relação com rotadores mediais.', category: 'Fortalecimento' });
    }
  }

  // -- LOGIC FOR LOWER LIMB (afMmii) --
  if (questionnaireId === 'afMmii') {
    // 1. ADM / Mobilidade
    const movements = ['flex_q', 'ext_q', 'abd_q', 'ext_j', 'flex_j'];
    movements.forEach(m => {
        if (safeParse(answers[`${m}_ativa_e`]) < 90 || safeParse(answers[`${m}_ativa_d`]) < 90) {
            suggestions.push({ id: `mmii_mob_${m}`, title: `Mobilidade de ${m.replace('_', ' ').toUpperCase()}`, description: 'Exercícios de ganho de amplitude articular e alongamento específico.', category: 'Mobilidade' });
        }
    });

    // 2. Força e Relação IQ
    const relE = safeParse(answers['rel_iq_esq']);
    const relD = safeParse(answers['rel_iq_dir']);
    if ((relE > 0 && (relE < 0.45 || relE > 0.60)) || (relD > 0 && (relD < 0.45 || relD > 0.60))) {
        suggestions.push({ id: 'mmii_iq_ratio', title: 'Equilíbrio I/Q (Isquiotibiais/Quadríceps)', description: 'Relação de força fora da faixa ideal (0,45-0,60). Focar no equilíbrio muscular entre isquiotibiais e quadríceps.', category: 'Fortalecimento' });
    }

    // 3. Estabilidade / YBT
    const ybtAsym = safeParse(answers['ybt_diff']);
    if (ybtAsym > 10) {
        suggestions.push({ id: 'mmii_ybt_asym', title: 'Assimetria de Controle Motor (YBT)', description: 'Treino de equilíbrio dinâmico e estabilidade lombo-pélvica direcionado ao lado deficitário.', category: 'Mobilidade' });
    }

    const sdE = safeParse(answers['sd_result_esq']) || safeParse(answers['sd_esq']);
    const sdD = safeParse(answers['sd_result_dir']) || safeParse(answers['sd_dir']);
    if (sdE >= 3 || sdD >= 3) {
        suggestions.push({ id: 'mmii_step_down', title: 'Controle de Valgo Dinâmico', description: 'Fortalecimento de glúteo médio e treino de controle motor para evitar colapso medial do joelho.', category: 'Fortalecimento' });
    }
  }

  // -- LOGIC FOR ANKLE (afTornozelo) --
  if (questionnaireId === 'afTornozelo') {
    // 1. ADM / WBLT
    if (safeParse(answers['wblt_esq']) < 10 || safeParse(answers['wblt_dir']) < 10 || safeParse(answers['wblt_def']) > 15) {
        suggestions.push({ id: 'ank_wblt', title: 'Ganho de Dorsiflexão', description: 'Trabalhar mobilidade de tornozelo (WBLT reduzido ou assimétrico). Mobilização talo-crural e alongamento de tríceps sural.', category: 'Mobilidade' });
    }

    // 2. Strength
    const deficits = ['f_pla_tor_def', 'f_dor_tor_def', 'f_inv_tor_def', 'f_eve_tor_def'];
    if (deficits.some(d => safeParse(answers[d]) > 15)) {
        suggestions.push({ id: 'ank_strength', title: 'Fortalecimento de Tornozelo', description: 'Focar no reequilíbrio de força entre inversores/eversores e flexores plantares/dorsais.', category: 'Fortalecimento' });
    }

    // 3. Step Down (if exists in torsozelo)
    const sdE = safeParse(answers['sd_result_esq']) || safeParse(answers['sd_esq']);
    const sdD = safeParse(answers['sd_result_dir']) || safeParse(answers['sd_dir']);
    if (sdE >= 2 || sdD >= 2) {
        suggestions.push({ id: 'ank_step_down', title: 'Controle Neuromuscular', description: 'Treino de controle motor unipodal e estabilização de joelho/tornozelo (Step Down alterado).', category: 'Fortalecimento' });
    }

    // 4. Trigger Points
    const ankMio: Record<string, string> = {
        'aquiles': 'Tendão de Aquiles',
        'fascia_plantar': 'Fáscia Plantar',
        'tibial_anterior': 'Tibial Anterior',
        'tibial_posterior': 'Tibial Posterior',
        'gastrocnemio': 'Gastrocnêmio',
        'soleo': 'Sóleo',
        'fibulares': 'Fibulares'
    };
    Object.keys(ankMio).forEach(key => {
        if (hasValue(answers[`palp_${key}_esq`]) || hasValue(answers[`palp_${key}_dir`])) {
            const side = (hasValue(answers[`palp_${key}_esq`]) && hasValue(answers[`palp_${key}_dir`])) ? '(Bilateral)' : hasValue(answers[`palp_${key}_esq`]) ? '(Esq)' : '(Dir)';
            suggestions.push({
                id: `tp_ank_${key}`,
                title: ankMio[key],
                description: `Sensibilidade/Tensão detectada ${side}.`,
                category: 'Manual',
                type: 'musculo'
            });
        }
    });

    // 5. Balance
    if (safeParse(answers['ybt_diff']) > 10) {
        suggestions.push({ id: 'ank_balance', title: 'Treino de Equilíbrio / YBT', description: 'Exercícios de estabilidade dinâmica devido à assimetria no Y-Balance Test.', category: 'Mobilidade' });
    }
  }

  // -- FINISH LOGIC --

  // Group by category
  const groups: Record<string, Suggestion[]> = {};
  suggestions.forEach(s => {
    if (!groups[s.category]) groups[s.category] = [];
    groups[s.category].push(s);
  });

  return Object.keys(groups).map(category => ({ category, items: groups[category] }));
}

export function generateTherapeuticText(questionnaireId: string, answers: Record<string, any>): string {
  const groups = getTherapeuticSuggestions(questionnaireId, answers);
  if (groups.length === 0) return "Sugerimos focar na manutenção da funcionalidade geral e educação do paciente.";

  let text = "SUGESTÕES TERAPÊUTICAS:\n\n";

  groups.forEach(group => {
    text += `${group.category.toUpperCase()}\n`;
    
    // Group muscles and vertebrae for better presentation
    const muscles = group.items.filter(i => i.type === 'musculo');
    const vertebrae = group.items.filter(i => i.type === 'vertebra');
    const others = group.items.filter(i => !i.type || i.type === 'outro');

    if (muscles.length > 0) {
      const muscleList = muscles.map(m => `${m.title} ${m.description}`).join(', ');
      text += `• Liberação manual da musculatura: ${muscleList}\n`;
    }

    if (vertebrae.length > 0) {
      const levelList = vertebrae.map(v => v.title).join(', ');
      text += `• Mobilização manual dos níveis: ${levelList}\n`;
    }

    others.forEach(item => {
      text += `• ${item.title}: ${item.description}\n`;
    });
    
    text += "\n";
  });

  return text.trim();
}

/**
 * Generates a Kinetic-Functional Diagnosis based on abnormalities found in the assessment.
 */
export function generateDiagnosticText(questionnaireId: string, answers: Record<string, any>): string {
  const findings: string[] = [];
  const hasValue = (val: any) => val !== undefined && val !== null && val !== "" && val !== false;

  // 1. Pain (EVA)
  if (answers['intensidade_dor'] && parseInt(answers['intensidade_dor']) > 0) {
    findings.push(`Presença de quadro álgico local/referido (EVA ${answers['intensidade_dor']}/10)`);
  }

  // 2. ROM (ADM)
  const romFindings: string[] = [];
  if (questionnaireId === 'afLombar') {
    if (parseFloat(answers['flexao_graus']) < 40) romFindings.push('Flexão');
    if (parseFloat(answers['extensao_graus']) < 20) romFindings.push('Extensão');
    if (parseFloat(answers['incl_esq_graus']) < 15 || parseFloat(answers['incl_dir_graus']) < 15) romFindings.push('Inclinação');
  } else if (questionnaireId === 'afCervical') {
    if (parseFloat(answers['flexao_graus']) < 50) romFindings.push('Flexão');
    if (parseFloat(answers['extensao_graus']) < 50) romFindings.push('Extensão');
    if (parseFloat(answers['rot_esq_graus']) < 70 || parseFloat(answers['rot_dir_graus']) < 70) romFindings.push('Rotação');
  } else if (questionnaireId === 'afOmbro') {
    const movements = [
      { id: 'flexao', label: 'Flexão', norm: 160 },
      { id: 'abd_f', label: 'Abdução', norm: 160 },
      { id: 'rl', label: 'Rotação Lateral', norm: 60 },
      { id: 'rm', label: 'Rotação Medial', norm: 70 }
    ];
    
    movements.forEach(m => {
      const passE = safeParse(answers[`${m.id}_passiva_e`]);
      const passD = safeParse(answers[`${m.id}_passiva_d`]);
      const checkSide = (val: number, side: string) => {
        if (val > 0 && val < m.norm) romFindings.push(`${m.label} ${side}`);
      };
      checkSide(passE, '(Esq)');
      checkSide(passD, '(Dir)');

      // Passive vs Active logic
      const actE = safeParse(answers[`${m.id}_ativa_e`]);
      const actD = safeParse(answers[`${m.id}_ativa_d`]);
      if ((passE - actE) >= 15) findings.push(`Déficit Ativo/Passivo em ${m.label} (Esq) sugerindo inibição muscular.`);
      if ((passD - actD) >= 15) findings.push(`Déficit Ativo/Passivo em ${m.label} (Dir) sugerindo inibição muscular.`);
    });

    // Patterns
    const isCapsularE = safeParse(answers['rl_passiva_e']) > 0 && safeParse(answers['rl_passiva_e']) < 45;
    const isCapsularD = safeParse(answers['rl_passiva_d']) > 0 && safeParse(answers['rl_passiva_d']) < 45;
    if (isCapsularE || isCapsularD) {
      findings.push(`Padrão capsular detectado ${isCapsularE ? '(Esq)' : ''} ${isCapsularD ? '(Dir)' : ''}. Sugestivo de Capsulite Adesiva / Alterações Capsulares.`);
    }

    // Special Tests
    const impactTests = [];
    if (answers['neer_esq'] || answers['neer_dir']) impactTests.push('Neer');
    if (answers['hawkins_esq'] || answers['hawkins_dir']) impactTests.push('Hawkins-Kennedy');
    if (impactTests.length > 0) findings.push(`Sinais de impacto subacromial via testes positivos (${impactTests.join(', ')}).`);

    const cuffTests = [];
    if (answers['job_esq'] || answers['job_dir']) cuffTests.push('Jobe (Supra)');
    if (answers['patte_esq'] || answers['patte_dir']) cuffTests.push('Patte (Infra)');
    if (answers['gerber_esq'] || answers['gerber_dir']) cuffTests.push('Gerber (Subescap)');
    if (cuffTests.length > 0) findings.push(`Sinais de envolvimento do manguito rotador nos testes (${cuffTests.join(', ')}).`);

    if (answers['speed_esq'] || answers['speed_dir']) findings.push('Sinais de comprometimento da cabeça longa do bíceps (Speed positivo).');
    if (answers['apreensao_esq'] || answers['apreensao_dir']) findings.push('Sinais de instabilidade articular (Apreensão positivo).');

    // Strength Symmetery
    const strengthMovements = [
      { id: 'forca_abd', label: 'Abdução' },
      { id: 'forca_rl', label: 'Rotadores Laterais' },
      { id: 'forca_rm', label: 'Rotadores Mediais' }
    ];

    strengthMovements.forEach(s => {
      const def = answers[`${s.id}_deficit`];
      if (def && parseFloat(def) > 15) {
        findings.push(`Déficit significativo de força em ${s.label} (${def} de assimetria entre os lados), indicando desequilíbrio muscular importante.`);
      }
    });

    // Ratio
    const ratioE = parseInt(String(answers['rl_rm_ratio_esq'] || '0').replace('%', ''));
    const ratioD = parseInt(String(answers['rl_rm_ratio_dir'] || '0').replace('%', ''));
    if ((ratioE > 0 && ratioE < 72) || (ratioD > 0 && ratioD < 72)) {
      findings.push(`Imbalanço na relação RL/RM detectado (abaixo de 72%), aumentando o risco de lesões labrais e instabilidade glenoumeral.`);
    }

    // Trigger Points
    const tps: string[] = [];
    const mioFields: Record<string, string> = {
      'trapezio_sup': 'Trapézio Superior',
      'peitoral_maior': 'Peitoral Maior',
      'peitoral_menor': 'Peitoral Menor',
      'infraespinhoso': 'Infraespinhoso',
      'supra_espinhoso': 'Supra'
    };
    Object.keys(mioFields).forEach(key => {
      if (answers[`${key}_esq`] || answers[`${key}_dir`]) tps.push(mioFields[key]);
    });
    if (tps.length > 0) findings.push(`Presença de pontos gatilhos ativos em: ${tps.join(', ')}.`);
  }
  if (romFindings.length > 0) {
    findings.push(`Limitação da amplitude de movimento (ADM) Passiva de: ${romFindings.join(', ')}`);
  }

  // 2.1 Myelopathy Screen (New)
  const specialTestsFields = [
    'hoffmann_esq', 'hoffmann_dir', 'babinski_esq', 'babinski_dir', 'clonus_esq', 'clonus_dir',
    'hoffmann_esq_l', 'hoffmann_dir_l', 'babinski_esq_l', 'babinski_dir_l', 'clonus_esq_l', 'clonus_dir_l'
  ];
  const hasPositiveSpecialTest = specialTestsFields.some(field => answers[field] === true);
  if (hasPositiveSpecialTest) {
    findings.push("Sugerido investigação de mielopatia cervical.");
  }

  // 2.2 Cauda Equina Screen (New)
  const caudaEquinaFields = ['cauda_esfincter_pos', 'cauda_mmii_pos', 'cauda_perineo_pos'];
  const hasCaudaEquinaSign = caudaEquinaFields.some(field => answers[field] === true);
  if (hasCaudaEquinaSign) {
    findings.push("Sinais sugestivos de Síndrome da Cauda Equina. Encaminhamento de EMERGÊNCIA.");
  }

  // 3. Endurance
  const enduranceFindings: string[] = [];
  if (answers['sorensen_res'] === 'Reduzido' || answers['resist_extensora_res'] === 'Reduzido') enduranceFindings.push('Extensores');
  if (answers['flexao_60_res'] === 'Reduzido' || answers['resist_flexora_res'] === 'Reduzido') enduranceFindings.push('Flexores');
  if (enduranceFindings.length > 0) {
    findings.push(`Redução da resistência muscular de: ${enduranceFindings.join(', ')}`);
  }

  // 4. Neural Tension
  const neuroFindings: string[] = [];
  if (hasValue(answers['tensao_mediano_esq']) || hasValue(answers['tensao_mediano_dir'])) neuroFindings.push('N. Mediano');
  if (hasValue(answers['tensao_ulnar_esq']) || hasValue(answers['tensao_ulnar_dir'])) neuroFindings.push('N. Ulnar');
  if (hasValue(answers['tensao_radial_esq']) || hasValue(answers['tensao_radial_dir'])) neuroFindings.push('N. Radial');
  if (hasValue(answers['tensao_lasegue_esq']) || hasValue(answers['tensao_lasegue_dir'])) neuroFindings.push('N. Isquiático (Lasegue)');
  if (hasValue(answers['tensao_slump_esq']) || hasValue(answers['tensao_slump_dir'])) neuroFindings.push('Eixo Neural (Slump)');
  if (hasValue(answers['tensao_femoral_esq']) || hasValue(answers['tensao_femoral_dir'])) neuroFindings.push('N. Femoral');
  
  if (neuroFindings.length > 0) {
    findings.push(`Alteração da neurodinâmica / Irritabilidade neural: ${neuroFindings.join(', ')}`);
  }

  // 5. Myofascial / Trigger Points
  const muscles: string[] = [];
  const mioList = questionnaireId === 'afLombar' 
    ? ['mio_quadrado_lombar', 'mio_gluteo_maximo', 'mio_gluteo_medio', 'mio_gluteo_minimo', 'mio_piriforme', 'mio_tfl', 'mio_iliopsoas']
    : ['mio_suboccipitais', 'mio_esplenios', 'mio_escalenos', 'mio_ecom', 'mio_trapezio', 'mio_lev_escapula', 'mio_romboides', 'mio_peitorais'];
  
  const muscleNames: Record<string, string> = {
    'mio_quadrado_lombar': 'Quadrado Lombar', 'mio_gluteo_maximo': 'Glúteo Máximo', 'mio_gluteo_medio': 'Glúteo Médio',
    'mio_gluteo_minimo': 'Glúteo Mínimo', 'mio_piriforme': 'Piriforme', 'mio_tfl': 'Tensor da Fáscia Lata',
    'mio_iliopsoas': 'Iliopsoas', 'mio_suboccipitais': 'Suboccipitais', 'mio_esplenios': 'Esplênios',
    'mio_escalenos': 'Escalenos', 'mio_ecom': 'ECOM', 'mio_trapezio': 'Trapézio Superior',
    'mio_lev_escapula': 'Elevador da Escápula', 'mio_romboides': 'Romboides', 'mio_peitorais': 'Peitorais'
  };

  mioList.forEach(key => {
    if (hasValue(answers[`${key}_esq`]) || hasValue(answers[`${key}_dir`])) {
      muscles.push(muscleNames[key]);
    }
  });
  if (muscles.length > 0) {
    findings.push(`Presença de pontos gatilhos miofasciais em: ${muscles.join(', ')}`);
  }

  // 6. Irritability / Vertebrae
  const vertebrae: string[] = [];
  const vList = questionnaireId === 'afLombar'
    ? ['t7', 't8', 't9', 't10', 't11', 't12', 'l1', 'l2', 'l3', 'l4', 'l5', 'sacro']
    : ['c2', 'c3', 'c4', 'c5', 'c6', 'c7', 't1', 't2', 't3', 't4', 't5', 't6', 't7'];
  
  vList.forEach(lvl => {
    if (hasValue(answers[`palp_${lvl}_dor`])) {
      vertebrae.push(lvl.toUpperCase());
    }
  });
  if (vertebrae.length > 0) {
    findings.push(`Disfunção segmentar / Irritabilidade vertebral nos níveis: ${vertebrae.join(', ')}`);
  }

  // 7. Muscle Strength (New)
  const strengthDeficits: string[] = [];
  Object.entries(answers).forEach(([key, val]) => {
    if (key.startsWith('forca_') && hasValue(val) && parseInt(val) < 5) {
      const label = key.replace('forca_', '').replace('_esq', ' (Esq)').replace('_dir', ' (Dir)').toUpperCase();
      strengthDeficits.push(`${label}: Grau ${val}/5`);
    }
  });
  if (strengthDeficits.length > 0) {
    findings.push(`Déficit de força muscular (Miótomos): ${strengthDeficits.join(', ')}`);
  }

  // 8. Reflexes / Hyperreflexia (New)
  const hyperReflexes: string[] = [];
  Object.entries(answers).forEach(([key, val]) => {
    if (key.startsWith('ref_') && val === 'Hiperreflexia') {
      const label = key.replace('ref_', '').replace('_esq', ' (Esq)').replace('_dir', ' (Dir)').toUpperCase();
      hyperReflexes.push(label);
    }
  });
  if (hyperReflexes.length > 0) {
    findings.push(`Presença de HIPERREFLEXIA (${hyperReflexes.join(', ')}). Sugere-se realizar Testes Especiais para sinais de liberação piramidal.`);
  }

  // 9. Geriatrics Specific (New)
  if (questionnaireId === 'afGeriatria') {
    const tug = safeParse(answers['tug']);
    const gaitSpeed = safeParse(answers['vel_marcha']);
    const unipE = safeParse(answers['unipodal_esq']);
    const unipD = safeParse(answers['unipodal_dir']);

    // Fall Risk Classification
    if (tug > 0 || unipE > 0 || unipD > 0) {
      const isHighRisk = tug > 15 || unipE < 5 || unipD < 5;
      const isModRisk = (tug > 12.47 && tug <= 15) || (unipE >= 5 && unipE < 10) || (unipD >= 5 && unipD < 10);
      
      if (isHighRisk) findings.push("ALTO RISCO DE QUEDAS: Paciente apresenta déficits críticos de mobilidade e equilíbrio.");
      else if (isModRisk) findings.push("RISCO MODERADO DE QUEDAS: Monitorar equilíbrio dinâmico e sugerir adaptações ambientais.");
      else findings.push("Risco de Quedas: Baixo/Dentro da normalidade para a idade.");
    }

    // Frailty / Sarcopenia
    if (gaitSpeed > 0 && gaitSpeed < 0.8) findings.push("Sinais de Fragilidade: Velocidade de marcha reduzida (< 0.8 m/s).");
    
    const sits = safeParse(answers['sentar_levantar']);
    if (sits > 12) findings.push(`Déficit de Força Funcional (MMII): Teste Sentar/Levantar elevado (${sits}s).`);

    const gripE = safeParse(answers['preensao_esq']);
    const gripD = safeParse(answers['preensao_dir']);
    const gripRef = 16; // Simple shared ref for logic check
    if ((gripE > 0 && gripE < gripRef) || (gripD > 0 && gripD < gripRef)) {
      findings.push("Sugerido rastreio de Sarcopenia devido à baixa força de preensão palmar.");
    }
  }

  // 10. Lower Limb Specific (afMmii)
  if (questionnaireId === 'afMmii') {
    // Força e Déficits
    ['abd_q', 'ext_q', 'ext_j', 'flex_j'].forEach(m => {
        const def = safeParse(answers[`f_${m}_def`]);
        if (def > 15) findings.push(`Assimetria importante de força em ${m.replace('_', ' ').toUpperCase()} (${def}%).`);
    });

    // Relação IQ
    const relE = safeParse(answers['rel_iq_esq']);
    const relD = safeParse(answers['rel_iq_dir']);
    if ((relE > 0 && (relE < 0.45 || relE > 0.60)) || (relD > 0 && (relD < 0.45 || relD > 0.60))) {
        findings.push(`Déficit na relação Isquiotibiais/Quadríceps (I/Q) detectado (${relE.toFixed(2).replace('.', ',')} Esq / ${relD.toFixed(2).replace('.', ',')} Dir). Fora da faixa de normalidade (0,45-0,60).`);
    }

    // Estabilidade
    const ybtAsym = safeParse(answers['ybt_diff']);
    if (ybtAsym > 10) findings.push(`Déficit de equilíbrio dinâmico (Assimetria YBT de ${ybtAsym}%).`);

    const sdE = safeParse(answers['sd_result_esq']);
    const sdD = safeParse(answers['sd_result_dir']);
    if (sdE >= 4 || sdD >= 4) findings.push(`Controle motor pobre no Step Down Test detectado (Escala ${sdE} Esq / ${sdD} Dir).`);
    else if (sdE >= 2 || sdD >= 2) findings.push(`Sinais de valgo dinâmico ou instabilidade detectados no Step Down Test.`);
  }

  // 11. Ankle Specific (afTornozelo)
  if (questionnaireId === 'afTornozelo') {
    // ADM / WBLT
    const wE = safeParse(answers['wblt_esq']);
    const wD = safeParse(answers['wblt_dir']);
    if (wE > 0 && wE < 10) findings.push(`Restrição importante de dorsiflexão em carga no lado Esquerdo (WBLT: ${wE}cm).`);
    if (wD > 0 && wD < 10) findings.push(`Restrição importante de dorsiflexão em carga no lado Direito (WBLT: ${wD}cm).`);
    
    const wDef = safeParse(answers['wblt_def']);
    if (wDef > 10) findings.push(`Assimetria significativa de mobilidade de tornozelo (WBLT: ${wDef}%).`);

    // Força
    ['pla_tor', 'dor_tor', 'inv_tor', 'eve_tor'].forEach(m => {
        const def = safeParse(answers[`f_${m}_def`]);
        if (def > 15) findings.push(`Déficit de força em ${m.replace('_', ' ').toUpperCase()} (${def}% de assimetria).`);
    });

    // YBT
    const ybtAsym = safeParse(answers['ybt_diff']);
    if (ybtAsym > 10) findings.push(`Assimetria no equilíbrio dinâmico detectada (YBT: ${ybtAsym}%).`);

    // Step Down
    const sdE = safeParse(answers['sd_result_esq']) || safeParse(answers['sd_esq']);
    const sdD = safeParse(answers['sd_result_dir']) || safeParse(answers['sd_dir']);
    if (sdE >= 2 || sdD >= 2) findings.push(`Alteração no controle neuromuscular detectada no Step Down Test.`);

    // Special Tests
    if (answers['test_thompson_esq'] || answers['test_thompson_dir']) findings.push('Sinal de Thompson positivo (Suspeita de ruptura do Tendão de Aquiles).');
    if (answers['test_kleiger_esq'] || answers['test_kleiger_dir'] || answers['test_squeeze_esq'] || answers['test_squeeze_dir']) {
        findings.push('Sinais positivos para lesão da sindesmose (Testes de Kleiger/Squeeze).');
    }
  }

  // 12. Hand Specific (afMao)
  if (questionnaireId === 'afMao') {
    // Força de Preensão
    const gripE = safeParse(answers['preensao_esq']);
    const gripD = safeParse(answers['preensao_dir']);
    const isMasc = (answers['gender'] || '').toLowerCase() === 'masculino';
    const gRef = isMasc ? 27 : 16;
    if (gripE > 0 && gripE < gRef) findings.push(`Déficit de preensão palmar Esquerdo (${gripE}kg / Ref: ${gRef}kg).`);
    if (gripD > 0 && gripD < gRef) findings.push(`Déficit de preensão palmar Direito (${gripD}kg / Ref: ${gRef}kg).`);

    // Pinças
    const pinRef = isMasc ? { p: 7, l: 10, t: 9 } : { p: 5, l: 7, t: 6 };
    ['esq', 'dir'].forEach(side => {
      const p = safeParse(answers[`polpa_${side}`]);
      const l = safeParse(answers[`lateral_${side}`]);
      const t = safeParse(answers[`tripode_${side}`]);
      if (p > 0 && p < pinRef.p) findings.push(`Fraqueza de Pinça Polpa-polpa ${side === 'esq' ? 'Esq' : 'Dir'}.`);
      if (l > 0 && l < pinRef.l) findings.push(`Fraqueza de Pinça Lateral ${side === 'esq' ? 'Esq' : 'Dir'}.`);
      if (t > 0 && t < pinRef.t) findings.push(`Fraqueza de Pinça Trípode ${side === 'esq' ? 'Esq' : 'Dir'}.`);
    });

    // ADM Punho
    if (safeParse(answers['extensao_pun_at_esq']) < 60 || safeParse(answers['extensao_pun_at_dir']) < 60) findings.push('Restrição de AM em Extensão de Punho.');
    if (safeParse(answers['flexao_pun_at_esq']) < 60 || safeParse(answers['flexao_pun_at_dir']) < 60) findings.push('Restrição de AM em Flexão de Punho.');

    // Testes Especiais
    if (answers['test_phalen_esq'] || answers['test_phalen_dir']) findings.push('Teste de Phalen Positivo (Sinais de Síndrome do Túnel do Carpo).');
    if (answers['test_tinelm_esq'] || answers['test_tinelm_dir']) findings.push('Sinal de Tinel Positivo no Punho.');
    if (answers['test_fink_esq'] || answers['test_fink_dir']) findings.push('Teste de Finkelstein Positivo (Tendinite de De Quervain).');
    if (answers['test_roos_esq'] || answers['test_roos_dir']) findings.push('Teste de Roos Positivo (Sugestivo de Síndrome do Desfiladeiro Torácico).');
  }

  if (findings.length === 0) return "DIAGNÓSTICO CINÉTICO FUNCIONAL:\n\n• Quadro de estabilidade e funcionalidade dentro dos padrões de normalidade.";

  return "DIAGNÓSTICO CINÉTICO FUNCIONAL:\n\n• " + findings.join('\n• ');
}
