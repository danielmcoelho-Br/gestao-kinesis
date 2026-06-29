"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { usePeriod } from "@/gestao/context/PeriodContext";
import { CreditCard, TrendingUp, TrendingDown, DollarSign, Loader2, FileSpreadsheet, Split, Plus, X, Trash2, RefreshCw, Undo2, Redo2, Unlink, FileText, Sparkles, CheckCircle2, Eye, EyeOff, RotateCcw, Wallet, PieChart, ChevronDown, ChevronUp, MessageSquare, Send, Lock, Unlock } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useFinancePrivacy } from "@/gestao/components/DashboardComponents";
import * as XLSX from "xlsx";
import { EXCEL_ITEMS, runFinancialCalculations, ExcelItem } from "@/lib/finance/calculations";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

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

export default function FinanceiroPageContent() {
  const { startMonth, startYear, endMonth, endYear, initialized } = usePeriod();
  const hideFinance = useFinancePrivacy();
  const togglePrivacy = () => {
    const newVal = !hideFinance;
    localStorage.setItem("kinesis-finance-privacy", String(newVal));
    window.dispatchEvent(new Event("kinesis-finance-privacy-change"));
  };
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'description' | 'favorecido' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [activeTab, setActiveTab] = useState<'fluxo_bb' | 'fluxo_inter' | 'custos' | 'historico_mom'>('fluxo_bb');
  const [syncing, setSyncing] = useState(false);
  const [prevTransactions, setPrevTransactions] = useState<any[]>([]);
  const [prevLoading, setPrevLoading] = useState(true);

  useEffect(() => {
    if (!initialized) return;
    const prevMonth = startMonth === 0 ? 11 : startMonth - 1;
    const prevYear = startMonth === 0 ? startYear - 1 : startYear;
    
    setPrevLoading(true);
    fetch(`/api/financeiro?startMonth=${prevMonth}&startYear=${prevYear}&endMonth=${prevMonth}&endYear=${prevYear}&_t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        const uniqueData = Array.isArray(data) 
          ? Array.from(new Map(data.map((t: any) => [t.id, t])).values()) 
          : [];
        setPrevTransactions(uniqueData);
        setPrevLoading(false);
      })
      .catch(() => {
        setPrevTransactions([]);
        setPrevLoading(false);
      });
  }, [startMonth, startYear, initialized]);

  
  // History State for Undo/Redo
  const [historyStack, setHistoryStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);
  const historyStackRef = useRef<any[]>([]);
  const redoStackRef = useRef<any[]>([]);

  // Search Filter state for Description column
  const [descriptionFilter, setDescriptionFilter] = useState("");

  // Custom block lines for mapping
  const [customBlockLines, setCustomBlockLines] = useState<{ id: string, block: string, label: string }[]>([]);

  // Collapsible Cost Tables State
  const [collapsedBlocks, setCollapsedBlocks] = useState<Record<string, boolean>>({
    geral: true,
    secretaria: true,
    kinesis: true,
    cpfl: true,
    exclusivo: true,
  });

  // AI Consultant States
  const [showAIConsultant, setShowAIConsultant] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; parts: { text: string }[] }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [customRules, setCustomRules] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Month Lock States
  const [monthLocked, setMonthLocked] = useState(false);
  const [lockLoading, setLockLoading] = useState(false);

  // AI Categorization States
  const [aiRecommending, setAiRecommending] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, { favorecido: string, categoria: string, justificativa: string }>>({});

  // MoM History States
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Export dropdown state
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Manual Transaction Modal State
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [manualDescription, setManualDescription] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualType, setManualType] = useState("INCOME");
  const [manualFavorecido, setManualFavorecido] = useState("");
  const [manualCategory, setManualCategory] = useState("Recebimento");
  const [manualBank, setManualBank] = useState("Banco do Brasil");

  const allMappedTransactions = useMemo(() => {
    return transactions.map((t: any) => ({
      ...t,
      description: t.clinicDesc ?? t.description,
      amount: t.clinicAmount ?? t.amount,
      category: t.clinicCat ?? t.category,
      favorecido: t.clinicFavorecido || t.favorecido
    }));
  }, [transactions]);

  const activeTransactions = activeTab === 'custos'
    ? allMappedTransactions
    : transactions.filter((t: any) => {
        if (t.bank === 'MANUAL_CLINICA' || t.category === 'PRO_EARNING' || t.bank === 'HIDDEN_ITEM') return false;
        
        const bankName = (t.bank || 'Banco do Brasil').toLowerCase();
        if (activeTab === 'fluxo_bb' && bankName !== 'banco do brasil') return false;
        if (activeTab === 'fluxo_inter' && bankName !== 'banco inter') return false;
        return true;
      });

  const loadTransactions = (showLoading = false) => {
    if (!initialized) return;
    if (showLoading && transactions.length === 0) setLoading(true);
    fetch(`/api/financeiro?startMonth=${startMonth}&startYear=${startYear}&endMonth=${endMonth}&endYear=${endYear}&_t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        const uniqueData = Array.isArray(data) 
          ? Array.from(new Map(data.map((t: any) => [t.id, t])).values()) 
          : [];
        setTransactions(uniqueData);
        if (showLoading) setLoading(false);
      })
      .catch(() => {
        setTransactions([]);
        if (showLoading) setLoading(false);
      });
  };

  const checkLockStatus = async () => {
    if (!initialized) return;
    try {
      const res = await fetch(`/api/financeiro/lock?month=${startMonth}&year=${startYear}`);
      const data = await res.json();
      if (res.ok) {
        setMonthLocked(data.locked);
      }
    } catch (e) {
      console.error("Error checking lock status:", e);
    }
  };

  useEffect(() => {
    loadTransactions(true);
    checkLockStatus();
  }, [startMonth, startYear, endMonth, endYear, initialized]);

  useEffect(() => {
    if (activeTab === 'historico_mom' && initialized) {
      setHistoryLoading(true);
      fetch(`/api/financeiro/historico?year=${startYear}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.history) {
            setHistoryData(data.history);
          }
          setHistoryLoading(false);
        })
        .catch(err => {
          console.error("Error fetching history:", err);
          toast.error("Erro ao carregar dados do histórico.");
          setHistoryLoading(false);
        });
    }
  }, [activeTab, startYear, initialized]);

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

  const handleToggleLock = async () => {
    setLockLoading(true);
    const newLockState = !monthLocked;
    try {
      const res = await fetch('/api/financeiro/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: startMonth,
          year: startYear,
          locked: newLockState
        })
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Erro ao alterar trava do período.');
      }
      setMonthLocked(newLockState);
      if (newLockState) {
        toast.success(`Mês bloqueado! E-mail de fechamento enviado aos sócios (Modo: ${data.emailStatus?.mode || 'normal'}).`);
      } else {
        toast.success('Período desbloqueado para edições.');
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLockLoading(false);
    }
  };

  const handleAISuggestions = async (globalUnmappedCosts: any[]) => {
    if (globalUnmappedCosts.length === 0) {
      toast.info('Não há lançamentos não relacionados para analisar.');
      return;
    }

    setAiRecommending(true);
    try {
      const res = await fetch('/api/financeiro/recomendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: globalUnmappedCosts })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na recomendação por IA.');
      
      const recs = data.recommendations;
      const sugMap: any = {};
      recs.forEach((r: any) => {
        sugMap[r.id] = {
          favorecido: r.favorecido,
          categoria: r.categoria,
          justificativa: r.justificativa
        };
      });
      setAiSuggestions(sugMap);
      toast.success('Sugestões de classificação da IA geradas com sucesso!');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAiRecommending(false);
    }
  };

  const handleAcceptAISuggestion = async (txId: string) => {
    const sug = aiSuggestions[txId];
    if (!sug) return;
    
    try {
      const tx = transactions.find(t => t.id === txId);
      if (!tx) return;
      
      const payload = {
        transactionId: txId,
        favorecido: sug.favorecido,
        category: sug.categoria,
        isClinicEdit: true
      };
      
      const res = await fetch('/api/financeiro/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao aplicar sugestão.');
      
      toast.success('Sugestão aplicada com sucesso!');
      
      // Update local state
      setTransactions(prev => prev.map(t => t.id === txId ? data.transaction : t));
      
      // Remove from suggestions
      setAiSuggestions(prev => {
        const copy = { ...prev };
        delete copy[txId];
        return copy;
      });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleRejectAISuggestion = (txId: string) => {
    setAiSuggestions(prev => {
      const copy = { ...prev };
      delete copy[txId];
      return copy;
    });
  };

  const handleDeleteTransaction = async (id: string) => {
    if (monthLocked) {
      toast.error("Este período está bloqueado para edições.");
      return;
    }
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
        body: JSON.stringify({ transactionId: id, resetClinic: true, isClinicEdit: true })
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

  const handleHideFromClinicCosts = async (id: string) => {
    if (monthLocked) {
      toast.error("Este período está bloqueado para edições.");
      return;
    }
    if (!confirm("Deseja realmente ignorar este lançamento nos Custos da Clínica? Ele continuará registrado no Fluxo de Caixa.")) return;
    const toastId = toast.loading("Ocultando despesa dos custos...");
    try {
      const res = await fetch('/api/financeiro/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: id, category: 'OUTROS', isClinicEdit: true })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao ocultar.");
      
      toast.success("Ocultado com sucesso!", { id: toastId });
      loadTransactions();
    } catch (err: any) {
      toast.error(err.message || "Erro ao ocultar despesa.", { id: toastId });
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

  const handleHideExcelItem = async (itemKey: string) => {
    if (monthLocked) {
      toast.error("Este período está bloqueado para edições.");
      return;
    }
    const toastId = toast.loading("Ocultando item...");
    try {
      const targetDate = new Date(startYear, startMonth, 1).toISOString().split('T')[0];
      const res = await fetch('/api/financeiro/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: targetDate,
          description: itemKey,
          amount: 0.01,
          type: 'EXPENSE',
          category: 'HIDDEN',
          bank: 'HIDDEN_ITEM',
          favorecido: ''
        })
      });
      if (!res.ok) throw new Error();
      toast.success("Item ocultado para este mês.", { id: toastId });
      loadTransactions();
    } catch {
      toast.error("Erro ao ocultar.", { id: toastId });
    }
  };

  const handleRestoreExcelItem = async (transactionId: string | undefined) => {
    if (!transactionId) return;
    const toastId = toast.loading("Restaurando...");
    try {
      const res = await fetch('/api/financeiro/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId })
      });
      if (!res.ok) throw new Error();
      toast.success("Restaurado com sucesso.", { id: toastId });
      loadTransactions();
    } catch {
      toast.error("Erro ao restaurar.", { id: toastId });
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
    if (monthLocked) {
      toast.error("Este período está bloqueado para edições.");
      return;
    }
    clientLog("handleUpdateTransactionField called: " + id + ", field: " + field + ", val: " + value);
    const target = activeTransactions.find(t => t.id === id);
    if (!target) return;
    
    // Parse value for type safety and format checks
    let parsedValue: any = value;
    if (field === 'amount') {
      parsedValue = Number(Math.abs(parseFloat(value as string) || 0).toFixed(2));
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

  const handleCreateSidebarManualEntry = async () => {
    if (monthLocked) {
      toast.error("Este período está bloqueado para edições.");
      return;
    }
    const toastId = toast.loading("Adicionando novo lançamento...");
    try {
      const targetDate = new Date(startYear, startMonth, 1).toISOString().split('T')[0];
      const res = await fetch('/api/financeiro/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: targetDate,
          description: "Novo Gasto Manual",
          amount: 0.01,
          type: 'EXPENSE',
          category: 'GERAL',
          bank: 'MANUAL_CLINICA',
          favorecido: ''
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar.");
      
      toast.success("Adicionado! Edite os valores na lista.", { id: toastId });
      loadTransactions();
    } catch (err: any) {
      toast.error(err.message || "Erro ao adicionar lançamento.", { id: toastId });
    }
  };

  const handleAddCustomLine = (blockName: string) => {
    setCustomBlockLines(prev => [
      ...prev,
      { id: Date.now().toString(), block: blockName, label: "Nova Referência" }
    ]);
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
    if (monthLocked) {
      toast.error("Este período está bloqueado para alterações.");
      return;
    }
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
    if (monthLocked) {
      toast.error("Este período está bloqueado para edições.");
      return;
    }
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
    if (monthLocked) {
      toast.error("Este período está bloqueado para edições.");
      return;
    }
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
    // Excluir transações 'UNMAPPED' sob custos para evitar discrepâncias entre o saldo do período e os favorecidos
    if (activeTab === 'custos') {
      const cat = (t.clinicCat ?? t.category)?.toUpperCase();
      if (cat === 'UNMAPPED') return false;
    }
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

  const calc = useMemo(() => {
    return runFinancialCalculations(transactions, startMonth, startYear);
  }, [transactions, startMonth, startYear]);

  const prevCalc = useMemo(() => {
    if (prevTransactions.length === 0) return null;
    const prevMonth = startMonth === 0 ? 11 : startMonth - 1;
    const prevYear = startMonth === 0 ? startYear - 1 : startYear;
    return runFinancialCalculations(prevTransactions, prevMonth, prevYear);
  }, [prevTransactions, startMonth, startYear]);

  const {
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
  } = calc;

  const totalIncome = bankTransactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = bankTransactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const allowedFavorecidos = ["KINESIS", "PILATES", "FUNDO", "DANIEL", "STUART", "PAULA"];

  const favColors: Record<string, { border: string, bg: string, text: string }> = {
    KINESIS: { border: '#8b5cf6', bg: '#f5f3ff', text: '#6d28d9' },
    DANIEL: { border: '#10b981', bg: '#ecfdf5', text: '#047857' },
    STUART: { border: '#3b82f6', bg: '#eff6ff', text: '#1d4ed8' },
    PAULA: { border: '#ec4899', bg: '#fdf2f8', text: '#be185d' },
    PILATES: { border: '#06b6d4', bg: '#ecfeff', text: '#0891b2' },
    FUNDO: { border: '#f59e0b', bg: '#fffbeb', text: '#b45309' }
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows: any[][] = [];
    
    rows.push(["RELATÓRIO DE CUSTOS E PARTILHA DA CLÍNICA"]);
    rows.push([`${monthsPt[startMonth].toUpperCase()} DE ${startYear}`]);
    rows.push([]);

    const addBlock = (title: string, blockName: string, itemsList: ExcelItem[], total: number) => {
      rows.push([title.toUpperCase()]);
      rows.push(["Item", "Lançamento Vinculado", "Pago por", "Valor (R$)"]);

      const hiddenItemKeys = activeTransactions
        .filter(t => t.bank === 'HIDDEN_ITEM')
        .map(t => (t.description || '').replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '').trim());
      const visibleItems = itemsList.filter(i => !hiddenItemKeys.includes(i.key));

      visibleItems.forEach(item => {
        const tx = findMappedTransaction(item);
        rows.push([
          item.label,
          tx ? (tx.clinicDesc ?? (tx.description || '')).replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '') : '--',
          tx ? tx.favorecido || 'KINESIS' : '--',
          tx ? (tx.clinicAmount ?? tx.amount) : 0
        ]);
      });

      const blockCat = blockName === 'cpfl' ? null : blockName.toUpperCase();
      const extraItems = blockName === 'exclusivo'
        ? activeTransactions.filter(t =>
            t.type === 'EXPENSE' &&
            ['EXCLUSIVO_FISIO', 'EXCLUSIVO_PILATES'].includes(t.category?.toUpperCase() || '')
          )
        : (blockCat ? activeTransactions.filter(t =>
            t.type === 'EXPENSE' &&
            t.category?.toUpperCase() === blockCat &&
            !allMappedIds.includes(t.id)
          ) : []);

      extraItems.forEach(tx => {
        const catName = tx.category === 'EXCLUSIVO_FISIO' ? 'EXCLUSIVO FISIOTERAPIA' : tx.category === 'EXCLUSIVO_PILATES' ? 'EXCLUSIVO PILATES' : 'Despesa Extra';
        rows.push([
          (tx.clinicDesc ?? (tx.description || '')).replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, ''),
          catName,
          tx.favorecido || 'KINESIS',
          (tx.clinicAmount ?? tx.amount)
        ]);
      });

      rows.push([`TOTAL ${title.toUpperCase()}`, "", "", total]);
      rows.push([]);
    };

    addBlock("Gastos Gerais", "geral", EXCEL_ITEMS.filter(i => i.block === 'geral'), totalGeral);
    addBlock("Gastos Secretária", "secretaria", EXCEL_ITEMS.filter(i => i.block === 'secretaria'), totalSecretaria);
    addBlock("Gastos Kinesis", "kinesis", EXCEL_ITEMS.filter(i => i.block === 'kinesis'), totalKinesis);
    addBlock("CPFL por Sala", "cpfl", EXCEL_ITEMS.filter(i => i.block === 'cpfl'), cpflSum + cpflSala02);
    addBlock("Custos Exclusivos (100% Área)", "exclusivo", [], totalExclusivoFisio + totalExclusivoPilates);

    rows.push(["RESUMO DA PARTILHA E RATEIO FINAL"]);
    rows.push(["Fisioterapia - Lucro Líquido", "", "", saldoFinal]);
    rows.push(["Pilates - Lucro Líquido", "", "", saldoFinalPilates]);
    rows.push([]);

    rows.push(["DISTRIBUIÇÃO CONSOLIDADA DE SÓCIOS"]);
    rows.push(["Sócio", "Fisioterapia", "Pilates", "Reembolso", "Ajustes", "Participação Sócio"]);
    rows.push(["Daniel", saldoFinal * 0.4, saldoFinalPilates / 3, danielPaid, danielAdj - crisEarning, danielShare]);
    rows.push(["Stuart", saldoFinal * 0.4, saldoFinalPilates / 3, stuartPaid, stuartAdj, stuartShare]);
    rows.push(["Paula", saldoFinal * 0.2, saldoFinalPilates / 3, paulaPaid, paulaAdj, paulaShare]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Custos da Clínica");
    XLSX.writeFile(wb, `Fechamento_Clinica_${monthsPt[startMonth]}_${startYear}.xlsx`);
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    let tableSections = "";
    const renderPrintBlock = (title: string, blockName: string, total: number) => {
      const items = blockName === 'exclusivo' ? [] : EXCEL_ITEMS.filter(i => i.block === blockName);
      const hiddenItemKeys = activeTransactions
        .filter(t => t.bank === 'HIDDEN_ITEM')
        .map(t => (t.description || '').replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '').trim());
      const visibleItems = items.filter(i => !hiddenItemKeys.includes(i.key));
      
      const blockCat = blockName === 'cpfl' ? null : blockName.toUpperCase();
      const extraItems = blockName === 'exclusivo'
        ? activeTransactions.filter(t =>
            t.type === 'EXPENSE' &&
            ['EXCLUSIVO_FISIO', 'EXCLUSIVO_PILATES'].includes(t.category?.toUpperCase() || '')
          )
        : (blockCat ? activeTransactions.filter(t =>
            t.type === 'EXPENSE' &&
            t.category?.toUpperCase() === blockCat &&
            !allMappedIds.includes(t.id)
          ) : []);
          
      if (visibleItems.length === 0 && extraItems.length === 0) return '';
      
      let tableRows = '';
      visibleItems.forEach(item => {
        const tx = findMappedTransaction(item);
        tableRows += `
          <tr>
            <td>${item.label}</td>
            <td>${tx ? (tx.clinicDesc ?? (tx.description || '')).replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '') : '--'}</td>
            <td>${tx ? tx.favorecido || 'KINESIS' : '--'}</td>
            <td class="text-right">R$ ${(tx ? (tx.clinicAmount ?? tx.amount) : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        `;
      });
      
      extraItems.forEach(tx => {
        const isExclusivo = blockName === 'exclusivo';
        const areaLabel = isExclusivo
          ? (tx.category === 'EXCLUSIVO_FISIO' ? ' <span class="badge badge-fisio">FISIOTERAPIA</span>' : ' <span class="badge badge-pilates">PILATES</span>')
          : '';
        tableRows += `
          <tr>
            <td>${(tx.clinicDesc ?? (tx.description || '')).replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '')}${areaLabel}</td>
            <td>Despesa Extra</td>
            <td>${tx.favorecido || 'KINESIS'}</td>
            <td class="text-right">R$ ${(tx.clinicAmount ?? tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        `;
      });
      
      return `
        <h3>${title} (Total: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</h3>
        <table>
          <thead>
            <tr><th>Item</th><th>Lançamento</th><th>Pago por</th><th class="text-right">Valor</th></tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      `;
    };

    tableSections += renderPrintBlock("Gastos Gerais", "geral", totalGeral);
    tableSections += renderPrintBlock("Gastos Secretária", "secretaria", totalSecretaria);
    tableSections += renderPrintBlock("Gastos Kinesis", "kinesis", totalKinesis);
    tableSections += renderPrintBlock("CPFL por Sala", "cpfl", cpflSum + cpflSala02);
    tableSections += renderPrintBlock("Custos Exclusivos (100% Área)", "exclusivo", totalExclusivoFisio + totalExclusivoPilates);

    printWindow.document.write(`
      <html>
        <head>
          <title>Fechamento Financeiro - Kinesis - ${monthsPt[startMonth]} ${startYear}</title>
          <style>
            body { font-family: sans-serif; color: #1e293b; padding: 40px; margin: 0; line-height: 1.5; }
            h1 { font-size: 22px; font-weight: 800; color: #0f172a; border-bottom: 2px solid #6366f1; padding-bottom: 10px; margin-bottom: 20px; }
            h2 { font-size: 16px; font-weight: 700; color: #1e293b; margin-top: 30px; margin-bottom: 10px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
            h3 { font-size: 13px; font-weight: 700; color: #475569; margin-top: 20px; margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background-color: #f8fafc; font-weight: 800; text-transform: uppercase; font-size: 9px; padding: 10px 12px; text-align: left; border-bottom: 2px solid #cbd5e1; color: #475569; }
            td { font-size: 11px; padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
            .total-row { font-weight: 900; background-color: #f8fafc; border-top: 1.5px solid #cbd5e1; border-bottom: 1.5px solid #cbd5e1; }
            .text-right { text-align: right; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 8px; font-weight: 800; }
            .badge-fisio { background-color: #dbeafe; color: #1e40af; }
            .badge-pilates { background-color: #ecfdf5; color: #065f46; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; background-color: #ffffff; margin-bottom: 20px; }
            .socio-block { border-left: 4px solid #6366f1; padding-left: 14px; margin-bottom: 10px; font-size: 11px; }
            @media print {
              body { padding: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Fechamento Financeiro Clínico - Kinesis (${monthsPt[startMonth]}/${startYear})</h1>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 20px;">Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</div>
          
          <h2>Resumo da Partilha e Rateio Final</h2>
          <div class="grid-2">
            <div class="card">
              <h3>Fisioterapia</h3>
              <table>
                <tr><td>Custos Compartilhados:</td><td class="text-right">- R$ ${totalShared.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>
                <tr><td>Custos Exclusivos:</td><td class="text-right">- R$ ${totalExclusivoFisio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>
                <tr><td>Faturamento Arrecadado:</td><td class="text-right">+ R$ ${totalArrecadado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>
                <tr class="total-row"><td>LUCRO LÍQUIDO FISIOTERAPIA:</td><td class="text-right">R$ ${saldoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>
              </table>
            </div>
            <div class="card">
              <h3>Pilates</h3>
              <table>
                <tr><td>Custos Operacionais:</td><td class="text-right">- R$ ${custosPilates.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>
                <tr><td>Custos Exclusivos:</td><td class="text-right">- R$ ${totalExclusivoPilates.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>
                <tr><td>Lucro Bruto:</td><td class="text-right">+ R$ ${(juliaPilates + ausenciaPilates).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>
                <tr><td>Imposto Pilates:</td><td class="text-right">- R$ ${impostoPilates.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>
                <tr class="total-row"><td>LUCRO LÍQUIDO PILATES:</td><td class="text-right">R$ ${saldoFinalPilates.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>
              </table>
            </div>
          </div>
          
          <h2>Distribuição Consolidada de Sócios</h2>
          <div class="grid-2" style="grid-template-columns: repeat(3, 1fr);">
            <div class="socio-block" style="border-left-color: #16a34a;">
              <strong>Daniel</strong>
              <div>Participação Fisioterapia (40%): R$ ${(saldoFinal * 0.4).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div>Participação Pilates (33%): R$ ${(saldoFinalPilates / 3).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div>Reembolsos Pagos: R$ ${danielPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div>Ajustes/Cris: R$ ${(danielAdj - crisEarning).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div style="font-weight: 800; margin-top: 4px;">PARTICIPAÇÃO SÓCIO: R$ ${danielShare.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div class="socio-block" style="border-left-color: #3b82f6;">
              <strong>Stuart</strong>
              <div>Participação Fisioterapia (40%): R$ ${(saldoFinal * 0.4).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div>Participação Pilates (33%): R$ ${(saldoFinalPilates / 3).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div>Reembolsos Pagos: R$ ${stuartPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div>Ajustes: R$ ${stuartAdj.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div style="font-weight: 800; margin-top: 4px;">PARTICIPAÇÃO SÓCIO: R$ ${stuartShare.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div class="socio-block" style="border-left-color: #ec4899;">
              <strong>Paula</strong>
              <div>Participação Fisioterapia (20%): R$ ${(saldoFinal * 0.2).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div>Participação Pilates (33%): R$ ${(saldoFinalPilates / 3).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div>Reembolsos Pagos: R$ ${paulaPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div>Ajustes: R$ ${paulaAdj.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div style="font-weight: 800; margin-top: 4px;">PARTICIPAÇÃO SÓCIO: R$ ${paulaShare.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>
          
          <h2>Detalhamento dos Custos</h2>
          ${tableSections}
          
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || aiLoading) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    
    const newMessages = [...chatMessages, { role: 'user' as const, parts: [{ text: userMsg }] }];
    setChatMessages(newMessages);
    setAiLoading(true);

    try {
      const financialContext = {
        mesAno: `${monthsPt[startMonth]} ${startYear}`,
        totalGeral,
        totalSecretaria,
        totalKinesis,
        cpflSum,
        cpflSala02,
        totalShared,
        totalExclusivoFisio,
        totalExclusivoPilates,
        totalArrecadadoFisio: totalArrecadado,
        saldoFinalFisio: saldoFinal,
        arrecadadoPilates,
        custosPilates,
        saldoFinalPilates,
        danielShare,
        stuartShare,
        paulaShare,
        fundoVal
      };

      const res = await fetch('/api/financeiro/consultor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          financialContext,
          customRules
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao consultar assistente.");

      setChatMessages(prev => [...prev, { role: 'model' as const, parts: [{ text: data.text }] }]);
    } catch (err: any) {
      toast.error(err.message || "Erro de conexão com o assistente.");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    const savedRules = localStorage.getItem("kinesis_finance_custom_rules");
    if (savedRules) setCustomRules(savedRules);
  }, []);

  useEffect(() => {
    localStorage.setItem("kinesis_finance_custom_rules", customRules);
  }, [customRules]);

  useEffect(() => {
    if (showAIConsultant && chatMessages.length === 0) {
      setChatMessages([
        {
          role: 'model',
          parts: [{ text: `Olá Daniel, Stuart e Paula! Sou o seu Consultor Financeiro IA. Estou pronto para ajudar a analisar os dados de **${monthsPt[startMonth]} de ${startYear}**. Como posso ajudar você hoje?` }]
        }
      ]);
    }
  }, [showAIConsultant, startMonth, startYear, chatMessages.length]);

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

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={togglePrivacy} 
            className="btn" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              background: 'white', 
              color: 'var(--text-secondary)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '8px', 
              padding: '8px',
              cursor: 'pointer'
            }}
            title={hideFinance ? "Mostrar dados financeiros" : "Ocultar dados financeiros"}
          >
            {hideFinance ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button
            onClick={handleToggleLock}
            disabled={lockLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: '900',
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: 'none',
              background: monthLocked ? '#fee2e2' : '#ecfdf5',
              color: monthLocked ? '#ef4444' : '#10b981',
              boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
            }}
          >
            {lockLoading ? <Loader2 className="animate-spin" size={16} /> : monthLocked ? <Lock size={16} /> : <Unlock size={16} />}
            {monthLocked ? 'Bloqueado' : 'Aberto'}
          </button>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: '800',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f1f5f9';
                e.currentTarget.style.borderColor = '#94a3b8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
            >
              <FileSpreadsheet size={16} />
              Exportar
              <ChevronDown size={14} />
            </button>
            {showExportDropdown && (
              <>
                <div 
                  onClick={() => setShowExportDropdown(false)} 
                  style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} 
                />
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 5px)',
                  right: 0,
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  zIndex: 1000,
                  minWidth: '160px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '4px 0'
                }}>
                  <button
                    onClick={() => {
                      setShowExportDropdown(false);
                      handleExportExcel();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      border: 'none',
                      background: 'transparent',
                      color: '#1e293b',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <FileSpreadsheet size={14} color="#10b981" />
                    Planilha Excel
                  </button>
                  <button
                    onClick={() => {
                      setShowExportDropdown(false);
                      handleExportPDF();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      border: 'none',
                      background: 'transparent',
                      color: '#1e293b',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <FileText size={14} color="#ef4444" />
                    Relatório PDF
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleUndo}
            disabled={monthLocked}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: '800',
              fontSize: '0.85rem',
              cursor: (historyStack.length === 0 || monthLocked) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              border: '1px solid #cbd5e1',
              background: (historyStack.length === 0 || monthLocked) ? '#f8fafc' : '#ffffff',
              color: (historyStack.length === 0 || monthLocked) ? '#94a3b8' : '#334155',
              boxShadow: (historyStack.length === 0 || monthLocked) ? 'none' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              opacity: (historyStack.length === 0 || monthLocked) ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (historyStack.length > 0 && !monthLocked) {
                e.currentTarget.style.background = '#f1f5f9';
                e.currentTarget.style.borderColor = '#94a3b8';
              }
            }}
            onMouseLeave={(e) => {
              if (historyStack.length > 0 && !monthLocked) {
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
            disabled={monthLocked}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: '800',
              fontSize: '0.85rem',
              cursor: (redoStack.length === 0 || monthLocked) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              border: '1px solid #cbd5e1',
              background: (redoStack.length === 0 || monthLocked) ? '#f8fafc' : '#ffffff',
              color: (redoStack.length === 0 || monthLocked) ? '#94a3b8' : '#334155',
              boxShadow: (redoStack.length === 0 || monthLocked) ? 'none' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              opacity: (redoStack.length === 0 || monthLocked) ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (redoStack.length > 0 && !monthLocked) {
                e.currentTarget.style.background = '#f1f5f9';
                e.currentTarget.style.borderColor = '#94a3b8';
              }
            }}
            onMouseLeave={(e) => {
              if (redoStack.length > 0 && !monthLocked) {
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
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--success)' }}>
              {hideFinance ? "R$ ••••" : `R$ ${totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </h2>
          </div>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--danger)' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Saídas</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
            <TrendingDown color="var(--danger)" size={24} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--danger)' }}>
              {hideFinance ? "R$ ••••" : `R$ ${totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </h2>
          </div>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--primary)' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Saldo Período</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
            <DollarSign color="var(--primary)" size={24} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              {hideFinance ? "R$ ••••" : `R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </h2>
          </div>
        </div>
      </div>

      {/* Resumo por Favorecido */}
      {activeTab.startsWith('fluxo') && (
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '15px', color: '#1e293b' }}>Resumo por Favorecido</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
          {allowedFavorecidos.map(fav => {
            const rawTotals = activeTab === 'fluxo_bb' ? favTotalsBB : favTotalsInter;
            const liquidatedTotals = activeTab === 'fluxo_bb' ? liquidatedFavTotalsBB : liquidatedFavTotalsInter;

            const value = liquidatedTotals[fav] || 0;
            const saldoConta = rawTotals[fav] || 0;
            const participacao = value - saldoConta;

            const prevLiquidatedTotals = activeTab === 'fluxo_bb' ? prevCalc?.liquidatedFavTotalsBB : prevCalc?.liquidatedFavTotalsInter;
            const mesAnt = prevLiquidatedTotals ? (prevLiquidatedTotals[fav] || 0) : 0;
            const valorReal = value + mesAnt;

            const isNegativeReal = valorReal < 0;
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
                  color: valorReal === 0 ? '#475569' : isNegativeReal ? '#dc2626' : '#16a34a',
                  margin: 0
                }}>
                  {hideFinance ? "R$ ••••" : `${isNegativeReal ? '-' : ''}R$ ${Math.abs(valorReal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </h4>

                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                    <span>Saldo em Conta:</span>
                    <span style={{ fontWeight: '600', color: '#475569' }}>
                      {hideFinance ? "R$ ••••" : `${saldoConta < 0 ? '-' : ''}R$ ${Math.abs(saldoConta).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                    <span>Participação:</span>
                    <span style={{ fontWeight: '600', color: hideFinance ? '#64748b' : (participacao === 0 ? '#64748b' : participacao < 0 ? '#dc2626' : '#16a34a') }}>
                      {hideFinance ? "R$ ••••" : `${participacao < 0 ? '-' : participacao > 0 ? '+' : ''}R$ ${Math.abs(participacao).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                    <span>Saldo do Mês:</span>
                    <span style={{ fontWeight: '600', color: hideFinance ? '#64748b' : (value === 0 ? '#64748b' : value < 0 ? '#dc2626' : '#16a34a') }}>
                      {hideFinance ? "R$ ••••" : `${value < 0 ? '-' : value > 0 ? '+' : ''}R$ ${Math.abs(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                    <span>Mês Ant.:</span>
                    <span style={{ fontWeight: '600', color: hideFinance ? '#64748b' : (mesAnt === 0 ? '#64748b' : mesAnt < 0 ? '#dc2626' : '#16a34a') }}>
                      {hideFinance ? "R$ ••••" : `${mesAnt < 0 ? '-' : mesAnt > 0 ? '+' : ''}R$ ${Math.abs(mesAnt).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('fluxo_bb')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: '800',
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: '1px solid #cbd5e1',
            background: activeTab === 'fluxo_bb' ? 'var(--primary)' : 'white',
            color: activeTab === 'fluxo_bb' ? 'white' : '#475569',
            boxShadow: activeTab === 'fluxo_bb' ? '0 4px 6px -1px rgba(99, 102, 241, 0.2)' : 'none'
          }}
        >
          Fluxo de Caixa (BB)
        </button>
        <button 
          onClick={() => setActiveTab('fluxo_inter')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: '800',
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: '1px solid #cbd5e1',
            background: activeTab === 'fluxo_inter' ? 'var(--primary)' : 'white',
            color: activeTab === 'fluxo_inter' ? 'white' : '#475569',
            boxShadow: activeTab === 'fluxo_inter' ? '0 4px 6px -1px rgba(99, 102, 241, 0.2)' : 'none'
          }}
        >
          Fluxo de Caixa (Inter)
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
        <button 
          onClick={() => setActiveTab('historico_mom')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: '800',
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: '1px solid #cbd5e1',
            background: activeTab === 'historico_mom' ? 'var(--primary)' : 'white',
            color: activeTab === 'historico_mom' ? 'white' : '#475569',
            boxShadow: activeTab === 'historico_mom' ? '0 4px 6px -1px rgba(99, 102, 241, 0.2)' : 'none'
          }}
        >
          Evolução Histórica (MoM)
        </button>
      </div>

      {activeTab === 'custos' && (
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '15px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={20} color="#8b5cf6" /> Fechamento de Caixa (Após Liquidação)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
            {allowedFavorecidos.map(fav => {
              const value = liquidatedFavTotals[fav] || 0;
              const colors = favColors[fav] || { border: '#cbd5e1', bg: '#f8fafc', text: '#475569' };
              
              const mesAnt = prevCalc ? (prevCalc.liquidatedFavTotals[fav] || 0) : 0;
              const valorReal = value + mesAnt;
              const isNegativeReal = valorReal < 0;

              const saldoTotalBB = (liquidatedFavTotalsBB[fav] || 0) + (prevCalc ? (prevCalc.liquidatedFavTotalsBB[fav] || 0) : 0);
              const saldoTotalInter = (liquidatedFavTotalsInter[fav] || 0) + (prevCalc ? (prevCalc.liquidatedFavTotalsInter[fav] || 0) : 0);
              const saldoDoMes = value;

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
                    color: valorReal === 0 ? '#475569' : isNegativeReal ? '#dc2626' : '#16a34a',
                    margin: 0
                  }}>
                    {hideFinance ? "R$ ••••" : `${isNegativeReal ? '-' : ''}R$ ${Math.abs(valorReal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </h4>
                  
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                      <span>Saldo BB:</span>
                      <span style={{ fontWeight: '600' }}>
                        {hideFinance ? "R$ ••••" : `${saldoTotalBB < 0 ? '-' : ''}R$ ${Math.abs(saldoTotalBB).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                      <span>Saldo Inter:</span>
                      <span style={{ fontWeight: '600' }}>
                        {hideFinance ? "R$ ••••" : `${saldoTotalInter < 0 ? '-' : ''}R$ ${Math.abs(saldoTotalInter).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab.startsWith('fluxo') ? (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CreditCard color="var(--primary)" size={24} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Fluxo de Caixa ({activeTab === 'fluxo_bb' ? 'Banco do Brasil' : 'Banco Inter'})</h3>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => {
                  setManualBank(activeTab === 'fluxo_inter' ? 'Banco Inter' : 'Banco do Brasil');
                  setShowManualModal(true);
                }}
                disabled={monthLocked}
                className="btn"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  fontSize: '0.85rem', 
                  padding: '10px 20px', 
                  fontWeight: '800',
                  background: monthLocked ? '#f1f5f9' : '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: monthLocked ? '#94a3b8' : '#334155',
                  borderRadius: '8px',
                  cursor: monthLocked ? 'not-allowed' : 'pointer',
                  opacity: monthLocked ? 0.6 : 1,
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
                        disabled={monthLocked}
                        title="Marcar/Desmarcar todos desta página"
                        style={{ cursor: monthLocked ? 'not-allowed' : 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary)', flexShrink: 0, opacity: monthLocked ? 0.6 : 1 }} 
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
                              disabled={monthLocked}
                              title="Marcar como conferido"
                              style={{ cursor: monthLocked ? 'not-allowed' : 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary)', flexShrink: 0, opacity: monthLocked ? 0.6 : 1 }} 
                            />
                            <select
                              value={favorecido}
                              onChange={(e) => handleUpdateSingleFavorecido(t.id, e.target.value)}
                              disabled={monthLocked}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: `1px solid ${favorecido ? (favColors[favorecido]?.border || '#cbd5e1') : '#cbd5e1'}`,
                                fontWeight: '800',
                                fontSize: '0.75rem',
                                background: monthLocked ? '#f1f5f9' : (favorecido ? (favColors[favorecido]?.bg || '#ffffff') : '#ffffff'),
                                color: monthLocked ? '#94a3b8' : (favorecido ? (favColors[favorecido]?.text || '#475569') : '#475569'),
                                cursor: monthLocked ? 'not-allowed' : 'pointer',
                                outline: 'none',
                                flex: 1,
                                opacity: monthLocked ? 0.6 : 1
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
                              disabled={monthLocked}
                              title="Dividir Lançamento"
                              style={{ 
                                padding: '6px', 
                                borderRadius: '6px', 
                                border: '1px solid #e2e8f0', 
                                background: monthLocked ? '#f1f5f9' : '#ffffff', 
                                color: monthLocked ? '#94a3b8' : '#64748b', 
                                cursor: monthLocked ? 'not-allowed' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                                outline: 'none',
                                opacity: monthLocked ? 0.6 : 1
                              }}
                              onMouseEnter={(e) => {
                                if (!monthLocked) {
                                  e.currentTarget.style.color = '#1e40af';
                                  e.currentTarget.style.borderColor = '#1e40af40';
                                  e.currentTarget.style.background = '#eff6ff';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!monthLocked) {
                                  e.currentTarget.style.color = '#64748b';
                                  e.currentTarget.style.borderColor = '#e2e8f0';
                                  e.currentTarget.style.background = '#ffffff';
                                }
                              }}
                            >
                              <Split size={12} />
                            </button>
                            <button 
                              onClick={() => handleDeleteTransaction(t.id)}
                              disabled={monthLocked}
                              title="Excluir Lançamento"
                              style={{ 
                                padding: '6px', 
                                borderRadius: '6px', 
                                border: '1px solid #fecaca', 
                                background: monthLocked ? '#f1f5f9' : '#ffffff', 
                                color: monthLocked ? '#94a3b8' : '#ef4444', 
                                cursor: monthLocked ? 'not-allowed' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                                outline: 'none',
                                opacity: monthLocked ? 0.6 : 1
                              }}
                              onMouseEnter={(e) => {
                                if (!monthLocked) {
                                  e.currentTarget.style.color = '#b91c1c';
                                  e.currentTarget.style.borderColor = '#fca5a5';
                                  e.currentTarget.style.background = '#fef2f2';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!monthLocked) {
                                  e.currentTarget.style.color = '#ef4444';
                                  e.currentTarget.style.borderColor = '#fecaca';
                                  e.currentTarget.style.background = '#ffffff';
                                }
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
      ) : activeTab === 'custos' ? (() => {
        const renderExtraField = (label: string, cleanDesc: string, category: 'CPFL_SALA' | 'PRO_EARNING' | 'PARTNER_ADJ') => {
          const value = getExtraVal(cleanDesc, category);
          const existingId = getExtraId(cleanDesc, category);
          
          return (
            <div key={cleanDesc} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>{label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {category === 'PRO_EARNING' && <span style={{ fontWeight: '800', color: '#475569', fontSize: '0.8rem' }}>R$</span>}
                <input 
                  type="number" 
                  step="0.01"
                  key={`${cleanDesc}_${value}`}
                  defaultValue={value ? Number(value).toFixed(2) : ''}
                  placeholder="0,00"
                  disabled={monthLocked}
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
                    background: monthLocked ? '#f1f5f9' : '#ffffff',
                    cursor: monthLocked ? 'not-allowed' : 'text',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    opacity: monthLocked ? 0.6 : 1
                  }}
                />
              </div>
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
                const blockCategories = ['GERAL', 'SECRETARIA', 'KINESIS'];

                const allExtraMappedIds = activeTransactions.filter(t => 
                  t.type === 'EXPENSE' &&
                  t.clinicCat && 
                  blockCategories.includes(t.clinicCat.toUpperCase()) &&
                  !allMappedIds.includes(t.id)
                ).map(t => t.id);

                // Unmapped = bank transactions in these categories that haven't been linked
                const globalUnmappedCosts = activeTransactions.filter(t => 
                   t.type === 'EXPENSE' && 
                   (
                     blockCategories.includes((t.clinicCat ?? t.category)?.toUpperCase() || '') ||
                     (t.clinicCat ?? t.category)?.toUpperCase() === 'UNMAPPED' ||
                     (t.clinicCat ?? t.category)?.toUpperCase().startsWith('CPFL_SALA')
                   ) &&
                   !allMappedIds.includes(t.id) &&
                   !allExtraMappedIds.includes(t.id)
                );

                // Also pool CPFL transactions (category CPFL_SALA_*) that are unlinked
                const cpflItems = EXCEL_ITEMS.filter(i => i.block === 'cpfl');
                const mappedCpflIds = cpflItems.map(i => findMappedTransaction(i)?.id).filter(Boolean);
                const unmappedCpflCosts = activeTransactions.filter(t =>
                  t.type === 'EXPENSE' &&
                  ['CPFL_SALA_01','CPFL_SALA_02','CPFL_SALA_03','CPFL_SALA_04','CPFL_SALA_05','CPFL_SALA_06','CPFL_SALA'].some(c => (t.clinicCat ?? t.category)?.toUpperCase() === c) &&
                  t.bank !== 'MANUAL_CLINICA' &&
                  !mappedCpflIds.includes(t.id)
                );
                // Combined pool for dropdowns
                const allUnmappedForDropdown = [...globalUnmappedCosts, ...unmappedCpflCosts];

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
                              defaultValue={((transaction.clinicDesc ?? transaction.description) || '').replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '')}
                              onBlur={(e) => handleUpdateTransactionField(transaction.id, 'description', e.target.value)}
                              disabled={monthLocked}
                              style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '0.8rem', fontWeight: '800', color: '#0f172a', outline: 'none', cursor: monthLocked ? 'not-allowed' : 'text' }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                              <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
                                Data: {(transaction.date || '').split('T')[0].split('-').reverse().slice(0,2).join('/')}
                              </span>
                              <select
                                value={transaction.favorecido || ''}
                                onChange={(e) => handleUpdateTransactionField(transaction.id, 'favorecido', e.target.value)}
                                disabled={monthLocked}
                                style={{ border: 'none', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', padding: '2px 6px', fontSize: '0.65rem', fontWeight: '800', outline: 'none', color: transaction.favorecido ? (favColors[transaction.favorecido]?.text || '#166534') : '#166534', cursor: monthLocked ? 'not-allowed' : 'pointer', opacity: monthLocked ? 0.6 : 1 }}
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
                            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#15803d' }}>
                              {Number(transaction.clinicAmount ?? transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
                          <button 
                            onClick={() => handleRemoveFromClinicCosts(transaction.id)} 
                            disabled={monthLocked}
                            title="Desvincular Lançamento"
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              border: '1px solid #fee2e2',
                              background: monthLocked ? '#f1f5f9' : '#fef2f2',
                              color: monthLocked ? '#94a3b8' : '#ef4444',
                              cursor: monthLocked ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: monthLocked ? 0.6 : 1
                            }}>
                            <Unlink size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  // Not yet linked
                  return (
                    <tr key={item.key} style={{ background: '#ffffff' }}>
                      <td style={{ fontWeight: '700', fontSize: '0.85rem', color: '#334155', padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
                        {item.label}
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
                        <select
                          disabled={monthLocked}
                          onChange={async (e) => {
                            const txId = e.target.value;
                            if (!txId) return;
                            const toastId = toast.loading('Vinculando...');
                            try {
                              const targetCat = item.clinicCat ?? (item.block === 'geral' ? 'GERAL' : item.block === 'secretaria' ? 'SECRETARIA' : item.block === 'kinesis' ? 'KINESIS' : 'GERAL');
                              await fetch('/api/financeiro/update', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  transactionId: txId,
                                  isClinicEdit: true,
                                  description: item.label,
                                  category: targetCat
                                })
                              });
                              toast.success('Vinculado com sucesso!', { id: toastId });
                              loadTransactions();
                            } catch(err) {
                              toast.error('Erro ao vincular', { id: toastId });
                            }
                          }}
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.75rem', fontWeight: '700', outline: 'none', color: monthLocked ? '#94a3b8' : '#334155', background: monthLocked ? '#f1f5f9' : '#f8fafc', cursor: monthLocked ? 'not-allowed' : 'pointer', opacity: monthLocked ? 0.6 : 1 }}
                        >
                          <option value="">-- Buscar Lançamento --</option>
                          {allUnmappedForDropdown.map(t => (
                            <option key={t.id} value={t.id}>
                              ({(t.date || '').split('T')[0].split('-').reverse().slice(0,2).join('/')}) {((t.clinicDesc ?? t.description) || '').substring(0, 28)}... R$ {Math.abs((t.clinicAmount ?? t.amount) || 0).toFixed(2)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>
                        <input 
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          disabled={monthLocked}
                          onBlur={async (e) => {
                             const val = Number((parseFloat(e.target.value) || 0).toFixed(2));
                             if (val > 0) {
                               const cat = item.clinicCat ?? (['geral', 'secretaria', 'kinesis'].includes(item.block) ? item.block.toUpperCase() : 'GERAL');
                               const toastId = toast.loading('Adicionando...');
                               try {
                                 await fetch('/api/financeiro/manual', {
                                   method: 'POST',
                                   headers: { 'Content-Type': 'application/json' },
                                   body: JSON.stringify({
                                     date: new Date(startYear, startMonth, 1).toISOString().split('T')[0],
                                     description: item.label,
                                     amount: val,
                                     type: 'EXPENSE',
                                     category: cat,
                                     bank: 'MANUAL_CLINICA'
                                   })
                                 });
                                 toast.success('Adicionado!', { id: toastId });
                                 e.target.value = '';
                                 loadTransactions();
                               } catch (err) {
                                 toast.error('Erro ao adicionar', { id: toastId });
                               }
                             }
                          }}
                          style={{ width: '100px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: '800', textAlign: 'right', outline: 'none', background: monthLocked ? '#f1f5f9' : '#ffffff', cursor: monthLocked ? 'not-allowed' : 'text', opacity: monthLocked ? 0.6 : 1 }}
                        />
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
                          <button 
                            onClick={() => handleHideExcelItem(item.key)} 
                            disabled={monthLocked}
                            title="Excluir este item da lista neste mês"
                            style={{ padding: '6px', borderRadius: '6px', border: '1px solid #fee2e2', background: monthLocked ? '#f1f5f9' : '#fef2f2', color: monthLocked ? '#94a3b8' : '#ef4444', cursor: monthLocked ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', opacity: monthLocked ? 0.6 : 1 }}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                  );
                };

                const renderBlock = (title: string, blockName: 'geral' | 'secretaria' | 'kinesis' | 'cpfl' | 'exclusivo', total: number, showAddButton = true) => {
                  const items = blockName === 'exclusivo' ? [] : EXCEL_ITEMS.filter(i => i.block === blockName);
                  
                  const hiddenItemKeys = activeTransactions
                    .filter(t => t.bank === 'HIDDEN_ITEM')
                    .map(t => (t.description || '').replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '').trim());
                    
                  const visibleItems = items.filter(i => !hiddenItemKeys.includes(i.key));
                  const hiddenItems = items.filter(i => hiddenItemKeys.includes(i.key));

                  const blockCat = blockName === 'cpfl' ? null : blockName.toUpperCase();
                  const extraItems = blockName === 'exclusivo'
                    ? activeTransactions.filter(t =>
                        t.type === 'EXPENSE' &&
                        ['EXCLUSIVO_FISIO', 'EXCLUSIVO_PILATES'].includes(t.category?.toUpperCase() || '')
                      )
                    : (blockCat ? activeTransactions.filter(t =>
                        t.type === 'EXPENSE' &&
                        t.category?.toUpperCase() === blockCat &&
                        !allMappedIds.includes(t.id)
                      ) : []);

                  return (
                    <div className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                      <div 
                        onClick={() => {
                          setCollapsedBlocks(prev => ({
                            ...prev,
                            [blockName]: !prev[blockName]
                          }));
                        }}
                        style={{ 
                          padding: '16px 20px', 
                          borderBottom: collapsedBlocks[blockName] ? 'none' : '1px solid var(--border-color)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          background: '#f8fafc',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {collapsedBlocks[blockName] ? <ChevronDown size={18} color="#64748b" /> : <ChevronUp size={18} color="#64748b" />}
                          <FileText size={16} color="var(--primary)" />
                          <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1e293b' }}>{title}</span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: '950', color: '#0f172a' }}>
                            R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          {showAddButton && blockName !== 'cpfl' && !collapsedBlocks[blockName] && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddCustomLine(blockName);
                              }}
                              disabled={monthLocked}
                              className="btn btn-secondary" 
                              style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '800', cursor: monthLocked ? 'not-allowed' : 'pointer', opacity: monthLocked ? 0.6 : 1 }}>
                              <Plus size={14} /> Adicionar Nova Linha
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {!collapsedBlocks[blockName] && (
                        <div style={{ overflowX: 'auto' }}>
                          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                              <tr>
                                <th style={{ padding: '12px 16px', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '800', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Item</th>
                                <th style={{ padding: '12px 16px', minWidth: '150px', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '800', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Lançamento Vinculado</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', width: '130px', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '800', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Valor (R$)</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', width: '80px', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '800', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Ações</th>
                              </tr>
                            </thead>
                            <tbody>
                              {visibleItems.map(item => renderDossierRow(item))}
                              {/* Manual extras not in EXCEL_ITEMS rendered inline correctly using tx */}
                              {extraItems.map((tx, idx) => (
                                <tr key={`${tx.id}-${idx}`} style={{ background: '#f0fdf4' }}>
                                  <td style={{ fontWeight: '700', fontSize: '0.85rem', color: '#334155', padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
                                    <input
                                      type="text"
                                      defaultValue={((tx.clinicDesc ?? tx.description) || '').replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '')}
                                      onBlur={(e) => handleUpdateTransactionField(tx.id, 'description', e.target.value)}
                                      disabled={monthLocked}
                                      style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '0.85rem', fontWeight: '700', color: '#334155', outline: 'none', cursor: monthLocked ? 'not-allowed' : 'text' }}
                                    />
                                  </td>
                                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                      <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
                                        Data: {(tx.date || '').split('T')[0].split('-').reverse().slice(0,2).join('/')}
                                      </span>
                                      <select
                                        value={tx.favorecido || ''}
                                        onChange={(e) => handleUpdateTransactionField(tx.id, 'favorecido', e.target.value)}
                                        disabled={monthLocked}
                                        style={{ border: 'none', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', padding: '2px 6px', fontSize: '0.65rem', fontWeight: '800', outline: 'none', color: tx.favorecido ? (favColors[tx.favorecido]?.text || '#166534') : '#166534', cursor: monthLocked ? 'not-allowed' : 'pointer', opacity: monthLocked ? 0.6 : 1 }}
                                      >
                                        <option value="">-- Pago por --</option>
                                        {allowedFavorecidos.map(f => <option key={f} value={f}>{f}</option>)}
                                      </select>
                                      {blockName === 'exclusivo' && (
                                        <select
                                          value={tx.category?.toUpperCase() || 'EXCLUSIVO_FISIO'}
                                          onChange={(e) => handleUpdateTransactionField(tx.id, 'category', e.target.value)}
                                          disabled={monthLocked}
                                          style={{ border: 'none', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', padding: '2px 6px', fontSize: '0.65rem', fontWeight: '800', outline: 'none', color: '#1e3a8a', cursor: monthLocked ? 'not-allowed' : 'pointer', opacity: monthLocked ? 0.6 : 1 }}
                                        >
                                          <option value="EXCLUSIVO_FISIO">FISIOTERAPIA</option>
                                          <option value="EXCLUSIVO_PILATES">PILATES</option>
                                        </select>
                                      )}
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                      <span style={{ fontWeight: '800', color: '#15803d', fontSize: '0.85rem' }}>R$</span>
                                      <input
                                        type="number"
                                        step="0.01"
                                        defaultValue={Number(tx.clinicAmount ?? tx.amount).toFixed(2)}
                                        onBlur={(e) => handleUpdateTransactionField(tx.id, 'amount', e.target.value)}
                                        disabled={monthLocked}
                                        style={{ border: 'none', background: 'transparent', width: '80px', fontSize: '0.85rem', fontWeight: '800', color: '#15803d', textAlign: 'right', outline: 'none', cursor: monthLocked ? 'not-allowed' : 'text' }}
                                      />
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
                                    <button
                                      onClick={() => handleRemoveFromClinicCosts(tx.id)}
                                      disabled={monthLocked}
                                      title="Desvincular Lançamento"
                                      style={{ padding: '6px', borderRadius: '6px', border: '1px solid #fee2e2', background: monthLocked ? '#f1f5f9' : '#fef2f2', color: monthLocked ? '#94a3b8' : '#ef4444', cursor: monthLocked ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', opacity: monthLocked ? 0.6 : 1 }}>
                                      <Unlink size={14} />
                                    </button>
                                  </td>
                                </tr>
                              ))}

                              {/* Temporary Empty Slots */}
                              {customBlockLines.filter(c => c.block === blockName).map(customLine => (
                                <tr key={customLine.id} style={{ background: '#ffffff' }}>
                                  <td style={{ fontWeight: '700', fontSize: '0.85rem', color: '#334155', padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
                                    <input 
                                      type="text" 
                                      defaultValue={customLine.label}
                                      onBlur={(e) => {
                                        setCustomBlockLines(prev => prev.map(c => c.id === customLine.id ? { ...c, label: e.target.value } : c));
                                      }}
                                      disabled={monthLocked}
                                      style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '0.85rem', fontWeight: '700', color: '#334155', outline: 'none', borderBottom: '1px dashed #cbd5e1', cursor: monthLocked ? 'not-allowed' : 'text' }}
                                    />
                                  </td>
                                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
                                    <select
                                      disabled={monthLocked}
                                      onChange={async (e) => {
                                        const txId = e.target.value;
                                        if (!txId) return;
                                        const toastId = toast.loading('Vinculando...');
                                        try {
                                          const targetCat = blockName === 'exclusivo' ? 'EXCLUSIVO_FISIO' : (blockCat || 'GERAL');
                                          await fetch('/api/financeiro/update', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                              transactionId: txId,
                                              isClinicEdit: true,
                                              description: customLine.label,
                                              category: targetCat
                                            })
                                          });
                                          toast.success('Vinculado com sucesso!', { id: toastId });
                                          setCustomBlockLines(prev => prev.filter(c => c.id !== customLine.id));
                                          loadTransactions();
                                        } catch(err) {
                                          toast.error('Erro ao vincular', { id: toastId });
                                        }
                                      }}
                                      style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.75rem', fontWeight: '700', outline: 'none', color: monthLocked ? '#94a3b8' : '#334155', background: monthLocked ? '#f1f5f9' : '#f8fafc', cursor: monthLocked ? 'not-allowed' : 'pointer', opacity: monthLocked ? 0.6 : 1 }}
                                    >
                                      <option value="">-- Buscar Lançamento --</option>
                                      {allUnmappedForDropdown.map((t, idx) => (
                                        <option key={`${t.id}-${idx}`} value={t.id}>
                                          ({(t.date || '').split('T')[0].split('-').reverse().slice(0,2).join('/')}) {((t.clinicDesc ?? t.description) || '').substring(0, 28)}... R$ {Math.abs((t.clinicAmount ?? t.amount) || 0).toFixed(2)}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
                                    <button 
                                      onClick={() => setCustomBlockLines(prev => prev.filter(c => c.id !== customLine.id))} 
                                      disabled={monthLocked}
                                      title="Remover linha"
                                      style={{ padding: '6px', borderRadius: '6px', border: '1px solid #fee2e2', background: monthLocked ? '#f1f5f9' : '#fef2f2', color: monthLocked ? '#94a3b8' : '#ef4444', cursor: monthLocked ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', opacity: monthLocked ? 0.6 : 1 }}>
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          
                          {hiddenItems.length > 0 && (
                            <div style={{ padding: '8px 20px', fontSize: '0.75rem', color: '#64748b', display: 'flex', gap: '8px', alignItems: 'center', background: '#f8fafc' }}>
                              <Trash2 size={14} />
                              <span style={{ fontWeight: '800' }}>Itens excluídos neste mês:</span>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {hiddenItems.map(hi => {
                                  const hiddenTx = activeTransactions.find(t => t.bank === 'HIDDEN_ITEM' && t.description === hi.key);
                                  return (
                                    <button 
                                      key={hi.key}
                                      onClick={() => handleRestoreExcelItem(hiddenTx?.id)}
                                      disabled={monthLocked}
                                      style={{ background: monthLocked ? '#f1f5f9' : '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 6px', color: monthLocked ? '#94a3b8' : '#475569', cursor: monthLocked ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700', opacity: monthLocked ? 0.6 : 1 }}
                                      title="Restaurar item para a tabela"
                                    >
                                      {hi.label} <RotateCcw size={10} color="#3b82f6" />
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '0.9rem', color: '#0f172a', background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                            <span>TOTAL {title.toUpperCase()}:</span>
                            <span>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                };

                return (
                <>
                   {/* Distribuição Consolidada */}
                    <div style={{ flex: '7', display: 'flex', flexDirection: 'column' }}>
                      {renderBlock("Gastos Gerais", "geral", totalGeral)}
                      {renderBlock("Gastos Secretária", "secretaria", totalSecretaria)}
                      {renderBlock("Gastos Kinesis", "kinesis", totalKinesis)}
                      {renderBlock("CPFL por Sala", "cpfl", cpflSum + cpflSala02, false)}
                      {renderBlock("Custos Exclusivos (100% Área)", "exclusivo", totalExclusivoFisio + totalExclusivoPilates)}
                    </div>

                    {/* RIGHT SIDE: UNMAPPED TRANSACTIONS BOX (Sticky Sidebar) */}
                    <div style={{ 
                      flex: '3', 
                      position: 'sticky', 
                      top: '20px', 
                      maxHeight: 'calc(100vh - 40px)', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '16px' 
                    }}>
                      <div className="card" style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        padding: globalUnmappedCosts.length === 0 ? '16px 24px' : '24px', 
                        overflow: 'hidden', 
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                        border: '1.5px solid #cbd5e1',
                        maxHeight: '100%'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          borderBottom: '1px solid #cbd5e1', 
                          paddingBottom: globalUnmappedCosts.length === 0 ? '8px' : '12px', 
                          marginBottom: globalUnmappedCosts.length === 0 ? '8px' : '16px' 
                        }}>
                          <h3 style={{ fontSize: '0.9rem', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Sparkles size={16} color="#eab308" /> Lançamentos Não Relacionados
                          </h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.75rem', fontWeight: '800', padding: '2px 8px', borderRadius: '12px' }}>
                              {globalUnmappedCosts.length}
                            </span>
                            {globalUnmappedCosts.length > 0 && (
                              <button 
                                onClick={() => handleAISuggestions(globalUnmappedCosts)}
                                disabled={aiRecommending || monthLocked}
                                style={{ padding: '4px 8px', borderRadius: '6px', background: '#f5f3ff', color: '#7c3aed', border: 'none', cursor: (aiRecommending || monthLocked) ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px', opacity: monthLocked ? 0.6 : 1 }}>
                                {aiRecommending ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} 
                                {aiRecommending ? 'Sugerindo...' : 'Sugerir IA'}
                              </button>
                            )}
                            <button 
                              onClick={handleCreateSidebarManualEntry}
                              disabled={monthLocked}
                              style={{ padding: '4px 8px', borderRadius: '6px', background: '#e0f2fe', color: '#0284c7', border: 'none', cursor: monthLocked ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px', opacity: monthLocked ? 0.6 : 1 }}>
                              <Plus size={12} /> Novo
                            </button>
                          </div>
                        </div>

                        {/* Scrollable unmapped list */}
                        <div style={{ 
                          flex: globalUnmappedCosts.length === 0 ? '0 0 auto' : '1', 
                          overflowY: 'auto', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '12px',
                          paddingRight: '4px' 
                        }}>
                          {globalUnmappedCosts.map(tx => {
                            const isUnmapped = (tx.clinicCat ?? tx.category)?.toUpperCase() === 'UNMAPPED';
                            return (
                              <div key={tx.id} style={{ 
                                background: isUnmapped ? '#fff1f2' : '#f8fafc', 
                                border: isUnmapped ? '1.5px solid #fecaca' : '1.5px solid #e2e8f0', 
                                borderRadius: '12px', 
                                padding: '12px 14px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                                transition: 'all 0.2s',
                                position: 'relative'
                              }}>
                                <button 
                                  onClick={() => handleHideFromClinicCosts(tx.id)} 
                                  disabled={monthLocked}
                                  style={{ position: 'absolute', top: '12px', right: '14px', background: 'transparent', border: 'none', color: monthLocked ? '#94a3b8' : '#ef4444', cursor: monthLocked ? 'not-allowed' : 'pointer', opacity: monthLocked ? 0.6 : 1 }}>
                                  <Trash2 size={14} />
                                </button>
                                {isUnmapped && (
                                  <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#dc2626', background: '#fee2e2', padding: '2px 6px', borderRadius: '4px', width: 'fit-content', marginBottom: '2px' }}>
                                    ⚠️ Sem Categoria (Não afeta partilha)
                                  </span>
                                )}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingRight: '20px' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#64748b' }}>{(tx.date || '').split('T')[0].split('-').reverse().slice(0,2).join('/')}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ fontSize: '0.85rem', fontWeight: '950', color: '#b91c1c' }}>R$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    defaultValue={Math.abs(tx.clinicAmount ?? tx.amount).toFixed(2)}
                                    onBlur={(e) => handleUpdateTransactionField(tx.id, 'amount', e.target.value)}
                                    disabled={monthLocked}
                                    style={{ border: 'none', background: 'transparent', width: '70px', fontSize: '0.85rem', fontWeight: '950', color: '#b91c1c', textAlign: 'right', outline: 'none', cursor: monthLocked ? 'not-allowed' : 'text' }}
                                  />
                                </div>
                              </div>
                              <input 
                                type="text"
                                defaultValue={(tx.description || '').replace(/\s*\((KINESIS|DANIEL|STUART|PAULA|PILATES|FUNDO)\)$/i, '')}
                                onBlur={(e) => handleUpdateTransactionField(tx.id, 'description', e.target.value)}
                                disabled={monthLocked}
                                style={{ fontSize: '0.8rem', fontWeight: '750', color: '#1e293b', background: 'transparent', border: 'none', outline: 'none', padding: 0, width: '100%', marginTop: '2px', cursor: monthLocked ? 'not-allowed' : 'text' }}
                              />
                              <select
                                value={tx.favorecido || ''}
                                onChange={(e) => handleUpdateTransactionField(tx.id, 'favorecido', e.target.value)}
                                disabled={monthLocked}
                                style={{ border: 'none', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', padding: '2px 6px', fontSize: '0.65rem', fontWeight: '800', outline: 'none', color: tx.favorecido ? (favColors[tx.favorecido]?.text || '#334155') : '#334155', cursor: monthLocked ? 'not-allowed' : 'pointer', width: 'fit-content', marginTop: '6px', opacity: monthLocked ? 0.6 : 1 }}
                              >
                                <option value="">-- Pago por --</option>
                                {allowedFavorecidos.map(f => <option key={f} value={f}>{f}</option>)}
                              </select>
                              {aiSuggestions[tx.id] && (
                                <div style={{ 
                                  marginTop: '10px', 
                                  background: '#f3e8ff', 
                                  border: '1px solid #d8b4fe', 
                                  borderRadius: '8px', 
                                  padding: '8px 10px', 
                                  fontSize: '0.7rem',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '4px'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6b21a8', fontWeight: '850' }}>
                                    <Sparkles size={11} /> Sugestão da IA
                                  </div>
                                  <div style={{ color: '#4c1d95', lineHeight: '1.4' }}>
                                    <strong>Favorecido:</strong> {aiSuggestions[tx.id].favorecido || '(Nenhum)'} <br/>
                                    <strong>Categoria:</strong> {aiSuggestions[tx.id].categoria} <br/>
                                    <strong>Motivo:</strong> {aiSuggestions[tx.id].justificativa}
                                  </div>
                                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                    <button 
                                      onClick={() => handleAcceptAISuggestion(tx.id)}
                                      disabled={monthLocked}
                                      style={{ padding: '3px 8px', background: monthLocked ? '#f1f5f9' : '#7c3aed', color: monthLocked ? '#94a3b8' : 'white', border: 'none', borderRadius: '4px', cursor: monthLocked ? 'not-allowed' : 'pointer', fontWeight: '850', fontSize: '0.65rem', opacity: monthLocked ? 0.6 : 1 }}>
                                      Aceitar
                                    </button>
                                    <button 
                                      onClick={() => handleRejectAISuggestion(tx.id)}
                                      disabled={monthLocked}
                                      style={{ padding: '3px 8px', background: monthLocked ? '#f1f5f9' : 'white', color: monthLocked ? '#94a3b8' : '#6b7280', border: '1px solid #d1d5db', borderRadius: '4px', cursor: monthLocked ? 'not-allowed' : 'pointer', fontWeight: '850', fontSize: '0.65rem', opacity: monthLocked ? 0.6 : 1 }}>
                                      Recusar
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                            );
                          })}

                          {globalUnmappedCosts.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '16px 8px', color: '#94a3b8' }}>
                              <CheckCircle2 color="#10b981" size={24} style={{ margin: '0 auto 8px' }} />
                              <p style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: '#1e293b' }}>Tudo classificado!</p>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '25px' }}>

              {/* Ganhos card */}
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1e293b', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Ganhos Fisioterapia</h3>
                {renderExtraField("Julia", "Julia", "PRO_EARNING")}
                {renderExtraField("Gambá", "Gambá", "PRO_EARNING")}
                {renderExtraField("Newton", "Newton", "PRO_EARNING")}
                {renderExtraField("Cris", "Cris", "PRO_EARNING")}
                {renderExtraField("João", "João", "PRO_EARNING")}
                {renderExtraField("Ausência Nula", "Ausência Nula", "PRO_EARNING")}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: '2px solid #e2e8f0', fontWeight: '900', color: '#0f172a', fontSize: '0.85rem' }}>
                  <span>TOTAL:</span>
                  <span>R$ {totalArrecadado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Parâmetros do Pilates card */}
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1e293b', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Ganhos Pilates</h3>
                {renderExtraField("Julia (Pilates)", "Julia (Pilates)", "PRO_EARNING")}
                {renderExtraField("Ausência Nula (P)", "Ausência Nula (Pilates)", "PRO_EARNING")}
                {renderExtraField("Imposto (Pilates)", "Imposto (Pilates)", "PRO_EARNING")}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: '2px solid #e2e8f0', fontWeight: '900', color: '#0f172a', fontSize: '0.85rem' }}>
                  <span>TOTAL:</span>
                  <span>R$ {(juliaPilates + ausenciaPilates + impostoPilates).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
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
                      <span>Custos Exclusivos:</span>
                      <span style={{ color: '#b91c1c', whiteSpace: 'nowrap' }}>- R$ {totalExclusivoFisio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                      <span>Custos Exclusivos:</span>
                      <span style={{ color: '#b91c1c', whiteSpace: 'nowrap' }}>- R$ {totalExclusivoPilates.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', color: '#0f172a' }}>
                      <span>Lucro Bruto:</span>
                      <span style={{ color: '#15803d', whiteSpace: 'nowrap' }}>+ R$ {(juliaPilates + ausenciaPilates).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', color: '#0f172a' }}>
                      <span>Imposto Pilates:</span>
                      <span style={{ color: '#b91c1c', whiteSpace: 'nowrap' }}>- R$ {impostoPilates.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                    <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Fisioterapia (40%):</span> <span style={{fontWeight: '700'}}>R$ {(saldoFinal * 0.4).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Pilates (33%):</span> <span style={{fontWeight: '700'}}>R$ {(saldoFinalPilates / 3).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Reembolso:</span> <span style={{fontWeight: '700'}}>R$ {danielPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Ajustes:</span> <span style={{fontWeight: '700'}}>R$ {(danielAdj - crisEarning).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0f172a', fontSize: '0.85rem', marginTop: '6px', backgroundColor: '#f8fafc', paddingLeft: '4px', paddingRight: '4px', paddingBottom: '4px', borderRadius: '4px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                        <span style={{fontWeight: '800'}}>PARTICIPAÇÃO SÓCIO:</span> 
                        <span style={{fontWeight: '900'}}>R$ {danielShare.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>

                    </div>
                  </div>

                  <div style={{ borderLeft: '4px solid #3b82f6', paddingLeft: '14px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Stuart</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: '950', color: stuartShare >= 0 ? '#1d4ed8' : '#991b1b', marginTop: '4px', whiteSpace: 'nowrap' }}>
                      R$ {stuartShare.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Fisioterapia (40%):</span> <span style={{fontWeight: '700'}}>R$ {(saldoFinal * 0.4).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Pilates (33%):</span> <span style={{fontWeight: '700'}}>R$ {(saldoFinalPilates / 3).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Reembolso:</span> <span style={{fontWeight: '700'}}>R$ {stuartPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Ajustes:</span> <span style={{fontWeight: '700'}}>R$ {stuartAdj.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0f172a', fontSize: '0.85rem', marginTop: '6px', backgroundColor: '#f8fafc', paddingLeft: '4px', paddingRight: '4px', paddingBottom: '4px', borderRadius: '4px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                        <span style={{fontWeight: '800'}}>PARTICIPAÇÃO SÓCIO:</span> 
                        <span style={{fontWeight: '900'}}>R$ {stuartShare.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>

                    </div>
                  </div>

                  <div style={{ borderLeft: '4px solid #ec4899', paddingLeft: '14px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Paula</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: '950', color: paulaShare >= 0 ? '#be185d' : '#991b1b', marginTop: '4px', whiteSpace: 'nowrap' }}>
                      R$ {paulaShare.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Fisioterapia (20%):</span> <span style={{fontWeight: '700'}}>R$ {(saldoFinal * 0.2).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Pilates (33%):</span> <span style={{fontWeight: '700'}}>R$ {(saldoFinalPilates / 3).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Reembolso:</span> <span style={{fontWeight: '700'}}>R$ {paulaPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Ajustes:</span> <span style={{fontWeight: '700'}}>R$ {paulaAdj.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0f172a', fontSize: '0.85rem', marginTop: '6px', backgroundColor: '#f8fafc', paddingLeft: '4px', paddingRight: '4px', paddingBottom: '4px', borderRadius: '4px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                        <span style={{fontWeight: '800'}}>PARTICIPAÇÃO SÓCIO:</span> 
                        <span style={{fontWeight: '900'}}>R$ {paulaShare.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>

                    </div>
                  </div>

                </div>

                <button 
                  onClick={handleSyncSpreadsheet}
                  disabled={syncing || monthLocked}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '20px', fontSize: '0.85rem', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', cursor: (syncing || monthLocked) ? 'not-allowed' : 'pointer', opacity: monthLocked ? 0.6 : 1 }}
                >
                  {syncing ? <Loader2 className="animate-spin" size={16} /> : <FileSpreadsheet size={16} />}
                  Sincronizar Planilha
                </button>
              </div>
            </div>

          </div>
        );
      })() : activeTab === 'historico_mom' ? (
        <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '850', color: '#0f172a', margin: 0 }}>Evolução Histórica e Margens (MoM)</h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>Análise comparativa mensal do faturamento, lucros e repasse societário do ano de {startYear}</p>
            </div>
            {historyLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: '700' }}>
                <Loader2 className="animate-spin" size={16} /> Carregando histórico...
              </div>
            )}
          </div>

          {/* MoM Performance Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '25px' }}>
            <div className="card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Faturamento Anual Acumulado</span>
              <div style={{ fontSize: '1.4rem', fontWeight: '950', color: '#0f172a', marginTop: '6px' }}>
                R$ {historyData.reduce((acc, curr) => acc + (curr.faturamentoFisio || 0) + (curr.faturamentoPilates || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '4px 0 0 0' }}>Fisioterapia + Pilates</p>
            </div>
            
            <div className="card" style={{ padding: '20px', borderLeft: '4px solid #8b5cf6' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Faturamento Médio Mensal</span>
              <div style={{ fontSize: '1.4rem', fontWeight: '950', color: '#0f172a', marginTop: '6px' }}>
                R$ {(historyData.reduce((acc, curr) => acc + (curr.faturamentoFisio || 0) + (curr.faturamentoPilates || 0), 0) / (historyData.length || 12)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '4px 0 0 0' }}>Média Geral</p>
            </div>

            <div className="card" style={{ padding: '20px', borderLeft: '4px solid #3b82f6' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Lucro Líquido Acumulado</span>
              <div style={{ fontSize: '1.4rem', fontWeight: '950', color: '#0f172a', marginTop: '6px' }}>
                R$ {historyData.reduce((acc, curr) => acc + (curr.lucroFisio || 0) + (curr.lucroPilates || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '4px 0 0 0' }}>Fisio + Pilates (Líquido)</p>
            </div>

            <div className="card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Meses Fechados / Total</span>
              <div style={{ fontSize: '1.4rem', fontWeight: '950', color: '#0f172a', marginTop: '6px' }}>
                {historyData.filter(h => h.isLocked).length} / 12
              </div>
              <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '4px 0 0 0' }}>Status do Controle de Período</p>
            </div>
          </div>

          {/* Recharts Graphics Panel */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
            
            {/* Graphic 1: Faturamento Fisioterapia vs Pilates */}
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '850', color: '#1e293b', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                Faturamento Mensal (Fisio vs Pilates)
              </h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={historyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="monthName" tick={{ fontSize: 10, fontWeight: 700 }} />
                    <YAxis tick={{ fontSize: 10, fontWeight: 700 }} />
                    <Tooltip 
                      formatter={(val: any) => [`R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                      contentStyle={{ borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                    <Bar dataKey="faturamentoFisio" name="Fisioterapia" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="faturamentoPilates" name="Pilates" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Graphic 2: Lucros Líquidos MoM */}
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '850', color: '#1e293b', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                Evolução do Lucro Líquido (Fisio vs Pilates)
              </h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={historyData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="monthName" tick={{ fontSize: 10, fontWeight: 700 }} />
                    <YAxis tick={{ fontSize: 10, fontWeight: 700 }} />
                    <Tooltip 
                      formatter={(val: any) => [`R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                      contentStyle={{ borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                    <Line type="monotone" dataKey="lucroFisio" name="Lucro Fisio" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="lucroPilates" name="Lucro Pilates" stroke="#10b981" strokeWidth={3} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Graphic 3: Partner Share Distribution MoM */}
            <div className="card" style={{ padding: '20px', gridColumn: 'span 2' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '850', color: '#1e293b', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                Distribuição Histórica Mensal de Lucros por Sócio
              </h3>
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  <BarChart data={historyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="monthName" tick={{ fontSize: 10, fontWeight: 700 }} />
                    <YAxis tick={{ fontSize: 10, fontWeight: 700 }} />
                    <Tooltip 
                      formatter={(val: any) => [`R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                      contentStyle={{ borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                    <Bar dataKey="danielShare" name="Daniel" fill="#16a34a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="stuartShare" name="Stuart" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="paulaShare" name="Paula" fill="#db2777" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      ) : null}

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

      {activeTab === 'custos' && (
        <button
          onClick={() => setShowAIConsultant(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 999,
            backgroundColor: 'var(--primary)',
            color: 'white',
            borderRadius: '50px',
            padding: '14px 22px',
            border: 'none',
            boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '900',
            fontSize: '0.85rem',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 12px 20px -3px rgba(99, 102, 241, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(99, 102, 241, 0.4)';
          }}
        >
          <Sparkles size={18} className="animate-pulse" />
          <span>Consultor IA Financeiro</span>
        </button>
      )}

      {showAIConsultant && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.2)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            width: '100%',
            maxWidth: '460px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-10px 0 25px -5px rgba(0, 0, 0, 0.1)',
            borderLeft: '1px solid #cbd5e1'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)'
            }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Sparkles size={18} color="var(--primary)" />
                  Consultor Financeiro IA
                </h3>
                <p style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', margin: '2px 0 0 0' }}>Análise e Insights - Kinesis Clínica</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px', fontSize: '1.1rem' }}
                  title="Ajustar Diretrizes"
                >
                  ⚙️
                </button>
                <button 
                  onClick={() => setShowAIConsultant(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Chat History */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              backgroundColor: '#f8fafc'
            }}>
              {/* Settings Area if open */}
              {isSettingsOpen && (
                <div style={{
                  background: '#ffffff',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--primary)' }}>Regras de Análise Financeira (Persistente)</span>
                  <textarea
                    value={customRules}
                    onChange={(e) => setCustomRules(e.target.value)}
                    placeholder="Regras adicionais para o Consultor Financeiro (ex: 'Sempre considere fundo de reserva', 'Exiba os valores em formato simplificado')..."
                    style={{
                      width: '100%',
                      height: '80px',
                      padding: '8px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.75rem',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                    Salvo automaticamente no navegador.
                  </span>
                </div>
              )}
              {chatMessages.map((msg, idx) => {
                const isModel = msg.role === 'model';
                return (
                  <div key={idx} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: isModel ? 'flex-start' : 'flex-end',
                    maxWidth: '85%'
                  }}>
                    <span style={{ 
                      fontSize: '0.65rem', 
                      fontWeight: '800', 
                      color: '#64748b', 
                      marginBottom: '4px',
                      alignSelf: isModel ? 'flex-start' : 'flex-end',
                      textTransform: 'uppercase'
                    }}>
                      {isModel ? 'Consultor IA' : 'Você'}
                    </span>
                    <div style={{
                      backgroundColor: isModel ? '#ffffff' : 'var(--primary)',
                      color: isModel ? '#1e293b' : '#ffffff',
                      borderRadius: isModel ? '12px 12px 12px 2px' : '12px 12px 2px 12px',
                      padding: '12px 16px',
                      fontSize: '0.8rem',
                      lineHeight: '1.6',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      border: isModel ? '1px solid #cbd5e1' : 'none',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {msg.parts.map((p, pIdx) => {
                        // Inline basic markdown formatter
                        const formatAIMessage = (text: string) => {
                          const parts = text.split(/(\*\*[^*]+\*\*)/g);
                          return parts.map((part, index) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={index} style={{ fontWeight: '800', color: '#0f172a' }}>{part.slice(2, -2)}</strong>;
                            }
                            return part;
                          });
                        };
                        return <div key={pIdx}>{formatAIMessage(p.text)}</div>;
                      })}
                    </div>
                  </div>
                );
              })}
              {aiLoading && (
                <div style={{ display: 'flex', gap: '6px', alignSelf: 'flex-start', alignItems: 'center', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px 12px 12px 2px', padding: '10px 16px', fontSize: '0.8rem', color: '#64748b' }}>
                  <Loader2 className="animate-spin" size={14} />
                  <span>Analisando dados da clínica...</span>
                </div>
              )}
            </div>

            {/* Suggestions */}
            {chatMessages.length === 1 && !aiLoading && (
              <div style={{ padding: '12px 20px', borderTop: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#ffffff' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Perguntas Sugeridas:</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    "Análise geral das finanças do mês",
                    "Qual área deu mais lucro e por quê?",
                    "Onde podemos cortar custos compartilhados?",
                    "Como melhorar o resultado financeiro da Paula?"
                  ].map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setChatInput(sug);
                      }}
                      style={{
                        background: '#eff6ff',
                        color: '#1e40af',
                        border: '1px solid #bfdbfe',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSendMessage} style={{
              padding: '16px 20px',
              borderTop: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              display: 'flex',
              gap: '10px',
              alignItems: 'center'
            }}>
              <input 
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Pergunte sobre faturamento, custos, rateio..."
                disabled={aiLoading}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  outline: 'none',
                  background: '#f8fafc'
                }}
              />
              <button 
                type="submit"
                disabled={aiLoading || !chatInput.trim()}
                style={{
                  backgroundColor: chatInput.trim() && !aiLoading ? 'var(--primary)' : '#cbd5e1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  cursor: chatInput.trim() && !aiLoading ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s'
                }}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
