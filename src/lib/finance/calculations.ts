export interface ExcelItem {
  key: string;
  label: string;
  block: 'geral' | 'secretaria' | 'kinesis' | 'cpfl' | 'fundo' | 'imposto';
  keywords: string[];
  clinicCat?: string; // override category when linking
}

export const EXCEL_ITEMS: ExcelItem[] = [
  // Geral
  { key: 'aluguel', label: 'Aluguel + IPTU', block: 'geral', keywords: ['IMOBILIARIA', 'FORTES GUIMARAES', 'ALUGUEL'] },
  { key: 'cpfl_adm', label: 'CPFL ADM', block: 'geral', keywords: ['CPFL ADM', 'CPFL_ADM'] },
  { key: 'guarda', label: 'Guarda', block: 'geral', keywords: ['SILVANA RIBEIRO', 'GUARDA'] },
  { key: 'claro', label: 'Claro', block: 'geral', keywords: ['CLARO'] },
  { key: 'darf_aluguel', label: 'DARF Aluguel', block: 'geral', keywords: ['DARF ALUGUEL'] },
  { key: 'saerp', label: 'SAERP', block: 'geral', keywords: ['SAERP', 'AGUA'] },
  { key: 'setron', label: 'Setron', block: 'geral', keywords: ['SETRON', 'CENTRO ELETRONICO'] },
  { key: 'cafe', label: 'Café', block: 'geral', keywords: ['CAFE', 'BONCAFE'] },
  { key: 'nina', label: 'Nina', block: 'geral', keywords: ['ALICE MARTINS', 'NINA'] },
  { key: 'marketing', label: 'Marketing', block: 'geral', keywords: ['MARKETING'] },
  { key: 'ar_cond', label: 'ar condicionado', block: 'geral', keywords: ['BRUNO REIS', 'AR COND'] },
  { key: 'imposto', label: 'Imposto', block: 'geral', keywords: ['SIMPLES NACIONAL', 'DARF SIMPLES'] },
  
  // Secretária
  { key: 'leticia', label: 'Leticia ', block: 'secretaria', keywords: ['LETICIA'] },
  { key: 'sindicato', label: 'Sindicato', block: 'secretaria', keywords: ['SINDICATO', 'SIND EMPREG'] },
  { key: 'fgts', label: 'FGTS', block: 'secretaria', keywords: ['FGTS'] },
  
  // Kinesis
  { key: 'contador', label: 'Contador', block: 'kinesis', keywords: ['LBRK', 'CONTADOR', 'CONTABILIDADE'] },
  { key: 'sistema', label: 'Sistema', block: 'kinesis', keywords: ['ARTEMIDAS', 'SISTEMA'] },
  { key: 'taxa_banco', label: 'Taxa Banco', block: 'kinesis', keywords: ['TARIFA', 'CESTA', 'PACOTE', 'TAR. AGRUPADAS'] },
  { key: 'darf_pro_labore', label: 'DARF Pró Labore', block: 'kinesis', keywords: ['DARF PRO LABORE'] },
  { key: 'pix_adm', label: 'PIX', block: 'kinesis', keywords: [] },
  { key: 'certificado_dig', label: 'Certificado Dig', block: 'kinesis', keywords: ['CERTIFICADO DIG'] },
  
  // CPFL por Sala
  { key: 'cpfl_sala_01', label: 'Sala 01', block: 'cpfl', keywords: ['CPFL'], clinicCat: 'CPFL_SALA_01' },
  { key: 'cpfl_sala_02', label: 'Sala 02 (Pilates)', block: 'cpfl', keywords: ['CPFL'], clinicCat: 'CPFL_SALA_02' },
  { key: 'cpfl_sala_03', label: 'Sala 03', block: 'cpfl', keywords: ['CPFL'], clinicCat: 'CPFL_SALA_03' },
  { key: 'cpfl_sala_04', label: 'Sala 04', block: 'cpfl', keywords: ['CPFL'], clinicCat: 'CPFL_SALA_04' },
  { key: 'cpfl_sala_05', label: 'Sala 05', block: 'cpfl', keywords: ['CPFL'], clinicCat: 'CPFL_SALA_05' },
  { key: 'cpfl_sala_06', label: 'Sala 06', block: 'cpfl', keywords: ['CPFL'], clinicCat: 'CPFL_SALA_06' },
];

