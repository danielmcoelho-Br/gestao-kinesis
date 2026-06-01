"use client";

import React, { useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ReportHeader } from '@/gestao/components/ReportHeader';
import { 
  Upload, ArrowLeft, CheckCircle2, HelpCircle, Split, Trash2, Save, 
  FileSpreadsheet, Loader2, DollarSign, Sparkles, AlertCircle, Unlink, Plus, FileText
} from 'lucide-react';
import { toast } from 'sonner';

interface RawBankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number; // positive for income, negative for expense
  document: string;
  suggestedFavorecido: string | null;
  costCategory?: string;
}

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

export default function ConciliadorPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [month, setMonth] = useState<string>("Maio");
  const [year, setYear] = useState<string>("26");
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Raw bank transactions parsed
  const [allTransactions, setAllTransactions] = useState<RawBankTransaction[]>([]);
  const [saldoAnterior, setSaldoAnterior] = useState<number>(0);

  // Mapped state: ExcelItem key -> transactionId or manual input value
  const [mappedItems, setMappedItems] = useState<Record<string, { txId: string | null; manualValue: number }>>({});
  
  // Custom manual list of added items (for items not in template but user wants to add)
  const [customItems, setCustomItems] = useState<any[]>([]);

  // Payout / Incomes mapping (positive transactions or partner payouts mapping)
  const [incomeMappings, setIncomeMappings] = useState<Record<string, string>>({}); // transactionId -> responsible

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const allowedFavorecidos = ["Kinesis", "Daniel", "Stuart", "Paula", "Pilates", "Fundo"];

  // Handle statement processing output
  const handleProcessStatement = async () => {
    if (!file) {
      toast.error("Selecione o arquivo do extrato Banco do Brasil!");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/financeiro/conciliador', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro no servidor.");

      const rawTxs: RawBankTransaction[] = data.transactions;
      setAllTransactions(rawTxs);
      setSaldoAnterior(data.saldoAnterior || 0);

      // Perform automatic intelligent matching
      const initialMappings: Record<string, { txId: string | null; manualValue: number }> = {};
      const initialIncomeMappings: Record<string, string> = {};
      
      const usedTxIds = new Set<string>();

      // Initialize Excel Items mapping
      EXCEL_ITEMS.forEach(item => {
        initialMappings[item.key] = { txId: null, manualValue: 0 };
      });

      // 1. Process Negative Transactions (Expenses)
      const expenses = rawTxs.filter(t => t.amount < 0);
      
      // Match CPFL Room bills specifically first to avoid catching by general CPFL ADM
      const roomCpflItems = EXCEL_ITEMS.filter(item => item.key.startsWith('cpfl_sala_'));
      expenses.forEach(tx => {
        const norm = tx.description.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        // Try to match a CPFL room first
        const matchedRoom = roomCpflItems.find(item => 
          item.keywords.some(k => norm.includes(k))
        );

        if (matchedRoom && !initialMappings[matchedRoom.key].txId) {
          initialMappings[matchedRoom.key] = { txId: tx.id, manualValue: 0 };
          usedTxIds.add(tx.id);
        }
      });

      // Match remaining items
      expenses.forEach(tx => {
        if (usedTxIds.has(tx.id)) return;
        const norm = tx.description.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        // Find matched excel item
        const matchedItem = EXCEL_ITEMS.find(item => 
          !item.key.startsWith('cpfl_sala_') && // Already handled above
          item.keywords.some(k => norm.includes(k))
        );

        if (matchedItem && !initialMappings[matchedItem.key].txId) {
          initialMappings[matchedItem.key] = { txId: tx.id, manualValue: 0 };
          usedTxIds.add(tx.id);
        }
      });

      // 2. Process Positive Transactions (Income) & Partner Adjustments
      rawTxs.forEach(tx => {
        if (tx.amount >= 0) {
          // Pre-populate responsible suggestion
          initialIncomeMappings[tx.id] = tx.suggestedFavorecido || '';
        } else {
          // Check if it's a partner transfer expense (represented as negative but matched to Stuart/Daniel/Paula)
          const norm = tx.description.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const isPartner = norm.includes('ALEXANDRE') || norm.includes('STUART') || norm.includes('DANIEL') || norm.includes('PAULA');
          
          if (isPartner) {
            initialIncomeMappings[tx.id] = tx.suggestedFavorecido || '';
            usedTxIds.add(tx.id); // Also count it as used so it doesn't appear in unmapped expenses
          }
        }
      });

      setMappedItems(initialMappings);
      setIncomeMappings(initialIncomeMappings);
      
      toast.success(`Extrato processado! ${rawTxs.length} lançamentos carregados.`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Falha ao processar extrato.");
    } finally {
      setLoading(false);
    }
  };

  // Unlinked transactions list (Expenses only, which are not currently linked to any Excel item)
  const unmappedExpenses = useMemo(() => {
    // Collect all transaction IDs that are currently linked
    const linkedIds = new Set<string>();
    Object.values(mappedItems).forEach(val => {
      if (val.txId) linkedIds.add(val.txId);
    });
    customItems.forEach(item => {
      if (item.txId) linkedIds.add(item.txId);
    });
    // Add positive partner payouts if they are linked
    Object.keys(incomeMappings).forEach(txId => {
      // Check if it's a partner transaction (negative amount)
      const tx = allTransactions.find(t => t.id === txId);
      if (tx && tx.amount < 0 && incomeMappings[txId]) {
        linkedIds.add(txId);
      }
    });

    return allTransactions.filter(t => t.amount < 0 && !linkedIds.has(t.id));
  }, [allTransactions, mappedItems, customItems, incomeMappings]);

  // Positive transactions and partner payouts list
  const incomeAndPayouts = useMemo(() => {
    return allTransactions.filter(t => {
      if (t.amount >= 0) return true; // income
      
      // partner transfer (negative amount)
      const norm = t.description.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return norm.includes('ALEXANDRE') || norm.includes('STUART') || norm.includes('DANIEL') || norm.includes('PAULA');
    });
  }, [allTransactions]);

  // Link transaction to excel item
  const handleLinkTransaction = (itemKey: string, txId: string) => {
    if (!txId) return;
    const tx = allTransactions.find(t => t.id === txId);
    if (!tx) return;

    setMappedItems(prev => ({
      ...prev,
      [itemKey]: { txId: tx.id, manualValue: 0 }
    }));
    toast.success(`Lançamento "${tx.description}" vinculado com sucesso!`);
  };

  // Unlink transaction from excel item
  const handleUnlinkTransaction = (itemKey: string) => {
    setMappedItems(prev => ({
      ...prev,
      [itemKey]: { txId: null, manualValue: 0 }
    }));
    toast.info("Lançamento desvinculado e enviado para a caixa ao lado.");
  };

  // Update manual value for an excel item
  const handleManualValueChange = (itemKey: string, value: number) => {
    setMappedItems(prev => ({
      ...prev,
      [itemKey]: { ...prev[itemKey], manualValue: value }
    }));
  };

  // Update income/payout mapping responsible
  const handleUpdateIncomeResponsible = (txId: string, value: string) => {
    setIncomeMappings(prev => ({
      ...prev,
      [txId]: value
    }));
  };

  // Save all to Excel & DB
  const handleSaveAll = async () => {
    setSaving(true);
    toast.loading("Gravando dados e atualizando planilhas...", { id: 'save-conciliador' });

    // Build list of final formatted transactions to save
    const finalTransactions: any[] = [];
    const monthYearBB = `${month}${year}`;

    // 1. Process standard Excel Items
    EXCEL_ITEMS.forEach(item => {
      const mapping = mappedItems[item.key];
      if (!mapping) return;

      if (mapping.txId) {
        // Linked transaction
        const tx = allTransactions.find(t => t.id === mapping.txId);
        if (tx) {
          finalTransactions.push({
            date: tx.date,
            description: item.label, // Use friendly Excel name!
            amount: tx.amount, // Keep negative amount
            selectedFavorecido: 'Kinesis',
            costCategory: item.block
          });
        }
      } else if (mapping.manualValue > 0) {
        // Manual input
        const targetDate = `${2000 + parseInt(year)}-${String(months.indexOf(month) + 1).padStart(2, '0')}-15`;
        finalTransactions.push({
          date: targetDate,
          description: item.label,
          amount: -mapping.manualValue, // expense is negative
          selectedFavorecido: 'Kinesis',
          costCategory: item.block
        });
      }
    });

    // 2. Process Custom items
    customItems.forEach(item => {
      if (item.txId) {
        const tx = allTransactions.find(t => t.id === item.txId);
        if (tx) {
          finalTransactions.push({
            date: tx.date,
            description: item.label,
            amount: tx.amount,
            selectedFavorecido: 'Kinesis',
            costCategory: item.block
          });
        }
      } else if (item.value > 0) {
        const targetDate = `${2000 + parseInt(year)}-${String(months.indexOf(month) + 1).padStart(2, '0')}-15`;
        finalTransactions.push({
          date: targetDate,
          description: item.label,
          amount: -item.value,
          selectedFavorecido: 'Kinesis',
          costCategory: item.block
        });
      }
    });

    // 3. Process Incomes and Partner Adjustments
    incomeAndPayouts.forEach(tx => {
      const resp = incomeMappings[tx.id] || '';
      const isIncome = tx.amount >= 0;

      finalTransactions.push({
        date: tx.date,
        description: tx.description,
        amount: tx.amount,
        selectedFavorecido: resp,
        costCategory: isIncome ? 'Recebimento' : 'partner_adj'
      });
    });

    try {
      const res = await fetch('/api/financeiro/salvar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthYearBB,
          monthNameFin26: month,
          transactions: finalTransactions,
          saldoAnterior
        })
      });

      const data = await res.json();
      toast.dismiss('save-conciliador');

      if (!res.ok) throw new Error(data.error || "Falha na gravação.");

      toast.success(data.message, { duration: 5000 });
      router.push('/financeiro');
    } catch (err: any) {
      toast.dismiss('save-conciliador');
      console.error(err);
      toast.error(err.message || "Erro fatal ao salvar conciliação.");
    } finally {
      setSaving(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Helpers to get linked transaction details
  const getLinkedTx = (itemKey: string) => {
    const mapping = mappedItems[itemKey];
    if (!mapping || !mapping.txId) return null;
    return allTransactions.find(t => t.id === mapping.txId) || null;
  };

  // Render cost block table
  const renderBlockTable = (blockName: string, blockTitle: string) => {
    const items = EXCEL_ITEMS.filter(i => i.block === blockName);

    return (
      <div className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: '#f8fafc' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} color="var(--primary)" /> {blockTitle}
          </h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ padding: '12px 16px' }}>Item Excel</th>
                <th style={{ padding: '12px 16px', minWidth: '150px' }}>Lançamento Vinculado</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', width: '130px' }}>Valor (R$)</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', width: '80px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const linkedTx = getLinkedTx(item.key);
                const mapping = mappedItems[item.key] || { txId: null, manualValue: 0 };

                return (
                  <tr key={item.key} style={{ background: linkedTx ? '#f0fdf4' : 'transparent' }}>
                    <td style={{ fontWeight: '700', fontSize: '0.85rem', color: '#334155', padding: '12px 16px' }}>
                      {item.label}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {linkedTx ? (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0f172a' }}>{linkedTx.description}</span>
                          <span style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px' }}>Data: {linkedTx.date.split('-').reverse().slice(0,2).join('/')}</span>
                        </div>
                      ) : (
                        <select 
                          onChange={(e) => handleLinkTransaction(item.key, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            background: '#f8fafc',
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          <option value="">-- Buscar no Extrato --</option>
                          {unmappedExpenses.map(tx => (
                            <option key={tx.id} value={tx.id}>
                              ({tx.date.split('-').reverse().slice(0,2).join('/')}) - {tx.description.slice(0, 30)}... (R$ {Math.abs(tx.amount).toFixed(2)})
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {linkedTx ? (
                        <span style={{ fontWeight: '800', color: '#15803d', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                          R$ {Math.abs(linkedTx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0,00 (Manual)"
                          value={mapping.manualValue || ''}
                          onChange={(e) => handleManualValueChange(item.key, parseFloat(e.target.value) || 0)}
                          style={{
                            width: '100px',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.8rem',
                            fontWeight: '800',
                            textAlign: 'right',
                            outline: 'none'
                          }}
                        />
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {linkedTx && (
                        <button
                          onClick={() => handleUnlinkTransaction(item.key)}
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
                          }}
                        >
                          <Unlink size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container" style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button 
          onClick={() => router.back()} 
          style={{ padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}
        >
          <ArrowLeft size={18} />
        </button>
        <ReportHeader title="Reconciliador Bancário Kinesis (BB)" />
      </div>

      {/* STEP 1: STATEMENT UPLOADER */}
      {allTransactions.length === 0 && (
        <div className="card" style={{ padding: '40px', textAlign: 'center', border: '2px dashed #cbd5e1', background: dragActive ? '#f0fdf4' : 'white' }}
             onDragEnter={handleDrag}
             onDragOver={handleDrag}
             onDragLeave={handleDrag}
             onDrop={handleDrop}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: '#dcfce7', color: '#166534', padding: '20px', borderRadius: '50%' }}>
              <FileSpreadsheet size={48} />
            </div>
            
            <div style={{ maxWidth: '500px' }}>
              <h2 style={{ fontWeight: '800', fontSize: '1.5rem', color: '#0f172a' }}>Importar Extrato do BB</h2>
              <p style={{ color: '#475569', marginTop: '8px', fontSize: '0.95rem', fontWeight: '600' }}>
                Arraste a planilha do extrato bancário (.xlsx ou .csv) ou clique para procurar no computador.
              </p>
              <p style={{ color: '#64748b', marginTop: '6px', fontSize: '0.8rem', fontStyle: 'italic' }}>
                (Opção secundária: também suportamos o arquivo de extrato em formato .pdf)
              </p>
            </div>

            {/* Competency Period Selection */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px', background: '#f1f5f9', padding: '16px', borderRadius: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#475569', marginBottom: '4px', textAlign: 'left' }}>Mês</label>
                <select 
                  value={month} 
                  onChange={(e) => setMonth(e.target.value)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', fontWeight: '700' }}>
                  {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#475569', marginBottom: '4px', textAlign: 'left' }}>Ano</label>
                <select 
                  value={year} 
                  onChange={(e) => setYear(e.target.value)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', fontWeight: '700' }}>
                  <option value="24">2024</option>
                  <option value="25">2025</option>
                  <option value="26">2026</option>
                  <option value="27">2027</option>
                </select>
              </div>
            </div>

            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".xlsx,.xls,.csv,.pdf" 
              style={{ display: 'none' }} 
            />

            <div style={{ marginTop: '16px' }}>
              {file ? (
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '12px 24px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 color="#059669" size={18} />
                  <span style={{ fontWeight: '700', color: '#065f46' }}>{file.name}</span>
                  <button onClick={() => setFile(null)} style={{ marginLeft: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontSize: '0.8rem', textDecoration: 'underline' }}>Remover</button>
                </div>
              ) : (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-secondary" 
                  style={{ fontWeight: '700', padding: '12px 24px' }}
                >
                  Selecionar Arquivo do Computador
                </button>
              )}
            </div>

            {file && (
              <button 
                onClick={handleProcessStatement}
                disabled={loading}
                className="btn btn-primary" 
                style={{ marginTop: '24px', padding: '16px 40px', fontSize: '1.1rem', fontWeight: '800', gap: '8px' }}
              >
                {loading ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
                {loading ? 'Processando e Correlacionando...' : 'Iniciar Mapeamento Inteligente'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: INTERACTIVE DUAL VIEW */}
      {allTransactions.length > 0 && (
        <div style={{ display: 'flex', gap: '24px', position: 'relative' }}>
          
          {/* LEFT SIDE: EXCEL MAPPING FORMS (70% width) */}
          <div style={{ flex: '7', display: 'flex', flexDirection: 'column' }}>
            
            {/* Headers & Month Badge */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '20px',
              background: 'white',
              padding: '16px 24px',
              borderRadius: '16px',
              border: '1px solid var(--border-color)'
            }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#0f172a' }}>Dossiê de Conciliação — {month}/{year}</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Associe os lançamentos do extrato aos itens de faturamento e custo da clínica.</p>
              </div>
              <span style={{ 
                background: '#eff6ff', 
                color: 'var(--primary)', 
                padding: '6px 16px', 
                borderRadius: '30px', 
                fontWeight: '900', 
                fontSize: '0.8rem',
                border: '1px solid #bfdbfe' 
              }}>
                BB {month.toUpperCase()}{year}
              </span>
            </div>

            {/* Block Tables */}
            {renderBlockTable('geral', 'Gastos Gerais (Bloco A-C)')}
            {renderBlockTable('secretaria', 'Gastos Secretária (Bloco E-G)')}
            {renderBlockTable('kinesis', 'Gastos Kinesis (Bloco I-K)')}

            {/* CPFL Rooms Table */}
            <div className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: '24px' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: '#f8fafc' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1e293b' }}>CPFL das Salas Específicas (Fisio / Pilates)</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Sala</th>
                      <th>Lançamento Vinculado</th>
                      <th style={{ textAlign: 'right', width: '130px' }}>Valor</th>
                      <th style={{ textAlign: 'center', width: '80px' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['cpfl_sala_01', 'cpfl_sala_02', 'cpfl_sala_03', 'cpfl_sala_04', 'cpfl_sala_05', 'cpfl_sala_06'].map(key => {
                      const linkedTx = getLinkedTx(key);
                      const label = `CPFL sala 0${key.slice(-1)}${key === 'cpfl_sala_02' ? ' (Pilates)' : ''}`;
                      const mapping = mappedItems[key] || { txId: null, manualValue: 0 };

                      return (
                        <tr key={key} style={{ background: linkedTx ? '#f0fdf4' : 'transparent' }}>
                          <td style={{ fontWeight: '700', fontSize: '0.85rem', color: '#334155' }}>{label}</td>
                          <td>
                            {linkedTx ? (
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0f172a' }}>{linkedTx.description}</span>
                              </div>
                            ) : (
                              <select 
                                onChange={(e) => handleLinkTransaction(key, e.target.value)}
                                style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.75rem', fontWeight: '700', background: 'white' }}
                              >
                                <option value="">-- Buscar no Extrato --</option>
                                {unmappedExpenses.map(tx => (
                                  <option key={tx.id} value={tx.id}>
                                    ({tx.date.split('-').reverse().slice(0,2).join('/')}) - {tx.description.slice(0, 30)} (R$ {Math.abs(tx.amount).toFixed(2)})
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {linkedTx ? (
                              <span style={{ fontWeight: '800', color: '#15803d', fontSize: '0.85rem' }}>
                                R$ {Math.abs(linkedTx.amount).toFixed(2)}
                              </span>
                            ) : (
                              <input 
                                type="number" 
                                step="0.01"
                                placeholder="0,00" 
                                value={mapping.manualValue || ''}
                                onChange={(e) => handleManualValueChange(key, parseFloat(e.target.value) || 0)}
                                style={{ width: '100px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: '800', textAlign: 'right' }}
                              />
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {linkedTx && (
                              <button onClick={() => handleUnlinkTransaction(key)} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}>
                                <Unlink size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Positive transactions & Partner Adjustments (Income / Payout allocations) */}
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: '#f8fafc' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1e293b' }}>
                  Entradas e Repasses Financeiros (Banco do Brasil)
                </h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '90px' }}>Data</th>
                      <th>Lançamento do Extrato</th>
                      <th style={{ width: '110px', textAlign: 'right' }}>Valor (R$)</th>
                      <th style={{ minWidth: '180px' }}>Responsável (Favorecido)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomeAndPayouts.map(tx => {
                      const resp = incomeMappings[tx.id] || '';
                      const isIncome = tx.amount >= 0;

                      return (
                        <tr key={tx.id} style={{ background: resp ? '#f0fdf4' : '#fff1f2' }}>
                          <td style={{ fontSize: '0.8rem', fontWeight: '600' }}>{tx.date.split('-').reverse().slice(0,2).join('/')}</td>
                          <td style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155' }}>{tx.description}</td>
                          <td style={{ 
                            textAlign: 'right', 
                            fontWeight: '800', 
                            fontSize: '0.85rem', 
                            color: isIncome ? '#15803d' : '#b91c1c'
                          }}>
                            R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td>
                            <select
                              value={resp}
                              onChange={(e) => handleUpdateIncomeResponsible(tx.id, e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: `2px solid ${!resp ? '#f87171' : '#cbd5e1'}`,
                                fontWeight: '800',
                                fontSize: '0.8rem',
                                background: 'white'
                              }}
                            >
                              <option value="">-- Selecione o Responsável --</option>
                              {allowedFavorecidos.map(fav => (
                                <option key={fav} value={fav}>{fav}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* RIGHT SIDE: UNMAPPED TRANSACTIONS BOX (30% width, Sticky Sidebar) */}
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
                  {unmappedExpenses.length} itens
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
                {unmappedExpenses.map(tx => (
                  <div key={tx.id} style={{ 
                    background: '#f8fafc', 
                    border: '1.5px solid #e2e8f0', 
                    borderRadius: '12px', 
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'all 0.2s'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#64748b' }}>{tx.date.split('-').reverse().join('/')}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '950', color: '#b91c1c', whiteSpace: 'nowrap' }}>
                        R$ {Math.abs(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: '750', color: '#1e293b', lineHeight: '1.4' }}>{tx.description}</span>
                    {tx.document && (
                      <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Doc: {tx.document}</span>
                    )}
                  </div>
                ))}

                {unmappedExpenses.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 16px', color: '#94a3b8' }}>
                    <CheckCircle2 color="#10b981" size={32} style={{ margin: '0 auto 12px' }} />
                    <p style={{ fontSize: '0.8rem', fontWeight: '800' }}>Tudo classificado!</p>
                    <p style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '2px' }}>Todas as despesas do extrato foram associadas.</p>
                  </div>
                )}
              </div>

              {/* SAVE FOOTER */}
              <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '16px', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="btn btn-primary"
                  style={{ 
                    width: '100%', 
                    padding: '16px', 
                    fontWeight: '900', 
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  {saving ? 'Gravando e Sincronizando...' : 'CONCLUIR CONCILIAÇÃO'}
                </button>
                <button 
                  onClick={() => {
                    if (confirm("Deseja realmente cancelar? Toda a vinculação atual será perdida.")) {
                      setAllTransactions([]);
                      setFile(null);
                    }
                  }}
                  style={{ 
                    fontSize: '0.75rem', 
                    color: '#991b1b', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    fontWeight: '800',
                    textDecoration: 'underline'
                  }}
                >
                  Reiniciar e Limpar Tudo
                </button>
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
}
