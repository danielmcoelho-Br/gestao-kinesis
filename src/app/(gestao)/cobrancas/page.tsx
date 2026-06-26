"use client";

import { useEffect, useState, useMemo } from "react";
import { usePeriod } from "@/gestao/context/PeriodContext";
import { 
  CheckCircle2, 
  Search, 
  MessageSquare, 
  Copy, 
  RotateCcw, 
  Users, 
  DollarSign, 
  Calendar,
  Activity,
  Pencil,
  Trash2,
  Plus,
  Split
} from "lucide-react";
import { MetricCard } from "@/gestao/components/DashboardComponents";

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function CobrançasPage() {
  const { startMonth, startYear, setStartMonth, setStartYear } = usePeriod();
  // Usamos o início do período como referência para as cobranças individuais
  const selectedMonth = startMonth;
  const selectedYear = startYear;
  const setSelectedMonth = setStartMonth;
  const setSelectedYear = setStartYear;
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sentPatients, setSentPatients] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"cobrancas" | "notas">("cobrancas");
  const [notaFiscalPatients, setNotaFiscalPatients] = useState<Set<string>>(new Set());
  const [emitaPatients, setEmitaPatients] = useState<Set<string>>(new Set());

  // Novos estados para seleções de Notas Fiscais e Impostos
  const [patientEntities, setPatientEntities] = useState<Record<string, "Kinesis" | "MAF">>({});
  const [patientSubEntities, setPatientSubEntities] = useState<Record<string, string>>({});
  const [taxRate, setTaxRate] = useState<number>(0);

  // Novos estados para Lançamentos Manuais, Splits e Edição de Valores
  const [patientSplits, setPatientSplits] = useState<Record<string, { id: string; partName: string; value: number }[]>>({});
  const [manualInvoices, setManualInvoices] = useState<any[]>([]);
  const [patientEditedValues, setPatientEditedValues] = useState<Record<string, number>>({});
  const [showAddManualForm, setShowAddManualForm] = useState(false);
  const [manualNameInput, setManualNameInput] = useState("");
  const [manualValueInput, setManualValueInput] = useState("");

  // Chaves para persistência baseadas no período
  const storageKey = `sent-patients-${selectedMonth}-${selectedYear}`;
  const nfStorageKey = `nota-fiscal-patients-${selectedMonth}-${selectedYear}`;
  const emitaStorageKey = `emita-patients-${selectedMonth}-${selectedYear}`;
  const entitiesStorageKey = `nf-entities-${selectedMonth}-${selectedYear}`;
  const subEntitiesStorageKey = `nf-sub-entities-${selectedMonth}-${selectedYear}`;
  const taxRateStorageKey = `nf-tax-rate-${selectedMonth}-${selectedYear}`;
  const splitsStorageKey = `nf-splits-${selectedMonth}-${selectedYear}`;
  const manualStorageKey = `nf-manual-${selectedMonth}-${selectedYear}`;
  const editedValuesStorageKey = `nf-edited-values-${selectedMonth}-${selectedYear}`;

  const [dbLoaded, setDbLoaded] = useState(false);

  // Carregar status do localStorage e banco de dados ao mudar o período
  useEffect(() => {
    // 1. Sent Patients
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setSentPatients(new Set(JSON.parse(saved)));
      } catch (e) {
        setSentPatients(new Set());
      }
    } else {
      setSentPatients(new Set());
    }

    // 2. Nota Fiscal Patients
    const savedNf = localStorage.getItem(nfStorageKey);
    if (savedNf) {
      try {
        setNotaFiscalPatients(new Set(JSON.parse(savedNf)));
      } catch (e) {
        setNotaFiscalPatients(new Set());
      }
    } else {
      setNotaFiscalPatients(new Set());
    }

    // 3. Emita Patients
    const savedEmita = localStorage.getItem(emitaStorageKey);
    if (savedEmita) {
      try {
        setEmitaPatients(new Set(JSON.parse(savedEmita)));
      } catch (e) {
        setEmitaPatients(new Set());
      }
    } else {
      setEmitaPatients(new Set());
    }

    // 4. Patient Entities
    const savedEntities = localStorage.getItem(entitiesStorageKey);
    if (savedEntities) {
      try {
        setPatientEntities(JSON.parse(savedEntities));
      } catch (e) {
        setPatientEntities({});
      }
    } else {
      setPatientEntities({});
    }

    // 5. Patient Sub Entities
    const savedSubEntities = localStorage.getItem(subEntitiesStorageKey);
    if (savedSubEntities) {
      try {
        setPatientSubEntities(JSON.parse(savedSubEntities));
      } catch (e) {
        setPatientSubEntities({});
      }
    } else {
      setPatientSubEntities({});
    }

    // 6. Tax Rate
    const savedTaxRate = localStorage.getItem(taxRateStorageKey);
    if (savedTaxRate) {
      const parsed = parseFloat(savedTaxRate);
      setTaxRate(isNaN(parsed) ? 0 : parsed);
    } else {
      setTaxRate(0);
    }

    // 7. Patient Splits
    const savedSplits = localStorage.getItem(splitsStorageKey);
    if (savedSplits) {
      try {
        setPatientSplits(JSON.parse(savedSplits));
      } catch (e) {
        setPatientSplits({});
      }
    } else {
      setPatientSplits({});
    }

    // 8. Manual Invoices
    const savedManual = localStorage.getItem(manualStorageKey);
    if (savedManual) {
      try {
        setManualInvoices(JSON.parse(savedManual));
      } catch (e) {
        setManualInvoices([]);
      }
    } else {
      setManualInvoices([]);
    }

    // 9. Edited Values
    const savedEditedValues = localStorage.getItem(editedValuesStorageKey);
    if (savedEditedValues) {
      try {
        setPatientEditedValues(JSON.parse(savedEditedValues));
      } catch (e) {
        setPatientEditedValues({});
      }
    } else {
      setPatientEditedValues({});
    }
  }, [
    storageKey, nfStorageKey, emitaStorageKey, entitiesStorageKey, 
    subEntitiesStorageKey, taxRateStorageKey, splitsStorageKey, 
    manualStorageKey, editedValuesStorageKey
  ]);

  // Função para buscar as configurações do banco de dados
  const fetchConfig = async () => {
    try {
      const res = await fetch(`/api/cobrancas/config?month=${selectedMonth}&year=${selectedYear}`);
      if (res.ok) {
        const config = await res.json();
        if (config) {
          setNotaFiscalPatients(new Set(JSON.parse(config.notaFiscalPatients || "[]")));
          setEmitaPatients(new Set(JSON.parse(config.emitaPatients || "[]")));
          setPatientEntities(JSON.parse(config.patientEntities || "{}"));
          setPatientSubEntities(JSON.parse(config.patientSubEntities || "{}"));
          setTaxRate(config.taxRate || 0);
          setPatientSplits(JSON.parse(config.patientSplits || "{}"));
          setManualInvoices(JSON.parse(config.manualInvoices || "[]"));
          setPatientEditedValues(JSON.parse(config.patientEditedValues || "{}"));
        } else {
          // Se não houver configuração no banco para este período, carregar do LocalStorage (fallback)
          const savedNf = localStorage.getItem(nfStorageKey);
          setNotaFiscalPatients(savedNf ? new Set(JSON.parse(savedNf)) : new Set());

          const savedEmita = localStorage.getItem(emitaStorageKey);
          setEmitaPatients(savedEmita ? new Set(JSON.parse(savedEmita)) : new Set());

          const savedEntities = localStorage.getItem(entitiesStorageKey);
          setPatientEntities(savedEntities ? JSON.parse(savedEntities) : {});

          const savedSubEntities = localStorage.getItem(subEntitiesStorageKey);
          setPatientSubEntities(savedSubEntities ? JSON.parse(savedSubEntities) : {});

          const savedTaxRate = localStorage.getItem(taxRateStorageKey);
          setTaxRate(savedTaxRate ? parseFloat(savedTaxRate) || 0 : 0);

          const savedSplits = localStorage.getItem(splitsStorageKey);
          setPatientSplits(savedSplits ? JSON.parse(savedSplits) : {});

          const savedManual = localStorage.getItem(manualStorageKey);
          setManualInvoices(savedManual ? JSON.parse(savedManual) : []);

          const savedEditedValues = localStorage.getItem(editedValuesStorageKey);
          setPatientEditedValues(savedEditedValues ? JSON.parse(savedEditedValues) : {});
        }
      }
      setDbLoaded(true);
    } catch (e) {
      console.error("Error fetching billing config:", e);
      setDbLoaded(true); // Não trava a tela se houver erro
    }
  };

  // Carregar do banco de dados ao mudar o período
  useEffect(() => {
    setDbLoaded(false);
    fetchConfig();
  }, [selectedMonth, selectedYear]);

  // Recarregar configurações quando a aba/janela mudar de visibilidade (ex: trocar de aba)
  // Nota: Usamos visibilitychange em vez de focus para evitar que prompts/confirms modais reiniciem o estado local.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchConfig();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [selectedMonth, selectedYear]);

  // Sincronizar com banco de dados e LocalStorage com debounce
  useEffect(() => {
    if (!dbLoaded) return;

    // Atualizar LocalStorage localmente como cópia de segurança
    localStorage.setItem(nfStorageKey, JSON.stringify(Array.from(notaFiscalPatients)));
    localStorage.setItem(emitaStorageKey, JSON.stringify(Array.from(emitaPatients)));
    localStorage.setItem(entitiesStorageKey, JSON.stringify(patientEntities));
    localStorage.setItem(subEntitiesStorageKey, JSON.stringify(patientSubEntities));
    localStorage.setItem(taxRateStorageKey, String(taxRate));
    localStorage.setItem(splitsStorageKey, JSON.stringify(patientSplits));
    localStorage.setItem(manualStorageKey, JSON.stringify(manualInvoices));
    localStorage.setItem(editedValuesStorageKey, JSON.stringify(patientEditedValues));

    // Debounce sincronização com banco para 1 segundo
    const timer = setTimeout(async () => {
      try {
        await fetch("/api/cobrancas/config", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            month: selectedMonth,
            year: selectedYear,
            notaFiscalPatients: Array.from(notaFiscalPatients),
            emitaPatients: Array.from(emitaPatients),
            patientEntities,
            patientSubEntities,
            taxRate,
            patientSplits,
            manualInvoices,
            patientEditedValues,
          }),
        });
      } catch (e) {
        console.error("Error saving config to DB:", e);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    dbLoaded,
    selectedMonth,
    selectedYear,
    notaFiscalPatients,
    emitaPatients,
    patientEntities,
    patientSubEntities,
    taxRate,
    patientSplits,
    manualInvoices,
    patientEditedValues,
    nfStorageKey,
    emitaStorageKey,
    entitiesStorageKey,
    subEntitiesStorageKey,
    taxRateStorageKey,
    splitsStorageKey,
    manualStorageKey,
    editedValuesStorageKey
  ]);

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/cobrancas?month=${selectedMonth}&year=${selectedYear}`)
      .then(res => res.json())
      .then(json => {
        setData(Array.isArray(json) ? json : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  // Filtragem e Ordenação Alfabética
  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    
    return data
      .filter(p => p.patientName.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.patientName.localeCompare(b.patientName));
  }, [data, searchTerm]);

  // Estatísticas de Resumo
  const stats = useMemo(() => {
    const totalToCollect = data.reduce((acc, p) => acc + p.totalValue, 0);
    const totalSessions = data.reduce((acc, p) => acc + p.sessionCount + (p.absenceCount || 0), 0);
    const patientCount = data.length;
    const ticketAverage = patientCount > 0 ? totalToCollect / patientCount : 0;
    const sentCount = sentPatients.size;
    const pendingCount = Math.max(0, patientCount - sentCount);

    return { totalToCollect, totalSessions, patientCount, ticketAverage, sentCount, pendingCount };
  }, [data, sentPatients]);

  // Filtrar, unir com manuais, desdobrar splits e aplicar valores editados
  const notaFiscalData = useMemo(() => {
    const result: { 
      patientName: string; 
      displayName: string; 
      totalValue: number; 
      isSplitPart: boolean; 
      parentName: string; 
      parentKey: string;
      partId: string; 
      isManual: boolean; 
    }[] = [];
    
    // 1. Pacientes vindos das cobranças importadas
    if (Array.isArray(data)) {
      const activeNf = data.filter(p => notaFiscalPatients.has(p.patientName));
      activeNf.forEach(p => {
        const splits = patientSplits[p.patientName];
        if (splits && splits.length > 0) {
          splits.forEach(part => {
            const overridenValue = patientEditedValues[part.id];
            result.push({
              patientName: p.patientName,
              displayName: part.partName,
              totalValue: overridenValue !== undefined ? overridenValue : part.value,
              isSplitPart: true,
              parentName: p.patientName,
              parentKey: p.patientName,
              partId: part.id,
              isManual: false
            });
          });
        } else {
          const overridenValue = patientEditedValues[p.patientName];
          result.push({
            patientName: p.patientName,
            displayName: p.patientName,
            totalValue: overridenValue !== undefined ? overridenValue : p.totalValue,
            isSplitPart: false,
            parentName: p.patientName,
            parentKey: p.patientName,
            partId: p.patientName,
            isManual: false
          });
        }
      });
    }

    // 2. Lançamentos manuais de Notas Fiscais
    if (Array.isArray(manualInvoices)) {
      manualInvoices.forEach(m => {
        const splits = patientSplits[m.id];
        if (splits && splits.length > 0) {
          splits.forEach(part => {
            const overridenValue = patientEditedValues[part.id];
            result.push({
              patientName: m.patientName,
              displayName: part.partName,
              totalValue: overridenValue !== undefined ? overridenValue : part.value,
              isSplitPart: true,
              parentName: m.patientName,
              parentKey: m.id,
              partId: part.id,
              isManual: true
            });
          });
        } else {
          const overridenValue = patientEditedValues[m.id];
          result.push({
            patientName: m.patientName,
            displayName: m.patientName,
            totalValue: overridenValue !== undefined ? overridenValue : m.totalValue,
            isSplitPart: false,
            parentName: m.patientName,
            parentKey: m.id,
            partId: m.id,
            isManual: true
          });
        }
      });
    }

    return result.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [data, notaFiscalPatients, patientSplits, manualInvoices, patientEditedValues]);

  const totalNfValue = useMemo(() => {
    return notaFiscalData.reduce((acc, p) => acc + p.totalValue, 0);
  }, [notaFiscalData]);

  const totalEmitaValue = useMemo(() => {
    return notaFiscalData
      .filter(p => emitaPatients.has(p.partId))
      .reduce((acc, p) => acc + p.totalValue, 0);
  }, [notaFiscalData, emitaPatients]);

  // Totais consolidados para a planilha de resumo
  const summaryTotals = useMemo(() => {
    const totals: Record<string, number> = {
      "MAF": 0,
      "Kinesis - Kinesis": 0,
      "Kinesis - Pilates": 0,
      "Kinesis - Stuart": 0,
      "Kinesis - Paula": 0,
      "Kinesis - Daniel": 0,
      "Kinesis - Newton": 0,
      "Kinesis - Guilherme": 0,
      "Kinesis - João": 0,
      "Kinesis - Julia": 0,
      "Não Especificado": 0,
    };

    let totalGeneral = 0;
    let totalTaxGeneral = 0;

    notaFiscalData.forEach(p => {
      const entity = patientEntities[p.partId] || "";
      const subEntity = patientSubEntities[p.partId] || "";
      const val = p.totalValue;
      const tax = taxRate > 0 ? (val * taxRate) / 100 : 0;

      totalGeneral += val;
      totalTaxGeneral += tax;

      if (entity === "MAF") {
        totals["MAF"] += val;
      } else if (entity === "Kinesis") {
        const key = `Kinesis - ${subEntity || "Kinesis"}`;
        if (totals[key] !== undefined) {
          totals[key] += val;
        } else {
          totals["Kinesis - Kinesis"] += val;
        }
      } else {
        totals["Não Especificado"] += val;
      }
    });

    return { totals, totalGeneral, totalTaxGeneral };
  }, [notaFiscalData, patientEntities, patientSubEntities, taxRate]);

  const generateMessage = (p: any) => {
    const datesStr = p.dates.join('\n');
    let sessionSummary = `- Quantidade de sessões feitas: ${p.sessionCount} Sessões`;
    if (p.absenceCount > 0) {
      sessionSummary += `\n- Quantidade de faltas cobradas: ${p.absenceCount} Faltas`;
    }

    return `Relatório de Atendimentos