export function runFinancialCalculations(transactionsList: any[], month?: number, year?: number) {
  const allMappedTransactions = transactionsList.map((t: any) => ({
    ...t,
    description: t.clinicDesc ?? t.description,
    amount: t.clinicAmount ?? t.amount,
    category: t.clinicCat ?? t.category,
    favorecido: t.clinicFavorecido || t.favorecido
  }));

  const mappedTransactions = new Map<string, any>();
  const claimedTxIds = new Set<string>();

  EXCEL_ITEMS.forEach(item => {
    if (item.clinicCat) {
      const tx = allMappedTransactions.find(t =>
        t.type === 'EXPENSE' &&
        (t.clinicCat ?? t.category)?.toUpperCase() === item.clinicCat?.toUpperCase() &&
        !claimedTxIds.has(t.id)
      );
      if (tx) {
        mappedTransactions.set(item.key, tx);
        claimedTxIds.add(tx.id);
      }
    }
  });

  EXCEL_ITEMS.forEach(item => {
    if (!mappedTransactions.has(item.key)) {
      const tx = allMappedTransactions.find(t => 
        t.type === 'EXPENSE' && 
        t.bank === 'MANUAL_CLINICA' &&
        ((t.clinicDesc ?? t.description) || '').trim().toUpperCase() === item.label.trim().toUpperCase() &&
        !claimedTxIds.has(t.id)
      );
      if (tx) {
        mappedTransactions.set(item.key, tx);
        claimedTxIds.add(tx.id);
      }
    }
  });

  EXCEL_ITEMS.forEach(item => {
    if (item.clinicCat) return; 
    if (!mappedTransactions.has(item.key)) {
      const tx = allMappedTransactions.find(t => {
        if (t.type !== 'EXPENSE' || t.bank === 'MANUAL_CLINICA' || claimedTxIds.has(t.id)) return false;
        if (t.clinicCat === 'UNMAPPED') return false;
        
        const norm = ((t.clinicDesc ?? t.description) || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        return norm === item.label.toUpperCase().trim() || item.keywords.some(kw => norm.includes(kw.toUpperCase()));
      });
      if (tx) {
        mappedTransactions.set(item.key, tx);
        claimedTxIds.add(tx.id);
      }
    }
  });

  const findMappedTransaction = (item: ExcelItem) => mappedTransactions.get(item.key);
  const allMappedIds = EXCEL_ITEMS.map(i => findMappedTransaction(i)?.id).filter(Boolean);

  const getTotalForBlock = (blockName: string) => {
    const items = EXCEL_ITEMS.filter(i => i.block === blockName);
    const hiddenItemKeys = allMappedTransactions
      .filter(t => t.bank === 'HIDDEN_ITEM')
      .map(t => (t.description || '').replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '').trim());
    const visibleItems = items.filter(i => !hiddenItemKeys.includes(i.key));
    
    const mappedSum = visibleItems.reduce((acc, item) => {
      const tx = mappedTransactions.get(item.key);
      return acc + (tx ? (tx.clinicAmount ?? tx.amount) : 0);
    }, 0);

    const blockCat = blockName === 'cpfl' ? null : blockName.toUpperCase();
    const extraSum = blockCat ? allMappedTransactions.filter(t =>
      t.type === 'EXPENSE' &&
      t.clinicCat?.toUpperCase() === blockCat &&
      !allMappedIds.includes(t.id)
    ).reduce((acc, tx) => acc + (tx.clinicAmount ?? tx.amount), 0) : 0;

    return mappedSum + extraSum;
  };

  const totalGeral = getTotalForBlock('geral');
  const totalSecretaria = getTotalForBlock('secretaria');
  const totalKinesis = getTotalForBlock('kinesis');

  const getExtraVal = (desc: string, cat: string) => {
    const isPilates = desc.toLowerCase().includes('(pilates)');
    const baseDesc = desc.replace(/\s*\((pilates)\)\s*/i, '').trim().toUpperCase();

    const matches = allMappedTransactions.filter(t => 
      t.category.toUpperCase() === cat.toUpperCase() && 
      (isPilates ? (t.favorecido || '').toUpperCase() === 'PILATES' : (t.favorecido || '').toUpperCase() !== 'PILATES') &&
      t.description.toUpperCase().includes(baseDesc)
    );
    return matches.reduce((acc, t) => acc + t.amount, 0);
  };

  const getExtraValWithSign = (desc: string, cat: string) => {
    const isPilates = desc.toLowerCase().includes('(pilates)');
    const baseDesc = desc.replace(/\s*\((pilates)\)\s*/i, '').trim().toUpperCase();

    const matches = allMappedTransactions.filter(t => 
      t.category.toUpperCase() === cat.toUpperCase() && 
      (isPilates ? (t.favorecido || '').toUpperCase() === 'PILATES' : (t.favorecido || '').toUpperCase() !== 'PILATES') &&
      t.description.toUpperCase().includes(baseDesc)
    );
    return matches.reduce((acc, t) => acc + (t.type === 'INCOME' ? t.amount : -t.amount), 0);
  };

  const getExtraId = (desc: string, cat: string) => {
    const isPilates = desc.toLowerCase().includes('(pilates)');
    const baseDesc = desc.replace(/\s*\((pilates)\)\s*/i, '').trim().toUpperCase();

    const found = allMappedTransactions.find(t => 
      t.category.toUpperCase() === cat.toUpperCase() && 
      (isPilates ? (t.favorecido || '').toUpperCase() === 'PILATES' : (t.favorecido || '').toUpperCase() !== 'PILATES') &&
      t.description.toUpperCase().includes(baseDesc)
    );
    return found ? found.id : undefined;
  };

  const getMappedVal = (key: string) => {
    const tx = mappedTransactions.get(key);
    return tx ? (tx.clinicAmount ?? tx.amount) : 0;
  };

  const cpflSala01 = getMappedVal('cpfl_sala_01');
  const cpflSala02 = getMappedVal('cpfl_sala_02');
  const cpflSala03 = getMappedVal('cpfl_sala_03');
  const cpflSala04 = getMappedVal('cpfl_sala_04');
  const cpflSala05 = getMappedVal('cpfl_sala_05');
  const cpflSala06 = getMappedVal('cpfl_sala_06');
  const cpflSum = cpflSala01 + cpflSala03 + cpflSala04 + cpflSala05 + cpflSala06;

  const getPartnerPaidExpenses = (partnerName: string) => {
    return allMappedTransactions.filter(t => {
      const cat = t.category?.toUpperCase() || '';
      const isEligibleCat = ['GERAL', 'SECRETARIA', 'KINESIS', 'EXCLUSIVO_FISIO', 'EXCLUSIVO_PILATES'].includes(cat) || cat.startsWith('CPFL_SALA_');
      return t.type === 'EXPENSE' && 
             t.favorecido?.toUpperCase() === partnerName && 
             isEligibleCat;
    }).reduce((acc, t) => acc + (t.clinicAmount ?? t.amount), 0);
  };

  const danielPaid = getPartnerPaidExpenses("DANIEL");
  const stuartPaid = getPartnerPaidExpenses("STUART");
  const paulaPaid = getPartnerPaidExpenses("PAULA");

  const fundoValItem = allMappedTransactions.find(t => t.category === 'PARTNER_ADJ' && t.description === 'Aporte Fundo Kinesis');
  let fundoVal = 0;
  if (fundoValItem) {
    fundoVal = fundoValItem.amount;
  } else {
    const isBeforeOrEqualMarch2026 = year !== undefined && month !== undefined && (year < 2026 || (year === 2026 && month <= 2));
    fundoVal = isBeforeOrEqualMarch2026 ? 0 : 1000;
  }
  
  const totalExclusivoFisio = allMappedTransactions
    .filter(t => t.type === 'EXPENSE' && (t.clinicCat?.toUpperCase() === 'EXCLUSIVO_FISIO' || t.category?.toUpperCase() === 'EXCLUSIVO_FISIO'))
    .reduce((acc, t) => acc + (t.clinicAmount ?? t.amount), 0);

  const totalExclusivoPilates = allMappedTransactions
    .filter(t => t.type === 'EXPENSE' && (t.clinicCat?.toUpperCase() === 'EXCLUSIVO_PILATES' || t.category?.toUpperCase() === 'EXCLUSIVO_PILATES'))
    .reduce((acc, t) => acc + (t.clinicAmount ?? t.amount), 0);

  const totalShared = (totalGeral * 0.83) + (totalSecretaria * 0.666) + (totalKinesis * 0.5) + cpflSum + fundoVal;

  const juliaEarning = getExtraVal("Julia", "PRO_EARNING");
  const gambaEarning = getExtraVal("Gambá", "PRO_EARNING");
  const newtonEarning = getExtraVal("Newton", "PRO_EARNING");
  const crisEarning = getExtraVal("Cris", "PRO_EARNING");
  const joaoEarning = getExtraVal("João", "PRO_EARNING");
  const ausenciaEarning = getExtraVal("Ausência Nula", "PRO_EARNING");

  const totalArrecadado = juliaEarning + gambaEarning + newtonEarning + crisEarning + joaoEarning + ausenciaEarning;
  const saldoFinal = totalArrecadado - (totalShared + totalExclusivoFisio);

  const juliaPilates = getExtraVal("Julia (Pilates)", "PRO_EARNING");
  const ausenciaPilates = getExtraVal("Ausência Nula (Pilates)", "PRO_EARNING");
  const impostoPilates = getExtraVal("Imposto (Pilates)", "PRO_EARNING");

  const arrecadadoPilates = (juliaPilates * 2) + ausenciaPilates;
  const custosPilates = (totalGeral * 0.17) + (totalSecretaria * 0.333) + (totalKinesis * 0.5) + cpflSala02;
  const saldoFinalPilates = arrecadadoPilates - juliaPilates - (custosPilates + totalExclusivoPilates) - impostoPilates;

  const danielAdj = getExtraValWithSign("Daniel Adicional", "PARTNER_ADJ");
  const stuartAdj = getExtraValWithSign("Stuart Adicional", "PARTNER_ADJ");
  const paulaAdj = getExtraValWithSign("Paula Adicional", "PARTNER_ADJ");

  const danielShare = (saldoFinal * 0.40) + (saldoFinalPilates / 3) - crisEarning + danielAdj + danielPaid;
  const stuartShare = (saldoFinal * 0.40) + (saldoFinalPilates / 3) + stuartAdj + stuartPaid;
  const paulaShare = (saldoFinal * 0.20) + (saldoFinalPilates / 3) + paulaAdj + paulaPaid;

  const allowedFavorecidos = ["KINESIS", "DANIEL", "STUART", "PAULA", "PILATES", "FUNDO"];
  const favTotals: Record<string, number> = { KINESIS: 0, DANIEL: 0, STUART: 0, PAULA: 0, PILATES: 0, FUNDO: 0 };
  const favTotalsBB: Record<string, number> = { KINESIS: 0, DANIEL: 0, STUART: 0, PAULA: 0, PILATES: 0, FUNDO: 0 };
  const favTotalsInter: Record<string, number> = { KINESIS: 0, DANIEL: 0, STUART: 0, PAULA: 0, PILATES: 0, FUNDO: 0 };

  allMappedTransactions.forEach((t: any) => {
    if (t.bank === 'MANUAL_CLINICA' || t.category === 'PRO_EARNING' || t.bank === 'HIDDEN_ITEM') {
      return;
    }

    const favorecido = (t.favorecido || '').toUpperCase();
    if (favorecido && allowedFavorecidos.includes(favorecido)) {
      const amount = t.type === 'INCOME' ? t.amount : -t.amount;
      
      favTotals[favorecido] += amount;
      
      const bankName = (t.bank || 'Banco do Brasil').toLowerCase();
      if (bankName === 'banco do brasil') {
        favTotalsBB[favorecido] += amount;
      } else if (bankName === 'banco inter') {
        favTotalsInter[favorecido] += amount;
      }
    }
  });

  const liquidatedFavTotals = { ...favTotals };
  const liquidatedFavTotalsBB = { ...favTotalsBB };
  const liquidatedFavTotalsInter = { ...favTotalsInter };

  const getPaidByBank = (partnerName: string) => {
    let bb = 0;
    let inter = 0;
    allMappedTransactions.forEach((t: any) => {
      const cat = t.category?.toUpperCase() || '';
      const isEligibleCat = ['GERAL', 'SECRETARIA', 'KINESIS', 'EXCLUSIVO_FISIO', 'EXCLUSIVO_PILATES'].includes(cat) || cat.startsWith('CPFL_SALA_');
      if (t.type === 'EXPENSE' && t.favorecido?.toUpperCase() === partnerName && isEligibleCat) {
        const bankName = (t.bank || 'Banco do Brasil').toLowerCase();
        if (bankName === 'banco do brasil') bb += t.amount;
        else if (bankName === 'banco inter') inter += t.amount;
      }
    });
    return { bb, inter };
  };

  const danielReimb = getPaidByBank("DANIEL");
  const stuartReimb = getPaidByBank("STUART");
  const paulaReimb = getPaidByBank("PAULA");

  const danielFisioAndAdj = (saldoFinal * 0.40) - crisEarning + danielAdj;
  const stuartFisioAndAdj = (saldoFinal * 0.40) + stuartAdj;
  const paulaFisioAndAdj = (saldoFinal * 0.20) + paulaAdj;
  const totalLucroFisioAndAdj = danielFisioAndAdj + stuartFisioAndAdj + paulaFisioAndAdj;

  const danielPilates = (saldoFinalPilates / 3);
  const stuartPilates = (saldoFinalPilates / 3);
  const paulaPilates = (saldoFinalPilates / 3);

  liquidatedFavTotalsBB['KINESIS'] -= (totalLucroFisioAndAdj + danielPaid + stuartPaid + paulaPaid);
  liquidatedFavTotalsInter['PILATES'] -= (saldoFinalPilates + custosPilates + totalExclusivoPilates);
  liquidatedFavTotalsInter['KINESIS'] += (custosPilates + totalExclusivoPilates);

  liquidatedFavTotalsBB['DANIEL'] += (danielFisioAndAdj + danielPaid);
  liquidatedFavTotalsInter['DANIEL'] += danielPilates;

  liquidatedFavTotalsBB['STUART'] += (stuartFisioAndAdj + stuartPaid);
  liquidatedFavTotalsInter['STUART'] += stuartPilates;

  liquidatedFavTotalsBB['PAULA'] += (paulaFisioAndAdj + paulaPaid);
  liquidatedFavTotalsInter['PAULA'] += paulaPilates;

  liquidatedFavTotalsBB['FUNDO'] += fundoVal;
  liquidatedFavTotalsBB['KINESIS'] -= fundoVal;

  transactionsList.forEach((t: any) => {
    if (t.clinicAmount !== null && t.clinicAmount !== undefined && t.clinicAmount !== t.amount) {
      const diff = t.amount - t.clinicAmount;
      const sign = t.type === 'INCOME' ? 1 : -1;
      const adjValue = diff * sign;
      
      const bankName = (t.bank || 'Banco do Brasil').toLowerCase();
      if (bankName === 'banco do brasil') {
        liquidatedFavTotalsBB['KINESIS'] += adjValue;
      } else if (bankName === 'banco inter') {
        liquidatedFavTotalsInter['KINESIS'] += adjValue;
      }
    }
  });

  allowedFavorecidos.forEach(fav => {
    liquidatedFavTotals[fav] = (liquidatedFavTotalsBB[fav] || 0) + (liquidatedFavTotalsInter[fav] || 0);
  });

  return {
    totalGeral, totalSecretaria, totalKinesis, cpflSum, cpflSala02,
    danielPaid, stuartPaid, paulaPaid,
    totalArrecadado, totalShared, saldoFinal,
    arrecadadoPilates, juliaPilates, ausenciaPilates, custosPilates, impostoPilates, saldoFinalPilates,
    danielAdj, stuartAdj, paulaAdj, crisEarning,
    danielShare, stuartShare, paulaShare,
    fundoVal,
    totalExclusivoFisio, totalExclusivoPilates,
    favTotals, favTotalsBB, favTotalsInter,
    liquidatedFavTotals, liquidatedFavTotalsBB, liquidatedFavTotalsInter,
    getExtraVal, getExtraId, allMappedIds, findMappedTransaction
  };
}
