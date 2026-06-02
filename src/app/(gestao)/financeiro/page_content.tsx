"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { usePeriod } from "@/gestao/context/PeriodContext";
import { CreditCard, TrendingUp, TrendingDown, DollarSign, Loader2, FileSpreadsheet, Split, Plus, X, Trash2, RefreshCw, Undo2, Redo2, Unlink, FileText, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const monthsPt = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const getFriendlyDescription = (description: string) => {
  const norm = (description || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (norm.includes('IMOBILIARIA') || norm.includes('FORTES GUIMARAES') || norm.includes('ALUGUEL')) {
    return 'Aluguel + IPTU';
  }
  if (norm.includes('LBRK') || norm.includes('CONTABILIDADE') || norm.includes('CONTADOR')) {
    return 'Contador';
  }
  if (norm.includes('ARTEMIDAS') || norm.includes('SISTEMA')) {
    return 'Sistema';
  }
  if (norm.includes('TARIFA') || norm.includes('CESTA') || norm.includes('PACOTE') || norm.includes('TAR. AGRUPADAS')) {
    return 'Taxa Banco';
  }
  if (norm.includes('LETICIA')) {
    return 'Leticia ';
  }
  if (norm.includes('SIND EMPREG') || norm.includes('SINDICATO')) {
    return 'Sindicato';
  }
  if (norm.includes('CENTRO ELETRONICO') || norm.includes('SETRON')) {
    return 'Setron';
  }
  if (norm.includes('SAERP') || norm.includes('AGUA')) {
    return 'SAERP';
  }
  if (norm.includes('CLARO')) {
    return 'Claro';
  }
  if (norm.includes('PARTIC')) {
    return 'Partic';
  }
  if (norm.includes('BONCAFE') || norm.includes('CAFE')) {
    return 'Café';
  }
  if (norm.includes('BRUNO REIS DE FARIA') || norm.includes('AR CONDICIONADO')) {
    return 'ar condicionado';
  }
  if (norm.includes('ALICE MARTINS FERREIRA') || norm.includes('NINA')) {
    return 'Nina';
  }
  if (norm.includes('SILVANA RIBEIRO SOARES') || norm.includes('GUARDA')) {
    return 'Guarda';
  }
  if (norm.includes('SIMPLES NACIONAL')) {
    return 'Simples Nacional';
  }
  if (norm.includes('DARF') || norm.includes('IMPOSTO')) {
    return 'Imposto';
  }
  return description.replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '');
};

interface ExcelItem {
  key: string;
  label: string;
  block: 'geral' | 'secretaria' | 'kinesis' | 'cpfl_sala_01' | 'cpfl_sala_02' | 'cpfl_sala_03' | 'cpfl_sala_04' | 'cpfl_sala_05' | 'cpfl_sala_06' | 'fundo' | 'imposto';
  keywords: string[];
}

const EXCEL_ITEMS: ExcelItem[] = [
  // Geral (Block A-C)
  { key: 'aluguel', label: 'Aluguel + IPTU', block: 'geral', keywords: ['IMOBILIARIA', 'FORTES GUIMARAES', 'ALUGUEL'] },
  { key: 'cpfl_adm', label: 'CPFL ADM', block: 'geral', keywords: ['CPFL'] },
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
  
  // Secretária (Block E-G)
  { key: 'leticia', label: 'Leticia ', block: 'secretaria', keywords: ['LETICIA'] },
  { key: 'sindicato', label: 'Sindicato', block: 'secretaria', keywords: ['SINDICATO', 'SIND EMPREG'] },
  { key: 'fgts', label: 'FGTS', block: 'secretaria', keywords: ['FGTS'] },
  
  // Kinesis (Block I-K)
  { key: 'contador', label: 'Contador', block: 'kinesis', keywords: ['LBRK', 'CONTADOR', 'CONTABILIDADE'] },
  { key: 'sistema', label: 'Sistema', block: 'kinesis', keywords: ['ARTEMIDAS', 'SISTEMA'] },
  { key: 'taxa_banco', label: 'Taxa Banco', block: 'kinesis', keywords: ['TARIFA', 'CESTA', 'PACOTE', 'TAR. AGRUPADAS'] },
  { key: 'darf_pro_labore', label: 'DARF Pró Labore', block: 'kinesis', keywords: ['DARF PRO LABORE'] },
  { key: 'pix_adm', label: 'PIX', block: 'kinesis', keywords: ['PIX'] },
  { key: 'certificado_dig', label: 'Certificado Dig', block: 'kinesis', keywords: ['CERTIFICADO DIG'] },
  
  // Específicos Fisio/Pilates (Block M-N / Q-R)
  { key: 'cpfl_sala_01', label: 'CPFL sala 01', block: 'cpfl_sala_01', keywords: ['SALA 01', 'SALA1'] },
  { key: 'cpfl_sala_02', label: 'CPFL sala 02', block: 'cpfl_sala_02', keywords: ['SALA 02', 'SALA2'] },
  { key: 'cpfl_sala_03', label: 'CPFL sala 03', block: 'cpfl_sala_03', keywords: ['SALA 03', 'SALA3'] },
  { key: 'cpfl_sala_04', label: 'CPFL sala 04', block: 'cpfl_sala_04', keywords: ['SALA 04', 'SALA4'] },
  { key: 'cpfl_sala_05', label: 'CPFL sala 05', block: 'cpfl_sala_05', keywords: ['SALA 05', 'SALA5'] },
  { key: 'cpfl_sala_06', label: 'CPFL sala 06', block: 'cpfl_sala_06', keywords: ['SALA 06', 'SALA6'] },
  { key: 'fundo', label: 'Fundo', block: 'fundo', keywords: ['FUNDO'] }
];

export default function FinanceiroPageContent() {
  const { startMonth, startYear, endMonth, endYear, initialized } = usePeriod();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'description' | 'favorecido' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [activeTab, setActiveTab] = useState<'fluxo' | 'custos'>('fluxo');
  const [syncing, setSyncing] = useState(false);
  
  // History State for Undo/Redo
  const [historyStack, setHistoryStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);
  const historyStackRef = useRef<any[]>([]);
  const redoStackRef = useRef<any[]>([]);

  // Search Filter state for Description column
  const [descriptionFilter, setDescriptionFilter] = useState("");



  // Manual Transaction Modal State
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [manualDescription, setManualDescription] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualType, setManualType] = useState("INCOME");
  const [manualFavorecido, setManualFavorecido] = useState("");
  const [manualCategory, setManualCategory] = useState("Recebimento");
  const [manualBank, setManualBank] = useState("Banco do Brasil");

  const activeTransactions = activeTab === 'fluxo' 
    ? transactions.filter((t: any) => t.bank !== 'MANUAL_CLINICA')
    : transactions.map((t: any) => ({
      ...t,
      description: t.clinicDesc ?? t.description,
      amount: t.clinicAmount ?? t.amount,
      category: t.clinicCat ?? t.category
    }));

  const loadTransactions = (showLoading = false) => {
    if (!initialized) return;
    if (showLoading && transactions.length === 0) setLoading(true);
    fetch(`/api/financeiro?startMonth=${startMonth}&startYear=${startYear}&endMonth=${endMonth}&endYear=${endYear}&_t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setTransactions(Array.isArray(data) ? data : []);
        if (showLoading) setLoading(false);
      })
      .catch(() => {
        setTransactions([]);
        if (showLoading) setLoading(false);
      });
  };

  useEffect(() => {
    loadTransactions(true);
  }, [startMonth, startYear, endMonth, endYear, initialized]);

  useEffect(() => {
    clientLog("FinanceiroPageContent mounted! historyStack size: " + historyStackRef.current.length);
  }, []);

  useEffect(() => {
    if (showManualModal) {
      const monthStr = String(startMonth + 1).padStart(2, '0');
      setManualDate(`${startYear}-${monthStr}-01`);
    }
  }, [showManualModal, startMonth, startYear]);

  const handleSort = (field: 'date' | 'description' | 'favorecido' | 'amount') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Deseja realmente excluir este lançamento?")) return;
    const target = activeTransactions.find(t => t.id === id);
    if (!target) return;

    const toastId = toast.loading("Excluindo lançamento...");
    try {
      const res = await fetch('/api/financeiro/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir.");
      
      // Track history
      historyStackRef.current = [...historyStackRef.current, {
        type: 'DELETE',
        transactionId: id,
        description: target.description,
        category: target.category,
        amount: target.amount,
        date: target.date,
        typeTx: target.type,
        bank: target.bank,
        favorecido: target.favorecido
      }];
      setHistoryStack(historyStackRef.current);
      clientLog("Pushed DELETE to history. Stack size: " + historyStackRef.current.length);

      redoStackRef.current = [];
      setRedoStack([]);

      toast.success("Excluído com sucesso!", { id: toastId });
      loadTransactions();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir lançamento.", { id: toastId });
    }
  };

  const handleRemoveFromClinicCosts = async (id: string) => {
    if (!confirm("Deseja realmente remover esta despesa dos Custos da Clínica? Ela continuará registrada no Fluxo de Caixa.")) return;
    const target = activeTransactions.find(t => t.id === id);
    if (!target) return;
    const oldCategory = target.category;

    const toastId = toast.loading("Removendo despesa dos custos...");
    try {
      const res = await fetch('/api/financeiro/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: id, category: 'OUTROS', isClinicEdit: true })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao remover.");
      
      // Track history
      historyStackRef.current = [...historyStackRef.current, {
        type: 'REMOVE_COST',
        transactionId: id,
        oldCategory
      }];
      setHistoryStack(historyStackRef.current);
      clientLog("Pushed REMOVE_COST to history. Stack size: " + historyStackRef.current.length);

      redoStackRef.current = [];
      setRedoStack([]);

      toast.success("Removido dos custos com sucesso!", { id: toastId });
      loadTransactions();
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover despesa dos custos.", { id: toastId });
    }
  };

  const clientLog = (msg: string) => {
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ log: msg })
    }).catch(() => {});
  };

  const handleUndo = async () => {
    clientLog("handleUndo clicked! Stack size: " + historyStackRef.current.length);
    if (historyStackRef.current.length === 0) return;
    const item = historyStackRef.current[historyStackRef.current.length - 1];
    clientLog("Undoing item: " + JSON.stringify(item));
    
    // Update stacks
    historyStackRef.current = historyStackRef.current.slice(0, -1);
    setHistoryStack(historyStackRef.current);

    if (item.type === 'REMOVE_COST') {
      try {
        const res = await fetch('/api/financeiro/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactionId: item.transactionId, category: item.oldCategory })
        });
        if (!res.ok) throw new Error();
        
        // Push to redo stack
        redoStackRef.current = [...redoStackRef.current, item];
        setRedoStack(redoStackRef.current);
        toast.success("Desfeito com sucesso!");
        loadTransactions();
      } catch (err) {
        toast.error("Erro ao desfazer.");
      }
      return;
    }

    if (item.type === 'CREATE') {
      // Remove from UI
      setTransactions(prev => prev.filter(t => t.id !== item.transactionId));
      
      try {
        const res = await fetch('/api/financeiro/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactionId: item.transactionId })
        });
        if (!res.ok) throw new Error();
        
        // Push to redo stack
        redoStackRef.current = [...redoStackRef.current, item];
        setRedoStack(redoStackRef.current);
        toast.success("Desfeito com sucesso!");
      } catch (err) {
        toast.error("Erro ao desfazer.");
        loadTransactions();
      }
      return;
    }

    if (item.type === 'DELETE') {
      try {
        const targetDate = item.date || new Date(startYear, startMonth, 1).toISOString().split('T')[0];
        const type = item.typeTx || (item.category === 'PRO_EARNING' ? 'INCOME' : 'EXPENSE');
        const res = await fetch('/api/financeiro/manual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: targetDate,
            description: item.description,
            amount: item.amount,
            type,
            category: item.category,
            bank: item.bank || 'BANCO DO BRASIL',
            favorecido: item.favorecido || 'KINESIS'
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error();
        
        const newTxId = data.transaction.id;
        const updatedItem = { ...item, transactionId: newTxId };
        
        // Push to redo stack
        redoStackRef.current = [...redoStackRef.current, updatedItem];
        setRedoStack(redoStackRef.current);
        toast.success("Desfeito com sucesso!");
        loadTransactions();
      } catch (err) {
        toast.error("Erro ao desfazer.");
      }
      return;
    }

    // Standard field update undo
    setTransactions(prev => prev.map(t => {
      if (t.id === item.transactionId) {
        return { ...t, [item.field]: item.oldValue };
      }
      return t;
    }));

    try {
      const body = { transactionId: item.transactionId, [item.field]: item.oldValue };
      const res = await fetch('/api/financeiro/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error();
      
      // Push to redo stack
      redoStackRef.current = [...redoStackRef.current, item];
      setRedoStack(redoStackRef.current);
      toast.success("Desfeito com sucesso!");
    } catch (err) {
      toast.error("Erro ao desfazer.");
      loadTransactions();
    }
  };

  const handleRedo = async () => {
    clientLog("handleRedo clicked! Stack size: " + redoStackRef.current.length);
    if (redoStackRef.current.length === 0) return;
    const item = redoStackRef.current[redoStackRef.current.length - 1];
    clientLog("Redoing item: " + JSON.stringify(item));
    
    // Update stacks
    redoStackRef.current = redoStackRef.current.slice(0, -1);
    setRedoStack(redoStackRef.current);

    if (item.type === 'REMOVE_COST') {
      try {
        const res = await fetch('/api/financeiro/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactionId: item.transactionId, category: 'OUTROS' })
        });
        if (!res.ok) throw new Error();
        
        // Push to history stack
        historyStackRef.current = [...historyStackRef.current, item];
        setHistoryStack(historyStackRef.current);
        toast.success("Refeito com sucesso!");
        loadTransactions();
      } catch (err) {
        toast.error("Erro ao refazer.");
      }
      return;
    }

    if (item.type === 'CREATE') {
      const toastId = toast.loading("Recriando...");
      try {
        const targetDate = item.date || new Date(startYear, startMonth, 1).toISOString().split('T')[0];
        const type = item.typeTx || (item.category === 'PRO_EARNING' ? 'INCOME' : 'EXPENSE');
        const res = await fetch('/api/financeiro/manual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: targetDate,
            description: item.description,
            amount: item.amount,
            type,
            category: item.category,
            bank: item.bank || 'BANCO DO BRASIL',
            favorecido: item.favorecido || 'KINESIS'
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error();
        
        const newTxId = data.transaction.id;
        const updatedItem = { ...item, transactionId: newTxId };
        
        // Push to history stack
        historyStackRef.current = [...historyStackRef.current, updatedItem];
        setHistoryStack(historyStackRef.current);
        toast.success("Refeito com sucesso!", { id: toastId });
        loadTransactions();
      } catch (err) {
        toast.error("Erro ao refazer.", { id: toastId });
      }
      return;
    }

    if (item.type === 'DELETE') {
      // Remove from UI
      setTransactions(prev => prev.filter(t => t.id !== item.transactionId));
      
      try {
        const res = await fetch('/api/financeiro/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactionId: item.transactionId })
        });
        if (!res.ok) throw new Error();
        
        // Push to history stack
        historyStackRef.current = [...historyStackRef.current, item];
        setHistoryStack(historyStackRef.current);
        toast.success("Refeito com sucesso!");
      } catch (err) {
        toast.error("Erro ao refazer.");
        loadTransactions();
      }
      return;
    }

    // Standard field update redo
    setTransactions(prev => prev.map(t => {
      if (t.id === item.transactionId) {
        return { ...t, [item.field]: item.newValue };
      }
      return t;
    }));

    try {
      const body = { transactionId: item.transactionId, [item.field]: item.newValue };
      const res = await fetch('/api/financeiro/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error();

      // Push to history stack
      historyStackRef.current = [...historyStackRef.current, item];
      setHistoryStack(historyStackRef.current);
      toast.success("Refeito com sucesso!");
    } catch (err) {
      toast.error("Erro ao refazer.");
      loadTransactions();
    }
  };

  const handleToggleAllChecks = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    const ids = sortedBankTransactions.map((t: any) => t.id);
    
    // Optimistic
    setTransactions(prev => prev.map(t => ids.includes(t.id) ? { ...t, isChecked: newValue } : t));
    
    try {
      const res = await fetch('/api/financeiro/bulk-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionIds: ids, isChecked: newValue })
      });
      if (!res.ok) throw new Error();
    } catch (err) {
      toast.error("Erro ao atualizar checks em massa. Recarregando...");
      loadTransactions(false);
    }
  };

  const handleUpdateTransactionField = async (id: string, field: string, value: string | boolean) => {
    clientLog("handleUpdateTransactionField called: " + id + ", field: " + field + ", val: " + value);
    const target = activeTransactions.find(t => t.id === id);
    if (!target) return;
    
    // Parse value for type safety and format checks
    let parsedValue = value;
    if (field === 'amount') {
      parsedValue = Number(Math.abs(parseFloat(value) || 0).toFixed(2));
    }
    
    const oldValue = target[field];
    if (oldValue === parsedValue) return;

    // Track history
    historyStackRef.current = [...historyStackRef.current, { transactionId: id, field, oldValue, newValue: parsedValue }];
    setHistoryStack(historyStackRef.current);
    clientLog("Pushed to history (update). New stack size: " + historyStackRef.current.length);
    
    redoStackRef.current = [];
    setRedoStack([]);

    // Optimistic local update
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        if (field === 'isChecked') return { ...t, isChecked: parsedValue };
        
        if (activeTab === 'custos') {
          if (field === 'amount') return { ...t, clinicAmount: parsedValue };
          if (field === 'description') return { ...t, clinicDesc: parsedValue };
          if (field === 'category') return { ...t, clinicCat: parsedValue };
          if (field === 'favorecido') return { ...t, favorecido: parsedValue };
        } else {
          if (field === 'amount') return { ...t, amount: parsedValue };
          if (field === 'description') return { ...t, description: parsedValue };
          if (field === 'favorecido') return { ...t, favorecido: parsedValue };
          if (field === 'category') return { ...t, category: parsedValue };
        }
      }
      return t;
    }));

    try {
      const body: any = { transactionId: id, isClinicEdit: activeTab === 'custos' };
      body[field] = parsedValue;
      if (field === 'isChecked') body.isChecked = parsedValue;
      const res = await fetch('/api/financeiro/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error();
    } catch (err) {
      toast.error("Erro ao atualizar campo. Recarregando...");
      loadTransactions(false);
    }
  };

  const handleCreateClinicCost = async (category: 'GERAL' | 'SECRETARIA' | 'KINESIS') => {
    const toastId = toast.loading("Adicionando novo custo...");
    try {
      const targetDate = new Date(startYear, startMonth, 1).toISOString().split('T')[0];
      const descName = `Novo Gasto ${category === 'GERAL' ? 'Geral' : category === 'SECRETARIA' ? 'Secretária' : 'Kinesis'}`;
      const res = await fetch('/api/financeiro/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: targetDate,
          description: descName,
          amount: 0.01,
          type: 'EXPENSE',
          category,
          bank: 'BANCO DO BRASIL',
          favorecido: 'KINESIS'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar.");

      // Track history
      if (data.transaction && data.transaction.id) {
        historyStackRef.current = [...historyStackRef.current, {
          type: 'CREATE',
          transactionId: data.transaction.id,
          description: descName,
          category,
          amount: 0.01,
          date: targetDate,
          typeTx: 'EXPENSE',
          bank: 'BANCO DO BRASIL',
          favorecido: 'KINESIS'
        }];
        setHistoryStack(historyStackRef.current);
        clientLog("Pushed CREATE to history (new cost). Stack size: " + historyStackRef.current.length);

        redoStackRef.current = [];
        setRedoStack([]);
      }

      toast.success("Novo custo criado com sucesso!", { id: toastId });
      loadTransactions(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao adicionar custo.", { id: toastId });
    }
  };

  const handleSaveExtraField = async (cleanDesc: string, category: 'CPFL_SALA' | 'PRO_EARNING' | 'PARTNER_ADJ', value: number, existingId?: string) => {
    clientLog("handleSaveExtraField called: desc=" + cleanDesc + ", val=" + value + ", existingId=" + existingId);
    if (existingId) {
      if (value === 0) {
        const toastId = toast.loading("Removendo...");
        try {
          const res = await fetch('/api/financeiro/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactionId: existingId })
          });
          if (!res.ok) throw new Error();
          
          // Track deletion in history
          const target = activeTransactions.find(t => t.id === existingId);
          const oldValue = target ? target.amount : 0;
          historyStackRef.current = [...historyStackRef.current, { 
            type: 'DELETE', 
            transactionId: existingId, 
            description: cleanDesc,
            category: category,
            amount: oldValue
          }];
          setHistoryStack(historyStackRef.current);
          clientLog("Pushed to history (delete extra). New stack size: " + historyStackRef.current.length);
          
          redoStackRef.current = [];
          setRedoStack([]);

          toast.success("Valor zerado e removido.", { id: toastId });
          loadTransactions();
        } catch (err) {
          toast.error("Erro ao remover.", { id: toastId });
        }
      } else {
        const target = activeTransactions.find(t => t.id === existingId);
        const oldValue = target ? target.amount : 0;
        if (oldValue !== value) {
          historyStackRef.current = [...historyStackRef.current, { transactionId: existingId, field: 'amount', oldValue, newValue: value }];
          setHistoryStack(historyStackRef.current);
          clientLog("Pushed to history (update extra). New stack size: " + historyStackRef.current.length);
          
          redoStackRef.current = [];
          setRedoStack([]);
        }
        const toastId = toast.loading("Atualizando...");
        try {
          const res = await fetch('/api/financeiro/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactionId: existingId, amount: value, isClinicEdit: true })
          });
          if (!res.ok) throw new Error();
          toast.success("Valor atualizado.", { id: toastId });
          loadTransactions(false);
        } catch (err) {
          toast.error("Erro ao atualizar.", { id: toastId });
        }
      }
    } else {
      if (value === 0) return;
      const toastId = toast.loading("Criando...");
      try {
        const targetDate = new Date(startYear, startMonth, 1).toISOString().split('T')[0];
        const type = category === 'PRO_EARNING' ? 'INCOME' : 'EXPENSE';
        const res = await fetch('/api/financeiro/manual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: targetDate,
            description: cleanDesc,
            amount: value,
            type,
            category,
            bank: 'BANCO DO BRASIL',
            favorecido: 'KINESIS'
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error();
        
        // Track creation in history
        if (data.transaction && data.transaction.id) {
          historyStackRef.current = [...historyStackRef.current, { 
            type: 'CREATE', 
            transactionId: data.transaction.id, 
            description: cleanDesc,
            category: category,
            amount: value 
          }];
          setHistoryStack(historyStackRef.current);
          clientLog("Pushed to history (create extra). New stack size: " + historyStackRef.current.length);
          
          redoStackRef.current = [];
          setRedoStack([]);
        }

        toast.success("Valor gravado.", { id: toastId });
        loadTransactions(false);
      } catch (err) {
        toast.error("Erro ao gravar.", { id: toastId });
      }
    }
  };

  const handleSyncSpreadsheet = async () => {
    setSyncing(true);
    const monthName = monthsPt[startMonth];
    const yearStr = String(startYear).slice(-2);
    
    const toastId = toast.loading(`Sincronizando planilhas de ${monthName}/${startYear}...`);
    try {
      const res = await fetch('/api/financeiro/sincronizar-planilha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: monthName, year: yearStr, sortBy, sortOrder })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao sincronizar.");
      
      toast.success(data.message || "Planilhas sincronizadas com sucesso!", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Erro ao sincronizar planilhas.", { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  const handleSplitSingleTransaction = async (id: string) => {
    const target = activeTransactions.find(t => t.id === id);
    if (!target) return;

    const totalAmount = target.amount;
    const userInput = prompt(
      `Digite o valor para a primeira parte da divisão (Valor total atual: R$ ${totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}):`
    );

    if (userInput === null) return; // User cancelled

    let cleanInput = userInput.replace(/[R$\s]/g, '');
    if (cleanInput.includes(',')) {
      cleanInput = cleanInput.replace(/\./g, '').replace(',', '.');
    }
    const val1 = Number(parseFloat(cleanInput).toFixed(2));
    if (isNaN(val1) || val1 <= 0 || val1 >= totalAmount) {
      alert("Valor inválido! Deve ser um número maior que 0 e menor que o valor total.");
      return;
    }

    const val2 = Number((totalAmount - val1).toFixed(2));

    const toastId = toast.loading("Dividindo lançamento...");
    try {
      const res = await fetch('/api/financeiro/split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transactionId: id,
          amount1: val1,
          amount2: val2
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao dividir.");
      
      toast.success("Lançamento dividido com sucesso!", { id: toastId });
      loadTransactions(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Falha ao dividir transação.", { id: toastId });
    }
  };

  const handleSaveManualTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDate || !manualDescription || !manualAmount) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    let cleanAmount = manualAmount.replace(/[R$\s]/g, '');
    if (cleanAmount.includes(',')) {
      cleanAmount = cleanAmount.replace(/\./g, '').replace(',', '.');
    }
    const amountNum = Number(parseFloat(cleanAmount).toFixed(2));
    if (isNaN(amountNum) || amountNum === 0) {
      toast.error("O valor da transação deve ser diferente de zero.");
      return;
    }

    const toastId = toast.loading("Salvando lançamento manual...");
    try {
      const res = await fetch('/api/financeiro/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: manualDate,
          description: manualDescription,
          amount: Math.abs(amountNum),
          type: amountNum < 0 ? 'EXPENSE' : manualType,
          favorecido: manualFavorecido,
          category: manualCategory,
          bank: manualBank
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar.");

      // Track history
      if (data.transaction && data.transaction.id) {
        historyStackRef.current = [...historyStackRef.current, {
          type: 'CREATE',
          transactionId: data.transaction.id,
          description: manualDescription,
          category: manualCategory,
          amount: Math.abs(amountNum),
          date: manualDate,
          typeTx: amountNum < 0 ? 'EXPENSE' : manualType,
          bank: manualBank,
          favorecido: manualFavorecido
        }];
        setHistoryStack(historyStackRef.current);
        clientLog("Pushed CREATE to history (manual transaction). Stack size: " + historyStackRef.current.length);

        redoStackRef.current = [];
        setRedoStack([]);
      }

      toast.success("Lançamento salvo com sucesso!", { id: toastId });
      setShowManualModal(false);
      
      // Clear form
      setManualDescription("");
      setManualAmount("");
      setManualFavorecido("");
      setManualCategory(manualType === "INCOME" ? "Recebimento" : "Despesa");

      loadTransactions(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Falha ao criar lançamento manual.", { id: toastId });
    }
  };

  const handleUpdateSingleFavorecido = async (id: string, value: string) => {
    const toastId = toast.loading("Atualizando favorecido...");
    try {
      const res = await fetch('/api/financeiro/update-favorecido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: id, favorecido: value })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar.");
      
      setTransactions(prev => prev.map(t => 
        t.id === id ? { ...t, favorecido: value } : t
      ));
      toast.success("Favorecido atualizado com sucesso!", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Falha ao atualizar favorecido.", { id: toastId });
    }
  };

  const bankTransactions = activeTransactions.filter((t: any) => {
    // Exibir TODAS as transações no painel de Custos para não esconder nada indevidamente
    return true;
  });

  const sortedBankTransactions = useMemo(() => {
    const filtered = bankTransactions.filter((t: any) => {
      const desc = (t.description || '').toLowerCase();
      return desc.includes(descriptionFilter.toLowerCase());
    });
    const sorted = [...filtered];
    const order = sortOrder === 'desc' ? -1 : 1;
    sorted.sort((a, b) => {
      let valA: any = a[sortBy] || '';
      let valB: any = b[sortBy] || '';

      if (sortBy === 'amount') {
        const amtA = a.type === 'INCOME' ? a.amount : -a.amount;
        const amtB = b.type === 'INCOME' ? b.amount : -b.amount;
        return (amtA - amtB) * order;
      }

      if (typeof valA === 'string') {
        valA = valA.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      }
      if (typeof valB === 'string') {
        valB = valB.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      }

      if (valA < valB) return -1 * order;
      if (valA > valB) return 1 * order;
      return 0;
    });
    return sorted;
  }, [bankTransactions, descriptionFilter, sortBy, sortOrder]);

  const totalIncome = bankTransactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = bankTransactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Calculo de totais por favorecido
  const allowedFavorecidos = ["KINESIS", "DANIEL", "STUART", "PAULA", "PILATES", "FUNDO"];
  const favTotals: Record<string, number> = {
    KINESIS: 0,
    DANIEL: 0,
    STUART: 0,
    PAULA: 0,
    PILATES: 0,
    FUNDO: 0
  };

  bankTransactions.forEach((t: any) => {
    const favorecido = (t.favorecido || '').toUpperCase();
    if (favorecido && allowedFavorecidos.includes(favorecido)) {
      if (t.type === 'INCOME') {
        favTotals[favorecido] += t.amount;
      } else {
        favTotals[favorecido] -= t.amount;
      }
    }
  });

  const favColors: Record<string, { border: string, bg: string, text: string }> = {
    KINESIS: { border: '#8b5cf6', bg: '#f5f3ff', text: '#6d28d9' },
    DANIEL: { border: '#10b981', bg: '#ecfdf5', text: '#047857' },
    STUART: { border: '#3b82f6', bg: '#eff6ff', text: '#1d4ed8' },
    PAULA: { border: '#ec4899', bg: '#fdf2f8', text: '#be185d' },
    PILATES: { border: '#06b6d4', bg: '#ecfeff', text: '#0891b2' },
    FUNDO: { border: '#f59e0b', bg: '#fffbeb', text: '#b45309' }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}><Loader2 className="animate-spin" /> Carregando financeiro...</div>;

  return (
    <div style={{ marginTop: '20px' }}>
      {/* Top Bar for Active Month & Undo/Redo */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '25px', 
        backgroundColor: '#ffffff', 
        padding: '16px 24px', 
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Dados de:</span>
          <span style={{ 
            fontSize: '1.2rem', 
            fontWeight: '800', 
            color: 'var(--primary)', 
            backgroundColor: 'rgba(99, 102, 241, 0.08)', 
            padding: '6px 14px', 
            borderRadius: '8px' 
          }}>
            {monthsPt[startMonth]} {startYear}
            { (startMonth !== endMonth || startYear !== endYear) && ` até ${monthsPt[endMonth]} ${endYear}` }
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleUndo}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: '800',
              fontSize: '0.85rem',
              cursor: historyStack.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              border: '1px solid #cbd5e1',
              background: historyStack.length === 0 ? '#f8fafc' : '#ffffff',
              color: historyStack.length === 0 ? '#94a3b8' : '#334155',
              boxShadow: historyStack.length === 0 ? 'none' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              opacity: historyStack.length === 0 ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (historyStack.length > 0) {
                e.currentTarget.style.background = '#f1f5f9';
                e.currentTarget.style.borderColor = '#94a3b8';
              }
            }}
            onMouseLeave={(e) => {
              if (historyStack.length > 0) {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }
            }}
          >
            <Undo2 size={16} />
            Desfazer
          </button>
          <button
            onClick={handleRedo}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: '800',
              fontSize: '0.85rem',
              cursor: redoStack.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              border: '1px solid #cbd5e1',
              background: redoStack.length === 0 ? '#f8fafc' : '#ffffff',
              color: redoStack.length === 0 ? '#94a3b8' : '#334155',
              boxShadow: redoStack.length === 0 ? 'none' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              opacity: redoStack.length === 0 ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (redoStack.length > 0) {
                e.currentTarget.style.background = '#f1f5f9';
                e.currentTarget.style.borderColor = '#94a3b8';
              }
            }}
            onMouseLeave={(e) => {
              if (redoStack.length > 0) {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }
            }}
          >
            <Redo2 size={16} />
            Refazer
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--success)' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Entradas</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
            <TrendingUp color="var(--success)" size={24} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--success)' }}>R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          </div>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--danger)' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Saídas</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
            <TrendingDown color="var(--danger)" size={24} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--danger)' }}>R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          </div>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--primary)' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Saldo Período</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
            <DollarSign color="var(--primary)" size={24} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          </div>
        </div>
      </div>

      {/* Resumo por Favorecido */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '15px', color: '#1e293b' }}>Resumo por Favorecido</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '15px' }}>
          {allowedFavorecidos.map(fav => {
            const value = favTotals[fav];
            const isNegative = value < 0;
            const colors = favColors[fav] || { border: '#cbd5e1', bg: '#f8fafc', text: '#475569' };
            return (
              <div key={fav} className="card" style={{ 
                padding: '16px', 
                borderLeft: `4px solid ${colors.border}`,
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                margin: 0
              }}>
                <p style={{ fontSize: '0.7rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', marginTop: 0 }}>{fav}</p>
                <h4 style={{ 
                  fontSize: '1.05rem', 
                  fontWeight: '800', 
                  color: value === 0 ? '#475569' : isNegative ? '#dc2626' : '#16a34a',
                  margin: 0
                }}>
                  {isNegative ? '-' : ''}R$ {Math.abs(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h4>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('fluxo')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: '800',
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: '1px solid #cbd5e1',
            background: activeTab === 'fluxo' ? 'var(--primary)' : 'white',
            color: activeTab === 'fluxo' ? 'white' : '#475569',
            boxShadow: activeTab === 'fluxo' ? '0 4px 6px -1px rgba(99, 102, 241, 0.2)' : 'none'
          }}
        >
          Fluxo de Caixa (Banco)
        </button>
        <button 
          onClick={() => setActiveTab('custos')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: '800',
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: '1px solid #cbd5e1',
            background: activeTab === 'custos' ? 'var(--primary)' : 'white',
            color: activeTab === 'custos' ? 'white' : '#475569',
            boxShadow: activeTab === 'custos' ? '0 4px 6px -1px rgba(99, 102, 241, 0.2)' : 'none'
          }}
        >
          Custos da Clínica (Financeiro 26)
        </button>
      </div>

      {activeTab === 'fluxo' ? (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CreditCard color="var(--primary)" size={24} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Fluxo de Caixa (Banco)</h3>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setShowManualModal(true)}
                className="btn"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  fontSize: '0.85rem', 
                  padding: '10px 20px', 
                  fontWeight: '800',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.borderColor = '#94a3b8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
              >
                <Plus size={16} />
                Novo Lançamento Manual
              </button>

              <Link 
                href="/financeiro/conciliador" 
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', padding: '10px 20px', fontWeight: '800' }}
              >
                <FileSpreadsheet size={16} />
                Conciliar Extrato BB
              </Link>
            </div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th 
                    onClick={() => handleSort('date')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    title="Ordenar por Data"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Data {sortBy === 'date' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                    </div>
                  </th>
                  <th style={{ minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                      <div 
                        onClick={() => handleSort('description')}
                        style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                        title="Ordenar por Descrição"
                      >
                        Descrição {sortBy === 'description' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                      </div>
                      <input 
                        type="text" 
                        placeholder="Buscar..."
                        value={descriptionFilter}
                        onChange={(e) => setDescriptionFilter(e.target.value)}
                        onClick={(e) => e.stopPropagation()} // Impede que a ordenação seja ativada ao clicar no campo de busca
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.75rem',
                          fontWeight: 'normal',
                          width: '130px',
                          outline: 'none',
                          color: '#334155',
                          background: '#ffffff'
                        }}
                      />
                    </div>
                  </th>
                  <th 
                    style={{ padding: '16px 20px', color: '#64748b', fontSize: '0.75rem', fontWeight: '800', borderBottom: '2px solid #f1f5f9' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        checked={sortedBankTransactions.length > 0 && sortedBankTransactions.every((t: any) => t.isChecked)} 
                        onChange={handleToggleAllChecks}
                        title="Marcar/Desmarcar todos desta página"
                        style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary)', flexShrink: 0 }} 
                      />
                      <div onClick={() => handleSort('favorecido')} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        Favorecido {sortBy === 'favorecido' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                      </div>
                    </div>
                  </th>
                  <th>Banco</th>
                  <th 
                    onClick={() => handleSort('amount')}
                    style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}
                    title="Ordenar por Valor"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                      Valor {sortBy === 'amount' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                    </div>
                  </th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {sortedBankTransactions.map((t: any) => {
                  const favorecido = (t.favorecido || '').toUpperCase();
                    const friendlyDesc = getFriendlyDescription(t.description);

                    return (
                      <tr key={t.id}>
                        <td style={{ fontWeight: '600' }}>{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                        <td>{friendlyDesc}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input 
                              type="checkbox" 
                              checked={!!t.isChecked} 
                              onChange={(e) => handleUpdateTransactionField(t.id, 'isChecked', e.target.checked)}
                              title="Marcar como conferido"
                              style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary)', flexShrink: 0 }} 
                            />
                            <select
                              value={favorecido}
                              onChange={(e) => handleUpdateSingleFavorecido(t.id, e.target.value)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: `1px solid ${favorecido ? (favColors[favorecido]?.border || '#cbd5e1') : '#cbd5e1'}`,
                                fontWeight: '800',
                                fontSize: '0.75rem',
                                background: favorecido ? (favColors[favorecido]?.bg || '#ffffff') : '#ffffff',
                                color: favorecido ? (favColors[favorecido]?.text || '#475569') : '#475569',
                                cursor: 'pointer',
                                outline: 'none',
                                flex: 1
                              }}
                            >
                              <option value="" style={{ background: '#ffffff', color: '#94a3b8' }}>-- Sem Favorecido --</option>
                              {allowedFavorecidos.map(fav => (
                                <option key={fav} value={fav} style={{ background: '#ffffff', color: favColors[fav]?.text || '#000000', fontWeight: '700' }}>
                                  {fav}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td>{t.bank}</td>
                        <td style={{ 
                          fontWeight: '800', 
                          color: t.type === 'INCOME' ? '#166534' : '#991b1b',
                          textAlign: 'right',
                          whiteSpace: 'nowrap'
                        }}>
                          {t.type === 'INCOME' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                            <button 
                              onClick={() => handleSplitSingleTransaction(t.id)}
                              title="Dividir Lançamento"
                              style={{ 
                                padding: '6px', 
                                borderRadius: '6px', 
                                border: '1px solid #e2e8f0', 
                                background: '#ffffff', 
                                color: '#64748b', 
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                                outline: 'none'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#1e40af';
                                e.currentTarget.style.borderColor = '#1e40af40';
                                e.currentTarget.style.background = '#eff6ff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#64748b';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                                e.currentTarget.style.background = '#ffffff';
                              }}
                            >
                              <Split size={12} />
                            </button>
                            <button 
                              onClick={() => handleDeleteTransaction(t.id)}
                              title="Excluir Lançamento"
                              style={{ 
                                padding: '6px', 
                                borderRadius: '6px', 
                                border: '1px solid #fecaca', 
                                background: '#ffffff', 
                                color: '#ef4444', 
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                                outline: 'none'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#b91c1c';
                                e.currentTarget.style.borderColor = '#fca5a5';
                                e.currentTarget.style.background = '#fef2f2';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#ef4444';
                                e.currentTarget.style.borderColor = '#fecaca';
                                e.currentTarget.style.background = '#ffffff';
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                })}
              </tbody>
            </table>
            {activeTransactions.length === 0 && (
              <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                Nenhuma transação encontrada para este período.
              </div>
            )}
          </div>
        </div>
      ) : (() => {
        // Clinic Costs Filter and Sum Calculations
        const geralCosts = activeTransactions.filter(t => t.type === 'EXPENSE' && t.category.toUpperCase() === 'GERAL');
        const secretariaCosts = activeTransactions.filter(t => t.type === 'EXPENSE' && t.category.toUpperCase() === 'SECRETARIA');
        const kinesisCosts = activeTransactions.filter(t => t.type === 'EXPENSE' && t.category.toUpperCase() === 'KINESIS');

        const totalGeral = geralCosts.reduce((acc, t) => acc + t.amount, 0);
        const totalSecretaria = secretariaCosts.reduce((acc, t) => acc + t.amount, 0);
        const totalKinesis = kinesisCosts.reduce((acc, t) => acc + t.amount, 0);

        const getExtraVal = (desc: string, cat: string) => {
          const found = activeTransactions.find(t => 
            t.category.toUpperCase() === cat.toUpperCase() && 
            (
              t.description.trim().toUpperCase() === desc.trim().toUpperCase() ||
              t.description.replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '').trim().toUpperCase() === desc.trim().toUpperCase()
            )
          );
          return found ? found.amount : 0;
        };

        const getExtraValWithSign = (desc: string, cat: string) => {
          const found = activeTransactions.find(t => 
            t.category.toUpperCase() === cat.toUpperCase() && 
            (
              t.description.trim().toUpperCase() === desc.trim().toUpperCase() ||
              t.description.replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '').trim().toUpperCase() === desc.trim().toUpperCase()
            )
          );
          if (!found) return 0;
          return found.type === 'INCOME' ? found.amount : -found.amount;
        };

        const getExtraId = (desc: string, cat: string) => {
          const found = activeTransactions.find(t => 
            t.category.toUpperCase() === cat.toUpperCase() && 
            (
              t.description.trim().toUpperCase() === desc.trim().toUpperCase() ||
              t.description.replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '').trim().toUpperCase() === desc.trim().toUpperCase()
            )
          );
          return found ? found.id : undefined;
        };

        const cpflSala01 = getExtraVal("CPFL Sala 01", "CPFL_SALA");
        const cpflSala02 = getExtraVal("CPFL Sala 02", "CPFL_SALA");
        const cpflSala03 = getExtraVal("CPFL Sala 03", "CPFL_SALA");
        const cpflSala04 = getExtraVal("CPFL Sala 04", "CPFL_SALA");
        const cpflSala05 = getExtraVal("CPFL Sala 05", "CPFL_SALA");
        const cpflSala06 = getExtraVal("CPFL Sala 06", "CPFL_SALA");
        const cpflSum = cpflSala01 + cpflSala03 + cpflSala04 + cpflSala05 + cpflSala06;

        // Paid by partners directly (reimbursements)
        const getPartnerPaidExpenses = (partnerName: string) => {
          return activeTransactions.filter(t => 
            t.type === 'EXPENSE' && 
            t.favorecido?.toUpperCase() === partnerName && 
            ['GERAL', 'SECRETARIA', 'KINESIS', 'CPFL_SALA'].includes(t.category?.toUpperCase() || '')
          ).reduce((acc, t) => acc + t.amount, 0);
        };

        const danielPaid = getPartnerPaidExpenses("DANIEL");
        const stuartPaid = getPartnerPaidExpenses("STUART");
        const paulaPaid = getPartnerPaidExpenses("PAULA");

        // Fundo Kinesis
        const fundoValItem = activeTransactions.find(t => t.category === 'PARTNER_ADJ' && t.description === 'Aporte Fundo Kinesis');
        const fundoVal = fundoValItem ? fundoValItem.amount : 1000;
        
        // Fisioterapia calculations
        const totalShared = (totalGeral * 0.83) + (totalSecretaria * 0.666) + (totalKinesis * 0.5) + cpflSum + fundoVal;

        const juliaEarning = getExtraVal("Julia", "PRO_EARNING");
        const gambaEarning = getExtraVal("Gambá", "PRO_EARNING");
        const newtonEarning = getExtraVal("Newton", "PRO_EARNING");
        const crisEarning = getExtraVal("Cris", "PRO_EARNING");
        const joaoEarning = getExtraVal("João", "PRO_EARNING");
        const ausenciaEarning = getExtraVal("Ausência Nula", "PRO_EARNING");

        const totalArrecadado = juliaEarning + gambaEarning + newtonEarning + crisEarning + joaoEarning + ausenciaEarning;
        const saldoFinal = totalArrecadado - totalShared;

        // Pilates calculations
        const juliaPilates = getExtraVal("Julia (Pilates)", "PRO_EARNING");
        const paulaPilates = getExtraVal("Paula (Pilates)", "PRO_EARNING");
        const ausenciaPilates = getExtraVal("Ausência Nula (Pilates)", "PRO_EARNING");
        const impostoPilates = getExtraVal("Imposto (Pilates)", "PRO_EARNING");

        const arrecadadoPilates = (juliaPilates * 2) + paulaPilates + ausenciaPilates;
        const custosPilates = (totalGeral * 0.17) + (totalSecretaria * 0.333) + (totalKinesis * 0.5) + cpflSala02;
        const saldoFinalPilates = arrecadadoPilates - juliaPilates - paulaPilates - custosPilates - impostoPilates;

        // Adjustments and Partner Splits
        const danielAdj = getExtraValWithSign("Daniel Adicional", "PARTNER_ADJ");
        const stuartAdj = getExtraValWithSign("Stuart Adicional", "PARTNER_ADJ");
        const paulaAdj = getExtraValWithSign("Paula Adicional", "PARTNER_ADJ");

        const danielShare = (saldoFinal * 0.40) + (saldoFinalPilates / 3) - crisEarning + danielAdj + danielPaid;
        const stuartShare = (saldoFinal * 0.40) + (saldoFinalPilates / 3) + stuartAdj + stuartPaid;
        const paulaShare = (saldoFinal * 0.20) + (saldoFinalPilates / 3) + paulaAdj + paulaPaid;

        const renderExtraField = (label: string, cleanDesc: string, category: 'CPFL_SALA' | 'PRO_EARNING' | 'PARTNER_ADJ') => {
          const value = getExtraVal(cleanDesc, category);
          const existingId = getExtraId(cleanDesc, category);
          
          return (
            <div key={cleanDesc} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>{label}</span>
              <input 
                type="number" 
                step="0.01"
                key={`${cleanDesc}_${value}`}
                defaultValue={value ? Number(value).toFixed(2) : ''}
                placeholder="0,00"
                onBlur={async (e) => {
                  const val = Number((parseFloat(e.target.value) || 0).toFixed(2));
                  if (val === value) return;
                  await handleSaveExtraField(cleanDesc, category, val, existingId);
                }}
                style={{
                  width: '105px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8rem',
                  fontWeight: '800',
                  textAlign: 'right',
                  outline: 'none',
                  background: '#ffffff',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
              />
            </div>
          );
        };

        return (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '20px',
              padding: '8px 4px'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Custos da Clínica — Referentes a {monthsPt[startMonth]} de {startYear}
              </h2>
            </div>
            {/* Dossier Structured Blocks with Sidebar */}
            <div style={{ display: 'flex', gap: '24px', position: 'relative', marginBottom: '30px', alignItems: 'flex-start' }}>
              
              {(() => {
                const findMappedTransaction = (item: ExcelItem) => {
                  return activeTransactions.find(t => 
                    t.type === 'EXPENSE' && 
                    getFriendlyDescription(t.description).toUpperCase() === item.label.toUpperCase()
                  );
                };

                const allMappedIds = EXCEL_ITEMS.map(i => findMappedTransaction(i)?.id).filter(Boolean);
                const blockCategories = ['GERAL', 'SECRETARIA', 'KINESIS'];
                const globalUnmappedCosts = activeTransactions.filter(t => 
                   t.type === 'EXPENSE' && 
                   blockCategories.includes(t.category?.toUpperCase() || '') &&
                   !allMappedIds.includes(t.id)
                );

                const renderDossierRow = (item: ExcelItem) => {
                  const transaction = findMappedTransaction(item);
                  
                  if (transaction) {
                    return (
                      <tr key={item.key} style={{ background: '#f0fdf4' }}>
                        <td style={{ fontWeight: '700', fontSize: '0.85rem', color: '#334155', padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
                          {item.label}
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <input 
                              type="text" 
                              defaultValue={transaction.description.replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '')}
                              onBlur={(e) => handleUpdateTransactionField(transaction.id, 'description', e.target.value)}
                              style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '0.8rem', fontWeight: '800', color: '#0f172a', outline: 'none' }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                              <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
                                Data: {transaction.date.split('-').reverse().slice(0,2).join('/')}
                              </span>
                              <select
                                value={transaction.favorecido || ''}
                                onChange={(e) => handleUpdateTransactionField(transaction.id, 'favorecido', e.target.value)}
                                style={{ border: 'none', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', padding: '2px 6px', fontSize: '0.65rem', fontWeight: '800', outline: 'none', color: transaction.favorecido ? (favColors[transaction.favorecido]?.text || '#166534') : '#166534', cursor: 'pointer' }}
                              >
                                <option value="">-- Pago por --</option>
                                {allowedFavorecidos.map(f => <option key={f} value={f}>{f}</option>)}
                              </select>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                            <span style={{ fontWeight: '800', color: '#15803d', fontSize: '0.85rem' }}>R$</span>
                            <input 
                              type="number" 
                              step="0.01"
                              defaultValue={Number(transaction.amount).toFixed(2)}
                              onBlur={(e) => handleUpdateTransactionField(transaction.id, 'amount', e.target.value)}
                              style={{ border: 'none', background: 'transparent', width: '80px', fontSize: '0.85rem', fontWeight: '800', color: '#15803d', textAlign: 'right', outline: 'none' }}
                            />
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
                          <button 
                            onClick={() => handleRemoveFromClinicCosts(transaction.id)} 
                            title="Desvincular Lançamento"
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              border: '1px solid #fee2e2',
                              background: '#fef2f2',
                              color: '#ef4444',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                            <Unlink size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={item.key} style={{ background: '#ffffff' }}>
                      <td style={{ fontWeight: '700', fontSize: '0.85rem', color: '#334155', padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
                        {item.label}
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
                        <select
                          onChange={async (e) => {
                            const txId = e.target.value;
                            if (txId) {
                              const toastId = toast.loading('Vinculando...');
                              try {
                                await fetch('/api/financeiro', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: txId, field: 'description', value: item.label })
                                });
                                toast.success('Vinculado com sucesso!', { id: toastId });
                                loadTransactions();
                              } catch(err) {
                                toast.error('Erro ao vincular', { id: toastId });
                              }
                            }
                          }}
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.75rem', fontWeight: '700', outline: 'none', color: '#334155', background: '#f8fafc', cursor: 'pointer' }}
                        >
                          <option value="">-- Buscar Lançamento --</option>
                          {globalUnmappedCosts.map(t => (
                            <option key={t.id} value={t.id}>
                              ({t.date.split('-').reverse().slice(0,2).join('/')}) - {t.description.substring(0, 30)}... (R$ {Math.abs(t.amount).toFixed(2)})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>
                        <input 
                          type="number"
                          step="0.01"
                          placeholder="0,00 (Manual)"
                          onBlur={async (e) => {
                             const val = Number((parseFloat(e.target.value) || 0).toFixed(2));
                             if (val > 0) {
                               const cat = ['geral', 'secretaria', 'kinesis'].includes(item.block) ? item.block.toUpperCase() : 'GERAL';
                               const toastId = toast.loading('Adicionando...');
                               try {
                                 await fetch('/api/financeiro/manual', {
                                   method: 'POST',
                                   headers: { 'Content-Type': 'application/json' },
                                   body: JSON.stringify({
                                     date: new Date(startYear, startMonth - 1, 15).toISOString().split('T')[0],
                                     description: item.label,
                                     amount: val,
                                     type: 'EXPENSE',
                                     category: cat,
                                     bank: 'MANUAL_CLINICA'
                                   })
                                 });
                                 toast.success('Adicionado com sucesso!', { id: toastId });
                                 e.target.value = '';
                                 loadTransactions();
                               } catch (err) {
                                 toast.error('Erro ao adicionar', { id: toastId });
                               }
                             }
                          }}
                          style={{ width: '100px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: '800', textAlign: 'right', outline: 'none' }}
                        />
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}></td>
                    </tr>
                  );
                };

                const renderBlock = (title: string, blockName: 'geral' | 'secretaria' | 'kinesis', total: number) => {
                  const items = EXCEL_ITEMS.filter(i => i.block === blockName);

                  return (
                    <div className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={16} color="var(--primary)" /> {title}
                        </h3>
                        <button 
                          onClick={() => handleCreateClinicCost(blockName.toUpperCase() as any)}
                          className="btn btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '800' }}>
                          <Plus size={14} /> Novo Adicional
                        </button>
                      </div>
                      <div style={{ overflowX: 'auto' }}>
                        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead>
                            <tr>
                              <th style={{ padding: '12px 16px', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '800', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Item Excel</th>
                              <th style={{ padding: '12px 16px', minWidth: '150px', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '800', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Lançamento Vinculado</th>
                              <th style={{ padding: '12px 16px', textAlign: 'right', width: '130px', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '800', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Valor (R$)</th>
                              <th style={{ padding: '12px 16px', textAlign: 'center', width: '80px', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '800', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map(item => renderDossierRow(item))}
                          </tbody>
                        </table>
                        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '0.9rem', color: '#0f172a', background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                          <span>TOTAL {title.toUpperCase()}:</span>
                          <span>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  );
                };

                return (
                  <>
                    {/* LEFT SIDE: BLOCKS */}
                    <div style={{ flex: '7', display: 'flex', flexDirection: 'column' }}>
                      {renderBlock("Gastos Gerais", "geral", totalGeral)}
                      {renderBlock("Gastos Secretária", "secretaria", totalSecretaria)}
                      {renderBlock("Gastos Kinesis", "kinesis", totalKinesis)}
                    </div>

                    {/* RIGHT SIDE: UNMAPPED TRANSACTIONS BOX (Sticky Sidebar) */}
                    <div style={{ 
                      flex: '3', 
                      position: 'sticky', 
                      top: '20px', 
                      height: 'calc(100vh - 40px)', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '16px' 
                    }}>
                      <div className="card" style={{ 
                        flex: '1', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        padding: '24px', 
                        overflow: 'hidden', 
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                        border: '1.5px solid #cbd5e1'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '12px', marginBottom: '16px' }}>
                          <h3 style={{ fontSize: '0.95rem', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Sparkles size={16} color="#eab308" /> Lançamentos Não Relacionados
                          </h3>
                          <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.75rem', fontWeight: '800', padding: '2px 8px', borderRadius: '12px' }}>
                            {globalUnmappedCosts.length} itens
                          </span>
                        </div>

                        {/* Scrollable unmapped list */}
                        <div style={{ 
                          flex: '1', 
                          overflowY: 'auto', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '12px',
                          paddingRight: '4px' 
                        }}>
                          {globalUnmappedCosts.map(tx => (
                            <div key={tx.id} style={{ 
                              background: '#f8fafc', 
                              border: '1.5px solid #e2e8f0', 
                              borderRadius: '12px', 
                              padding: '12px 14px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              transition: 'all 0.2s',
                              position: 'relative'
                            }}>
                              <button 
                                onClick={() => handleRemoveFromClinicCosts(tx.id)} 
                                style={{ position: 'absolute', top: '12px', right: '14px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                <Trash2 size={14} />
                              </button>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingRight: '20px' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#64748b' }}>{tx.date.split('-').reverse().slice(0,2).join('/')}</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: '950', color: '#b91c1c', whiteSpace: 'nowrap' }}>
                                  R$ {Math.abs(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                              <input 
                                type="text"
                                defaultValue={tx.description.replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '')}
                                onBlur={(e) => handleUpdateTransactionField(tx.id, 'description', e.target.value)}
                                style={{ fontSize: '0.8rem', fontWeight: '750', color: '#1e293b', background: 'transparent', border: 'none', outline: 'none', padding: 0, width: '100%', marginTop: '2px' }}
                              />
                              <select
                                value={tx.favorecido || ''}
                                onChange={(e) => handleUpdateTransactionField(tx.id, 'favorecido', e.target.value)}
                                style={{ border: 'none', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', padding: '2px 6px', fontSize: '0.65rem', fontWeight: '800', outline: 'none', color: tx.favorecido ? (favColors[tx.favorecido]?.text || '#334155') : '#334155', cursor: 'pointer', width: 'fit-content', marginTop: '6px' }}
                              >
                                <option value="">-- Pago por --</option>
                                {allowedFavorecidos.map(f => <option key={f} value={f}>{f}</option>)}
                              </select>
                            </div>
                          ))}

                          {globalUnmappedCosts.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '40px 16px', color: '#94a3b8' }}>
                              <CheckCircle2 color="#10b981" size={32} style={{ margin: '0 auto 12px' }} />
                              <p style={{ fontSize: '0.8rem', fontWeight: '800' }}>Tudo classificado!</p>
                              <p style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '2px' }}>Todas as despesas extras foram associadas ou não existem.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Bottom summary and extra fields */}
            {/* Bottom summary and extra fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '25px' }}>
              
              {/* CPFL card */}
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1e293b', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>CPFL por Sala</h3>
                {renderExtraField("Sala 01", "CPFL Sala 01", "CPFL_SALA")}
                {renderExtraField("Sala 02 (Pilates)", "CPFL Sala 02", "CPFL_SALA")}
                {renderExtraField("Sala 03", "CPFL Sala 03", "CPFL_SALA")}
                {renderExtraField("Sala 04", "CPFL Sala 04", "CPFL_SALA")}
                {renderExtraField("Sala 05", "CPFL Sala 05", "CPFL_SALA")}
                {renderExtraField("Sala 06", "CPFL Sala 06", "CPFL_SALA")}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '0.8rem', borderTop: '1px dashed #cbd5e1', paddingTop: '8px', marginTop: '12px', color: '#1e293b' }}>
                  <span>Total CPFL:</span>
                  <span style={{ whiteSpace: 'nowrap' }}>R$ {(cpflSum + cpflSala02).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Ganhos card */}
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1e293b', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Ganhos Fisioterapia</h3>
                {renderExtraField("Julia", "Julia", "PRO_EARNING")}
                {renderExtraField("Gambá", "Gambá", "PRO_EARNING")}
                {renderExtraField("Newton", "Newton", "PRO_EARNING")}
                {renderExtraField("Cris", "Cris", "PRO_EARNING")}
                {renderExtraField("João", "João", "PRO_EARNING")}
                {renderExtraField("Ausência Nula", "Ausência Nula", "PRO_EARNING")}
              </div>

              {/* Parâmetros do Pilates card */}
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1e293b', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Parâmetros do Pilates</h3>
                {renderExtraField("Julia (Pilates)", "Julia (Pilates)", "PRO_EARNING")}
                {renderExtraField("Paula (Pilates)", "Paula (Pilates)", "PRO_EARNING")}
                {renderExtraField("Ausência Nula (P)", "Ausência Nula (Pilates)", "PRO_EARNING")}
                {renderExtraField("Imposto (Pilates)", "Imposto (Pilates)", "PRO_EARNING")}
              </div>

              {/* Ajustes card */}
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1e293b', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Ajustes Sócios & Fundo</h3>
                {renderExtraField("Daniel Adic.", "Daniel Adicional", "PARTNER_ADJ")}
                {renderExtraField("Stuart Adic.", "Stuart Adicional", "PARTNER_ADJ")}
                {renderExtraField("Paula Adic.", "Paula Adicional", "PARTNER_ADJ")}
                <div style={{ marginTop: '20px', borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
                  {renderExtraField("Aporte Fundo Kinesis", "Aporte Fundo Kinesis", "PARTNER_ADJ")}
                </div>
              </div>

            </div>

            {/* Resumo da Partilha e Rateio Final (Full Width Side-by-Side Breakdown) */}
            <div className="card" style={{ 
              padding: '24px', 
              background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)', 
              borderLeft: '5px solid var(--primary)',
              marginBottom: '30px'
            }}>
              <h3 style={{ 
                fontSize: '1.1rem', 
                fontWeight: '900', 
                color: 'var(--primary)', 
                marginBottom: '20px', 
                borderBottom: '1px solid var(--border-color)', 
                paddingBottom: '12px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Split size={20} />
                  <span>Resumo da Partilha e Rateio Final</span>
                </div>
                <button 
                  onClick={handleSyncSpreadsheet}
                  disabled={syncing}
                  title="Sincronizar com planilhas Excel"
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--primary)', outline: 'none' }}
                >
                  <RefreshCw className={syncing ? "animate-spin" : ""} size={16} />
                </button>
              </h3>

              {/* Side-by-side Columns */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '24px', 
                marginBottom: '24px'
              }}>
                
                {/* Fisioterapia Section */}
                <div style={{ 
                  backgroundColor: '#ffffff', 
                  padding: '20px', 
                  borderRadius: '12px', 
                  border: '1.5px solid #cbd5e1',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a', marginBottom: '12px', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '6px' }}>
                    Divisão Fisioterapia (40/40/20)
                  </h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem', fontWeight: '600', color: '#475569' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Gerais (83%):</span>
                      <span style={{ whiteSpace: 'nowrap' }}>R$ {(totalGeral * 0.83).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Secretária (66.6%):</span>
                      <span style={{ whiteSpace: 'nowrap' }}>R$ {(totalSecretaria * 0.666).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Kinesis (50%):</span>
                      <span style={{ whiteSpace: 'nowrap' }}>R$ {(totalKinesis * 0.5).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>CPFL Salas (1,3,4,5,6):</span>
                      <span style={{ whiteSpace: 'nowrap' }}>R$ {cpflSum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Fundo Kinesis:</span>
                      <span style={{ whiteSpace: 'nowrap' }}>R$ {fundoVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '6px', fontWeight: '800', color: '#0f172a' }}>
                      <span>Custos Compartilhados:</span>
                      <span style={{ color: '#b91c1c', whiteSpace: 'nowrap' }}>- R$ {totalShared.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', color: '#0f172a' }}>
                      <span>Faturamento Arrecadado:</span>
                      <span style={{ color: '#15803d', whiteSpace: 'nowrap' }}>+ R$ {totalArrecadado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px double #cbd5e1', paddingTop: '6px', fontWeight: '900', color: '#0f172a', fontSize: '0.8rem' }}>
                      <span>LUCRO LÍQUIDO FISIOTERAPIA:</span>
                      <span style={{ color: saldoFinal >= 0 ? '#15803d' : '#b91c1c', whiteSpace: 'nowrap' }}>
                        R$ {saldoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pilates Section */}
                <div style={{ 
                  backgroundColor: '#ffffff', 
                  padding: '20px', 
                  borderRadius: '12px', 
                  border: '1.5px solid #cbd5e1',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a', marginBottom: '12px', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '6px' }}>
                    Divisão Pilates (1/3 cada)
                  </h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem', fontWeight: '600', color: '#475569' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Gerais (17%):</span>
                      <span style={{ whiteSpace: 'nowrap' }}>R$ {(totalGeral * 0.17).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Secretária (33.3%):</span>
                      <span style={{ whiteSpace: 'nowrap' }}>R$ {(totalSecretaria * 0.333).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Kinesis (50%):</span>
                      <span style={{ whiteSpace: 'nowrap' }}>R$ {(totalKinesis * 0.5).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>CPFL Sala 02:</span>
                      <span style={{ whiteSpace: 'nowrap' }}>R$ {cpflSala02.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '6px', fontWeight: '800', color: '#0f172a' }}>
                      <span>Custos Operacionais:</span>
                      <span style={{ color: '#b91c1c', whiteSpace: 'nowrap' }}>- R$ {custosPilates.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', color: '#0f172a' }}>
                      <span>Repasses Profissionais (Julia + Paula):</span>
                      <span style={{ color: '#b91c1c', whiteSpace: 'nowrap' }}>- R$ {(juliaPilates + paulaPilates).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', color: '#0f172a' }}>
                      <span>Imposto Pilates:</span>
                      <span style={{ color: '#b91c1c', whiteSpace: 'nowrap' }}>- R$ {impostoPilates.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', color: '#0f172a' }}>
                      <span>Faturamento Pilates Arrecadado:</span>
                      <span style={{ color: '#15803d', whiteSpace: 'nowrap' }}>+ R$ {arrecadadoPilates.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px double #cbd5e1', paddingTop: '6px', fontWeight: '900', color: '#0f172a', fontSize: '0.8rem' }}>
                      <span>LUCRO LÍQUIDO PILATES:</span>
                      <span style={{ color: saldoFinalPilates >= 0 ? '#15803d' : '#b91c1c', whiteSpace: 'nowrap' }}>
                        R$ {saldoFinalPilates.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Socio Distribution Block */}
              <div style={{ 
                backgroundColor: '#ffffff', 
                padding: '20px 24px', 
                borderRadius: '12px', 
                border: '1.5px solid #bfdbfe' 
              }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '900', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} color="var(--primary)" />
                  <span>Distribuição Consolidada de Sócios</span>
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                  
                  <div style={{ borderLeft: '4px solid #16a34a', paddingLeft: '14px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Daniel</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: '950', color: danielShare >= 0 ? '#166534' : '#991b1b', marginTop: '4px', whiteSpace: 'nowrap' }}>
                      R$ {danielShare.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '2px' }}>
                      Fisio (40%): R$ {(saldoFinal * 0.4).toFixed(2)} + Pilates (1/3): R$ {(saldoFinalPilates / 3).toFixed(2)} - Cris: R$ {crisEarning.toFixed(2)} {danielAdj !== 0 && `+ Adj: R$ ${danielAdj.toFixed(2)}`} {danielPaid > 0 && `+ Reembolso: R$ ${danielPaid.toFixed(2)}`}
                    </div>
                  </div>

                  <div style={{ borderLeft: '4px solid #3b82f6', paddingLeft: '14px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Stuart</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: '950', color: stuartShare >= 0 ? '#1d4ed8' : '#991b1b', marginTop: '4px', whiteSpace: 'nowrap' }}>
                      R$ {stuartShare.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '2px' }}>
                      Fisio (40%): R$ {(saldoFinal * 0.4).toFixed(2)} + Pilates (1/3): R$ {(saldoFinalPilates / 3).toFixed(2)} {stuartAdj !== 0 && `+ Adj: R$ ${stuartAdj.toFixed(2)}`} {stuartPaid > 0 && `+ Reembolso: R$ ${stuartPaid.toFixed(2)}`}
                    </div>
                  </div>

                  <div style={{ borderLeft: '4px solid #ec4899', paddingLeft: '14px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Paula</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: '950', color: paulaShare >= 0 ? '#be185d' : '#991b1b', marginTop: '4px', whiteSpace: 'nowrap' }}>
                      R$ {paulaShare.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '2px' }}>
                      Fisio (20%): R$ {(saldoFinal * 0.2).toFixed(2)} + Pilates (1/3): R$ {(saldoFinalPilates / 3).toFixed(2)} {paulaAdj !== 0 && `+ Adj: R$ ${paulaAdj.toFixed(2)}`} {paulaPaid > 0 && `+ Reembolso: R$ ${paulaPaid.toFixed(2)}`}
                    </div>
                  </div>

                </div>

                <button 
                  onClick={handleSyncSpreadsheet}
                  disabled={syncing}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '20px', fontSize: '0.85rem', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
                >
                  {syncing ? <Loader2 className="animate-spin" size={16} /> : <FileSpreadsheet size={16} />}
                  Sincronizar Planilha
                </button>
              </div>
            </div>

          </div>
        );
      })()}

      {/* Modal de Lançamento Manual */}
      {showManualModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            width: '100%',
            maxWidth: '520px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowManualModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                padding: '4px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X size={18} />
            </button>

            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={20} color="var(--primary)" /> Novo Lançamento Manual
            </h3>

            <form onSubmit={handleSaveManualTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Data *</label>
                  <input 
                    type="date" 
                    value={manualDate} 
                    onChange={(e) => setManualDate(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: '600', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Tipo *</label>
                  <select 
                    value={manualType} 
                    onChange={(e) => {
                      setManualType(e.target.value);
                      setManualCategory(e.target.value === "INCOME" ? "Recebimento" : "Despesa");
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: '800', outline: 'none', background: 'white' }}
                  >
                    <option value="INCOME">Entrada (Crédito)</option>
                    <option value="EXPENSE">Saída (Débito)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Descrição / Cliente *</label>
                <input 
                  type="text" 
                  placeholder="Nome do cliente ou finalidade do lançamento"
                  value={manualDescription} 
                  onChange={(e) => setManualDescription(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: '600', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Valor (R$) *</label>
                  <input 
                    type="text" 
                    placeholder="0,00"
                    value={manualAmount} 
                    onChange={(e) => setManualAmount(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: '800', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Responsável (Favorecido)</label>
                  <select 
                    value={manualFavorecido} 
                    onChange={(e) => setManualFavorecido(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: '800', outline: 'none', background: 'white' }}
                  >
                    <option value="">-- Sem Favorecido --</option>
                    {allowedFavorecidos.map(fav => (
                      <option key={fav} value={fav}>{fav}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Categoria</label>
                  <input 
                    type="text" 
                    value={manualCategory} 
                    onChange={(e) => setManualCategory(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: '600', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Banco</label>
                  <input 
                    type="text" 
                    value={manualBank} 
                    onChange={(e) => setManualBank(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: '600', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowManualModal(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: 'white',
                    color: '#475569',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--primary)',
                    color: 'white',
                    fontSize: '0.85rem',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                >
                  Gravar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