Prezado(a) Sr. (a). ${p.patientName}, segue relatório das sessões de Fisioterapia do corrente mês, incluindo as previstas nesta última semana, em caso de dúvidas entrar em contato por este número ou presencialmente.

${sessionSummary}
Valor total: R$ ${p.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

${datesStr}

Att,
Clínica Kinesis Fisioterapia`;
  };

  const handleCopy = (p: any) => {
    const msg = generateMessage(p);
    navigator.clipboard.writeText(msg);
  };

  const markAsSent = (patientName: string) => {
    setSentPatients(prev => {
      const next = new Set(prev);
      next.add(patientName);
      localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleWhatsApp = (p: any) => {
    const msg = encodeURIComponent(generateMessage(p));
    
    if (p.phone) {
      const cleanPhone = String(p.phone).replace(/\D/g, '');
      const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
      window.open(`https://wa.me/${fullPhone}?text=${msg}`, '_blank');
    } else {
      window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
    }
    
    markAsSent(p.patientName);
  };

  const handleReset = () => {
    if (confirm("Deseja resetar o status de envio para este mês?")) {
      setSentPatients(new Set());
      localStorage.removeItem(storageKey);
    }
  };

  const handleToggleNotaFiscal = (patientName: string, isChecked: boolean) => {
    setNotaFiscalPatients(prev => {
      const next = new Set(prev);
      if (isChecked) {
        next.add(patientName);
      } else {
        next.delete(patientName);
      }
      localStorage.setItem(nfStorageKey, JSON.stringify(Array.from(next)));
      return next;
    });

    if (!isChecked) {
      setEmitaPatients(prev => {
        const next = new Set(prev);
        next.delete(patientName);
        localStorage.setItem(emitaStorageKey, JSON.stringify(Array.from(next)));
        return next;
      });
      setPatientEntities(prev => {
        const next = { ...prev };
        delete next[patientName];
        localStorage.setItem(entitiesStorageKey, JSON.stringify(next));
        return next;
      });
      setPatientSubEntities(prev => {
        const next = { ...prev };
        delete next[patientName];
        localStorage.setItem(subEntitiesStorageKey, JSON.stringify(next));
        return next;
      });
      setPatientSplits(prev => {
        const next = { ...prev };
        delete next[patientName];
        localStorage.setItem(splitsStorageKey, JSON.stringify(next));
        return next;
      });
      setPatientEditedValues(prev => {
        const next = { ...prev };
        delete next[patientName];
        localStorage.setItem(editedValuesStorageKey, JSON.stringify(next));
        return next;
      });
    }
  };

  const handleToggleEmita = (partId: string, isChecked: boolean) => {
    setEmitaPatients(prev => {
      const next = new Set(prev);
      if (isChecked) {
        next.add(partId);
      } else {
        next.delete(partId);
      }
      localStorage.setItem(emitaStorageKey, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleUpdateEntity = (partId: string, entity: "Kinesis" | "MAF") => {
    setPatientEntities(prev => {
      const next = { ...prev, [partId]: entity };
      localStorage.setItem(entitiesStorageKey, JSON.stringify(next));
      return next;
    });
    
    if (entity === "MAF") {
      setPatientSubEntities(prev => {
        const next = { ...prev };
        delete next[partId];
        localStorage.setItem(subEntitiesStorageKey, JSON.stringify(next));
        return next;
      });
    } else {
      setPatientSubEntities(prev => {
        const next = { ...prev, [partId]: "Kinesis" };
        localStorage.setItem(subEntitiesStorageKey, JSON.stringify(next));
        return next;
      });
    }
  };

  const handleUpdateSubEntity = (partId: string, subEntity: string) => {
    setPatientSubEntities(prev => {
      const next = { ...prev, [partId]: subEntity };
      localStorage.setItem(subEntitiesStorageKey, JSON.stringify(next));
      return next;
    });
  };

  const handleUpdateTaxRate = (rate: number) => {
    setTaxRate(rate);
    localStorage.setItem(taxRateStorageKey, String(rate));
  };

  const handleSplitPatient = (patientId: string, currentValue: number) => {
    const userInput = prompt(
      `Digite o valor para a primeira parte da divisão (Valor total atual: R$ ${currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}):`
    );

    if (userInput === null) return; // User cancelled

    let cleanInput = userInput.replace(/[R$\s]/g, '').replace(/\./g, '');
    if (cleanInput.includes(',')) {
      cleanInput = cleanInput.replace(',', '.');
    }
    const val1 = Number(parseFloat(cleanInput).toFixed(2));
    if (isNaN(val1) || val1 <= 0 || val1 >= currentValue) {
      alert("Valor inválido! Deve ser um número maior que 0 e menor que o valor total.");
      return;
    }

    const val2 = Number((currentValue - val1).toFixed(2));

    const part1Id = `${patientId}-part1-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const part2Id = `${patientId}-part2-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    setPatientSplits(prev => {
      const next = {
        ...prev,
        [patientId]: [
          { id: part1Id, partName: `${patientId} (Parte 1)`, value: val1 },
          { id: part2Id, partName: `${patientId} (Parte 2)`, value: val2 }
        ]
      };
      localStorage.setItem(splitsStorageKey, JSON.stringify(next));
      return next;
    });
  };

  const handleUnsplitPatient = (patientId: string) => {
    if (confirm(`Deseja desfazer a divisão do paciente ${patientId}?`)) {
      setPatientSplits(prev => {
        const next = { ...prev };
        delete next[patientId];
        localStorage.setItem(splitsStorageKey, JSON.stringify(next));
        return next;
      });
    }
  };

  const handleAddManualInvoice = () => {
    if (!manualNameInput.trim()) {
      alert("Por favor, digite o nome do paciente.");
      return;
    }
    let cleanVal = manualValueInput.replace(/[R$\s]/g, '').replace(/\./g, '');
    if (cleanVal.includes(',')) {
      cleanVal = cleanVal.replace(',', '.');
    }
    const val = parseFloat(cleanVal);
    if (isNaN(val) || val <= 0) {
      alert("Por favor, digite um valor válido maior que 0.");
      return;
    }

    const newInvoice = {
      id: `manual-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      patientName: manualNameInput.trim(),
      totalValue: val
    };

    setManualInvoices(prev => {
      const next = [...prev, newInvoice];
      localStorage.setItem(manualStorageKey, JSON.stringify(next));
      return next;
    });

    setManualNameInput("");
    setManualValueInput("");
    setShowAddManualForm(false);
  };

  const handleDeleteManualInvoice = (id: string, name: string) => {
    if (confirm(`Deseja remover o lançamento manual do paciente ${name}?`)) {
      setManualInvoices(prev => {
        const next = prev.filter(m => m.id !== id);
        localStorage.setItem(manualStorageKey, JSON.stringify(next));
        return next;
      });

      setPatientSplits(prev => {
        const next = { ...prev };
        delete next[id];
        localStorage.setItem(splitsStorageKey, JSON.stringify(next));
        return next;
      });
    }
  };

  const handleEditValue = (partId: string, currentVal: number, displayName: string) => {
    const userInput = prompt(
      `Digite o novo valor para a nota fiscal de ${displayName} (Valor atual: R$ ${currentVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}):`
    );

    if (userInput === null) return; // User cancelled

    let cleanInput = userInput.replace(/[R$\s]/g, '').replace(/\./g, '');
    if (cleanInput.includes(',')) {
      cleanInput = cleanInput.replace(',', '.');
    }
    const newVal = parseFloat(cleanInput);
    if (isNaN(newVal) || newVal < 0) {
      alert("Por favor, digite um valor válido maior ou igual a 0.");
      return;
    }

    setPatientEditedValues(prev => {
      const next = { ...prev, [partId]: newVal };
      localStorage.setItem(editedValuesStorageKey, JSON.stringify(next));
      return next;
    });
  };

  const handleResetValue = (partId: string) => {
    setPatientEditedValues(prev => {
      const next = { ...prev };
      delete next[partId];
      localStorage.setItem(editedValuesStorageKey, JSON.stringify(next));
      return next;
    });
  };

  const handleResetNotaFiscal = () => {
    if (confirm("Deseja desmarcar todas as notas fiscais, emissões e configurações deste mês?")) {
      setNotaFiscalPatients(new Set());
      setEmitaPatients(new Set());
      setPatientEntities({});
      setPatientSubEntities({});
      setPatientSplits({});
      setManualInvoices([]);
      setPatientEditedValues({});
      setTaxRate(0);
      localStorage.removeItem(nfStorageKey);
      localStorage.removeItem(emitaStorageKey);
      localStorage.removeItem(entitiesStorageKey);
      localStorage.removeItem(subEntitiesStorageKey);
      localStorage.removeItem(splitsStorageKey);
      localStorage.removeItem(manualStorageKey);
      localStorage.removeItem(editedValuesStorageKey);
      localStorage.removeItem(taxRateStorageKey);
    }
  };

  return (
    <div style={{ paddingBottom: '60px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1.5px', margin: 0, color: 'var(--text-primary)' }}>
            Módulo <span style={{ color: 'var(--primary)' }}>Cobranças</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '4px' }}>Gestão de fechamentos e envios de WhatsApp</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', background: 'rgba(0,0,0,0.03)', padding: '6px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            style={{ padding: '10px 16px', borderRadius: '12px', border: 'none', background: 'white', color: 'var(--text-primary)', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
          >
            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{ padding: '10px 16px', borderRadius: '12px', border: 'none', background: 'white', color: 'var(--text-primary)', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
          <button 
            onClick={handleReset}
            title="Resetar Status"
            style={{ padding: '10px', borderRadius: '12px', border: 'none', background: 'white', color: 'var(--danger)', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center' }}
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </header>

      {/* Tabs superiores */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--border-color)', marginBottom: '32px', gap: '8px' }}>
        <button
          onClick={() => setActiveTab("cobrancas")}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === "cobrancas" ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === "cobrancas" ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: '700',
            fontSize: '1.05rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginBottom: '-2px'
          }}
        >
          Cobranças
        </button>
        <button
          onClick={() => setActiveTab("notas")}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === "notas" ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === "notas" ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: '700',
            fontSize: '1.05rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginBottom: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          Notas Fiscais
          {notaFiscalPatients.size > 0 && (
            <span style={{
              background: 'var(--primary)',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}>
              {notaFiscalPatients.size}
            </span>
          )}
        </button>
      </div>

      {activeTab === "cobrancas" ? (
        <>
          {/* Grid de Métricas */}
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            <MetricCard title="Qtd. Pacientes" value={stats.patientCount} icon={<Users />} color="#6366f1" />
            <MetricCard title="Envios Realizados" value={`${stats.sentCount} / ${stats.patientCount}`} icon={<MessageSquare />} color="#10b981" />
          </section>

          {/* Busca e Filtros */}
          <div className="card" style={{ 
            marginBottom: '32px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '15px', 
            padding: '18px 28px',
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0,0,0,0.05)',
            borderRadius: '24px'
          }}>
            <Search size={22} color="var(--text-secondary)" />
            <input 
              type="text" 
              placeholder="Buscar paciente por nome..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: '500' }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 'bold' }}>Limpar</button>
            )}
          </div>

          {loading ? (
            <div style={{ padding: '80px', textAlign: 'center' }}>
              <div className="loader" style={{ margin: '0 auto 24px' }}></div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Compilando dados de cobrança...</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: '28px' }}>
              {filteredData.map((p, idx) => {
                const isSent = sentPatients.has(p.patientName);
                const isNf = notaFiscalPatients.has(p.patientName);
                return (
                  <div key={idx} className="card fade-in" style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '20px', 
                    position: 'relative',
                    padding: '24px',
                    border: isSent ? '2px solid #22c55e' : '1px solid var(--border-color)',
                    background: isSent ? 'rgba(34, 197, 94, 0.02)' : 'white',
                    boxShadow: isSent ? '0 10px 30px rgba(34, 197, 94, 0.08)' : 'var(--shadow)',
                    transform: isSent ? 'translateY(2px)' : 'translateY(0)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}>
                    {isSent && (
                      <div style={{ 
                        position: 'absolute', 
                        top: '-12px', 
                        right: '24px', 
                        background: '#22c55e', 
                        color: 'white', 
                        padding: '6px 16px', 
                        borderRadius: '30px', 
                        fontSize: '0.75rem', 
                        fontWeight: '900', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)',
                        zIndex: 2,
                        letterSpacing: '0.5px'
                      }}>
                        <CheckCircle2 size={14} /> COBRANÇA ENVIADA
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <h3 style={{ 
                            color: 'var(--text-primary)', 
                            margin: 0, 
                            fontSize: '1.4rem', 
                            fontWeight: '800',
                            letterSpacing: '-0.5px'
                          }}>
                            {p.patientName}
                          </h3>
                          
                          {/* Checkbox Nota Fiscal */}
                          <label style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px', 
                            cursor: 'pointer', 
                            background: isNf ? 'rgba(99, 102, 241, 0.1)' : 'rgba(0,0,0,0.03)', 
                            border: isNf ? '1px solid var(--primary)' : '1px solid transparent',
                            color: isNf ? 'var(--primary)' : 'var(--text-secondary)',
                            padding: '4px 10px', 
                            borderRadius: '8px', 
                            fontSize: '0.75rem', 
                            fontWeight: '800',
                            transition: 'all 0.2s ease'
                          }}>
                            <input 
                              type="checkbox" 
                              checked={isNf}
                              onChange={(e) => handleToggleNotaFiscal(p.patientName, e.target.checked)}
                              style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                            />
                            <span>NOTA FISCAL</span>
                          </label>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                          <span style={{ 
                            fontSize: '0.85rem', 
                            background: 'rgba(0,0,0,0.04)', 
                            padding: '3px 10px', 
                            borderRadius: '6px', 
                            fontWeight: '700',
                            color: 'var(--text-secondary)'
                          }}>
                            {p.sessionCount} SESSÕES
                          </span>
                          {p.absenceCount > 0 && (
                            <span style={{ 
                              fontSize: '0.85rem', 
                              background: 'rgba(239, 68, 68, 0.1)', 
                              padding: '3px 10px', 
                              borderRadius: '6px', 
                              fontWeight: '700',
                              color: '#ef4444'
                            }}>
                              {p.absenceCount} FALTAS
                            </span>
                          )}
                          {p.phone && (
                            <span style={{ fontSize: '0.8rem', color: '#22c55e', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={14} /> WHATSAPP
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>Valor Total</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary)' }}>
                          R$ {p.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>

                    <div style={{ 
                      background: 'rgba(0,0,0,0.015)', 
                      padding: '20px', 
                      borderRadius: '16px', 
                      fontSize: '0.9rem', 
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap', 
                      maxHeight: '180px', 
                      overflowY: 'auto', 
                      border: '1px solid rgba(0,0,0,0.05)',
                      color: 'var(--text-secondary)',
                      fontFamily: 'monospace',
                      scrollbarWidth: 'thin'
                    }}>
                      {generateMessage(p)}
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                      <button 
                        onClick={() => handleCopy(p)}
                        className="btn"
                        style={{ 
                          flex: 1, 
                          padding: '14px', 
                          background: 'white', 
                          color: 'var(--text-primary)', 
                          border: '1px solid var(--border-color)', 
                          display: 'flex', 
                          justifyContent: 'center', 
                          alignItems: 'center', 
                          gap: '8px',
                          borderRadius: '14px',
                          fontWeight: '700'
                        }}
                      >
                        <Copy size={18} /> Copiar
                      </button>
                      <button 
                        onClick={() => handleWhatsApp(p)}
                        className="btn"
                        style={{ 
                          flex: 1.5, 
                          padding: '14px', 
                          background: isSent ? '#1a9e4e' : '#25D366', 
                          color: 'white', 
                          border: 'none', 
                          display: 'flex', 
                          justifyContent: 'center', 
                          alignItems: 'center', 
                          gap: '8px',
                          borderRadius: '14px',
                          fontWeight: '800',
                          boxShadow: '0 4px 15px rgba(37, 211, 102, 0.2)',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <MessageSquare size={20} /> {isSent ? 'Reenviar' : 'Enviar WhatsApp'}
                      </button>
                    </div>
                  </div>
                );
              })}
              
              {filteredData.length === 0 && (
                <div style={{ 
                  gridColumn: '1 / -1', 
                  padding: '120px 40px', 
                  textAlign: 'center', 
                  background: 'rgba(0,0,0,0.02)', 
                  borderRadius: '32px', 
                  border: '2px dashed var(--border-color)' 
                }}>
                  <div style={{ fontSize: '64px', marginBottom: '24px', opacity: 0.2 }}>🔍</div>
                  <h3 style={{ color: 'var(--text-secondary)', fontSize: '1.5rem', fontWeight: '700' }}>Nenhum paciente encontrado</h3>
                  <p style={{ color: 'var(--text-secondary)', opacity: 0.7, fontSize: '1.1rem' }}>Ajuste os filtros ou importe novos dados no menu de Upload.</p>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* Aba Notas Fiscais */
        <div className="card fade-in" style={{ 
          padding: '30px', 
          background: 'white', 
          borderRadius: '24px', 
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-1px', margin: 0, color: 'var(--text-primary)' }}>
                Emissão de <span style={{ color: 'var(--primary)' }}>Notas Fiscais</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '4px' }}>
                Pacientes selecionados para emissão no período de {months[selectedMonth]} de {selectedYear}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowAddManualForm(prev => !prev)}
                style={{ 
                  padding: '10px 16px', 
                  borderRadius: '12px', 
                  border: 'none', 
                  background: 'var(--primary)', 
                  color: 'white', 
                  cursor: 'pointer', 
                  fontWeight: '700', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)'
                }}
              >
                <Plus size={16} /> Adicionar Lançamento
              </button>
              {notaFiscalData.length > 0 && (
                <button
                  onClick={handleResetNotaFiscal}
                  style={{ 
                    padding: '10px 16px', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-color)', 
                    background: 'white', 
                    color: 'var(--danger)', 
                    cursor: 'pointer', 
                    fontWeight: '700', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}
                >
                  <RotateCcw size={16} /> Limpar Seleções
                </button>
              )}
            </div>
          </div>

          {/* Form para Lançamentos Manuais */}
          {showAddManualForm && (
            <div className="fade-in" style={{
              background: 'rgba(99, 102, 241, 0.03)',
              border: '1.5px dashed var(--primary)',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              marginBottom: '10px'
            }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>Novo Lançamento Manual</h3>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 2, minWidth: '200px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>Nome do Paciente</label>
                  <input
                    type="text"
                    value={manualNameInput}
                    onChange={(e) => setManualNameInput(e.target.value)}
                    placeholder="Nome Completo"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      outline: 'none',
                      fontSize: '0.95rem'
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '120px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>Valor da Nota (R$)</label>
                  <input
                    type="text"
                    value={manualValueInput}
                    onChange={(e) => setManualValueInput(e.target.value)}
                    placeholder="ex: 350,00"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      outline: 'none',
                      fontSize: '0.95rem',
                      fontWeight: '700'
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button
                  onClick={() => {
                    setShowAddManualForm(false);
                    setManualNameInput("");
                    setManualValueInput("");
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'white',
                    color: 'var(--text-secondary)',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddManualInvoice}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'var(--primary)',
                    color: 'white',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
                  }}
                >
                  Salvar Lançamento
                </button>
              </div>
            </div>
          )}

          {/* Campo de Alíquota de Imposto */}
          {notaFiscalData.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(0,0,0,0.02)',
              padding: '12px 20px',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              alignSelf: 'flex-start'
            }}>
              <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.95rem' }}>Alíquota de Imposto (%):</span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={taxRate || ""}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  handleUpdateTaxRate(isNaN(val) ? 0 : val);
                }}
                placeholder="0.0"
                style={{
                  width: '85px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  outline: 'none',
                  fontWeight: '700',
                  fontSize: '1rem',
                  textAlign: 'center',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          )}

          {/* Métricas da Aba */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div style={{ padding: '16px 20px', background: 'rgba(99, 102, 241, 0.04)', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.08)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Notas Selecionadas</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--primary)', marginTop: '4px' }}>
                R$ {totalNfValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: '600' }}>
                {notaFiscalPatients.size} paciente(s)
              </div>
            </div>
            <div style={{ padding: '16px 20px', background: 'rgba(34, 197, 94, 0.04)', borderRadius: '16px', border: '1px solid rgba(34, 197, 94, 0.08)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Emitidas (Marcar Emita)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#22c55e', marginTop: '4px' }}>
                R$ {totalEmitaValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: '600' }}>
                {emitaPatients.size} de {notaFiscalPatients.size} nota(s)
              </div>
            </div>
          </div>

          {/* Lista Simplificada */}
          {notaFiscalData.length === 0 ? (
            <div style={{ 
              padding: '60px 20px', 
              textAlign: 'center', 
              background: 'rgba(0,0,0,0.015)', 
              borderRadius: '20px', 
              border: '2px dashed var(--border-color)' 
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>📄</div>
              <h3 style={{ color: 'var(--text-secondary)', fontSize: '1.3rem', fontWeight: '700' }}>Nenhuma nota fiscal pendente</h3>
              <p style={{ color: 'var(--text-secondary)', opacity: 0.7, fontSize: '1rem', marginTop: '4px' }}>
                Volte para a aba de "Cobranças" e selecione o campo "NOTA FISCAL" nos cards dos pacientes.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notaFiscalData.map((p, idx) => {
                const isEmita = emitaPatients.has(p.partId);
                const selectedEntity = patientEntities[p.partId] || "";
                const selectedSubEntity = patientSubEntities[p.partId] || "";
                const calculatedTax = taxRate > 0 ? (p.totalValue * taxRate) / 100 : 0;
                const isEdited = patientEditedValues[p.partId] !== undefined;

                return (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 24px',
                    background: isEmita ? 'rgba(34, 197, 94, 0.02)' : 'rgba(0, 0, 0, 0.01)',
                    border: isEmita ? '2px solid #22c55e' : '1px solid var(--border-color)',
                    borderRadius: '16px',
                    boxShadow: isEmita ? '0 4px 12px rgba(34, 197, 94, 0.05)' : 'none',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    flexWrap: 'wrap',
                    gap: '15px'
                  }}>
                    {/* Checkbox e Nome */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 280px' }}>
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        cursor: 'pointer', 
                        fontWeight: '800', 
                        color: isEmita ? '#22c55e' : 'var(--text-primary)', 
                        fontSize: '0.85rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        background: isEmita ? 'rgba(34, 197, 94, 0.1)' : 'rgba(0,0,0,0.04)',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease',
                        userSelect: 'none'
                      }}>
                        <input 
                          type="checkbox"
                          checked={isEmita}
                          onChange={(e) => handleToggleEmita(p.partId, e.target.checked)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#22c55e' }}
                        />
                        <span>emita</span>
                      </label>
                      <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {p.displayName}
                        {p.isManual && (
                          <span style={{ fontSize: '0.65rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: '900' }}>MANUAL</span>
                        )}
                      </span>
                      <div style={{ display: 'flex', gap: '6px', marginLeft: '6px' }}>
                        {p.isSplitPart ? (
                          <button
                            onClick={() => handleUnsplitPatient(p.parentKey)}
                            title="Desfazer divisão e reunificar"
                            style={{
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              padding: '6px',
                              color: 'var(--primary)',
                              display: 'flex',
                              alignItems: 'center',
                              borderRadius: '8px',
                              transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <RotateCcw size={15} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSplitPatient(p.parentKey, p.totalValue)}
                            title="Dividir Nota em duas partes"
                            style={{
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              padding: '6px',
                              color: 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              borderRadius: '8px',
                              transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <Split size={15} />
                          </button>
                        )}
                        {p.isManual && (
                          <button
                            onClick={() => handleDeleteManualInvoice(p.parentKey, p.patientName)}
                            title="Excluir lançamento manual"
                            style={{
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              padding: '6px',
                              color: 'var(--danger)',
                              display: 'flex',
                              alignItems: 'center',
                              borderRadius: '8px',
                              transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Seletores Entidade e Sub-Opções */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <select
                        value={selectedEntity}
                        onChange={(e) => handleUpdateEntity(p.partId, e.target.value as "Kinesis" | "MAF")}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-color)',
                          background: 'white',
                          color: 'var(--text-primary)',
                          fontWeight: '700',
                          cursor: 'pointer',
                          outline: 'none',
                          fontSize: '0.9rem'
                        }}
                      >
                        <option value="">Entidade...</option>
                        <option value="Kinesis">Kinesis</option>
                        <option value="MAF">MAF</option>
                      </select>

                      {selectedEntity === "Kinesis" ? (
                        <select
                          value={selectedSubEntity}
                          onChange={(e) => handleUpdateSubEntity(p.partId, e.target.value)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '10px',
                            border: '1px solid var(--border-color)',
                            background: 'white',
                            color: 'var(--text-primary)',
                            fontWeight: '700',
                            cursor: 'pointer',
                            outline: 'none',
                            fontSize: '0.9rem'
                          }}
                        >
                          <option value="">Opção...</option>
                          <option value="Kinesis">Kinesis</option>
                          <option value="Pilates">Pilates</option>
                          <option value="Stuart">Stuart</option>
                          <option value="Paula">Paula</option>
                          <option value="Daniel">Daniel</option>
                          <option value="Newton">Newton</option>
                          <option value="Guilherme">Guilherme</option>
                          <option value="João">João</option>
                          <option value="Julia">Julia</option>
                        </select>
                      ) : (
                        <div style={{ width: '120px' }}></div>
                      )}
                    </div>

                    {/* Valores e Impostos */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', minWidth: '250px', justifyContent: 'flex-end' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '800' }}>
                            {isEdited ? 'Valor Editado' : 'Valor Total'}
                          </div>
                          <div style={{ 
                            fontSize: '1.2rem', 
                            fontWeight: '900', 
                            color: isEdited ? 'var(--primary)' : 'var(--text-primary)' 
                          }}>
                            R$ {p.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <button
                            onClick={() => handleEditValue(p.partId, p.totalValue, p.displayName)}
                            title="Editar valor"
                            style={{
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              padding: '4px',
                              color: 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              borderRadius: '6px',
                              transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <Pencil size={13} />
                          </button>
                          {isEdited && (
                            <button
                              onClick={() => handleResetValue(p.partId)}
                              title="Restaurar valor original"
                              style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                padding: '4px',
                                color: 'var(--danger)',
                                display: 'flex',
                                alignItems: 'center',
                                borderRadius: '6px',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <RotateCcw size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {taxRate > 0 && (
                        <div style={{ textAlign: 'right', borderLeft: '1px solid var(--border-color)', paddingLeft: '20px' }}>
                          <div style={{ fontSize: '0.65rem', color: '#ef4444', textTransform: 'uppercase', fontWeight: '800' }}>Imposto ({taxRate}%)</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#ef4444' }}>
                            R$ {calculatedTax.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Planilha de Resumo */}
          {notaFiscalData.length > 0 && (
            <div style={{ 
              marginTop: '40px', 
              borderTop: '2px solid var(--border-color)', 
              paddingTop: '30px' 
            }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '900', marginBottom: '18px', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                Resumo de Emissões por Opção
              </h3>
              
              <div style={{
                overflowX: 'auto',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  background: 'white',
                  fontSize: '0.95rem'
                }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '2px solid var(--border-color)' }}>
                      <th style={{ padding: '16px 20px', fontWeight: '800', color: 'var(--text-secondary)' }}>Opção / Entidade</th>
                      <th style={{ padding: '16px 20px', fontWeight: '800', color: 'var(--text-secondary)', textAlign: 'right' }}>Valor Total Emitido</th>
                      {taxRate > 0 && (
                        <th style={{ padding: '16px 20px', fontWeight: '800', color: 'var(--text-secondary)', textAlign: 'right' }}>Imposto ({taxRate}%)</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(summaryTotals.totals)
                      .filter(([_, value]) => value > 0)
                      .map(([option, val], idx) => {
                        const calculatedTax = taxRate > 0 ? (val * taxRate) / 100 : 0;
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '14px 20px', fontWeight: '700', color: 'var(--text-primary)' }}>{option}</td>
                            <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '800', color: 'var(--primary)' }}>
                              R$ {val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            {taxRate > 0 && (
                              <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '800', color: '#ef4444' }}>
                                R$ {calculatedTax.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    {/* Linha de Total Geral */}
                    <tr style={{ background: 'rgba(99, 102, 241, 0.03)', borderTop: '2px solid var(--primary)', fontWeight: '900' }}>
                      <td style={{ padding: '18px 20px', color: 'var(--text-primary)', fontSize: '1.05rem' }}>TOTAL GERAL</td>
                      <td style={{ padding: '18px 20px', textAlign: 'right', color: 'var(--primary)', fontSize: '1.15rem' }}>
                        R$ {summaryTotals.totalGeneral.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      {taxRate > 0 && (
                        <td style={{ padding: '18px 20px', textAlign: 'right', color: '#ef4444', fontSize: '1.15rem' }}>
                          R$ {summaryTotals.totalTaxGeneral.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
