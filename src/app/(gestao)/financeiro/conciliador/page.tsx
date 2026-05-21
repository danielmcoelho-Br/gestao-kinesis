"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ReportHeader } from '@/gestao/components/ReportHeader';
import { 
  Upload, ArrowLeft, CheckCircle2, HelpCircle, Split, Trash2, Save, 
  FileSpreadsheet, Loader2, DollarSign, Sparkles, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface UIClientTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  document: string;
  suggestedFavorecido: string | null;
  selectedFavorecido: string;
  costCategory?: 'geral' | 'secretaria' | 'kinesis';
  isMatched: boolean;
}

export default function ConciliadorPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [month, setMonth] = useState<string>("Maio");
  const [year, setYear] = useState<string>("26"); // In Gestão BB format (e.g., "26" for Maio26)
  
  const [transactions, setTransactions] = useState<UIClientTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const allowedFavorecidos = ["Kinesis", "Daniel", "Stuart", "Paula", "Pilates", "Curso"];

  // --- DRAG & DROP AND UPLOAD LOGIC ---
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

      setTransactions(data.transactions);
      toast.success(`Extrato processado! ${data.transactionsCount} transações carregadas.`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Falha ao processar extrato.");
    } finally {
      setLoading(false);
    }
  };

  // --- TRANSACTION GRID LOGIC ---
  const handleUpdateFavorecido = (id: string, value: string) => {
    setTransactions(transactions.map(t => 
      t.id === id ? { ...t, selectedFavorecido: value, isMatched: !!value } : t
    ));
  };

  const handleUpdateCostCategory = (id: string, value: any) => {
    setTransactions(transactions.map(t => 
      t.id === id ? { ...t, costCategory: value } : t
    ));
  };

  const handleUpdateAmount = (id: string, valueStr: string) => {
    const num = parseFloat(valueStr) || 0;
    setTransactions(transactions.map(t => 
      t.id === id ? { ...t, amount: num } : t
    ));
  };

  const handleRemoveTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const handleSplitTransaction = (id: string) => {
    const targetIndex = transactions.findIndex(t => t.id === id);
    if (targetIndex === -1) return;
    
    const original = transactions[targetIndex];
    const halfVal = Number((original.amount / 2).toFixed(2));

    // 1. Update original entry to half amount
    const updatedList = [...transactions];
    updatedList[targetIndex] = {
      ...original,
      amount: halfVal
    };

    // 2. Insert cloned entry below with half amount
    const clone: UIClientTransaction = {
      ...original,
      id: `${original.id}_split_${Date.now()}`,
      amount: halfVal,
      selectedFavorecido: '', // Let user select the second professional
      isMatched: false,
      description: `${original.description} (Rateio)`
    };

    updatedList.splice(targetIndex + 1, 0, clone);
    setTransactions(updatedList);
    toast.info("Lançamento dividido com sucesso. Ajuste os valores!");
  };

  const handleSaveToExcel = async () => {
    // Ensure all transactions have an assigned favored entity
    const missingCount = transactions.filter(t => !t.selectedFavorecido && !t.suggestedFavorecido).length;
    if (missingCount > 0) {
      if (!confirm(`Atenção: Existem ${missingCount} transações sem Responsável Financeiro selecionado. Deseja continuar assim mesmo? Elas ficarão vazias na planilha.`)) {
        return;
      }
    }

    setSaving(true);
    toast.loading("Atualizando planilhas e salvando no Banco...", { id: 'save-fin' });

    const monthYearBB = `${month}${year}`; // e.g. Maio26
    
    try {
      const res = await fetch('/api/financeiro/salvar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthYearBB,
          monthNameFin26: month,
          transactions
        })
      });

      const data = await res.json();
      toast.dismiss('save-fin');

      if (!res.ok) throw new Error(data.error || "Falha na persistência.");

      toast.success(data.message, { duration: 5000 });
      
      // Clear state and go back or review
      setTransactions([]);
      setFile(null);
      router.push('/financeiro');
    } catch (error: any) {
      toast.dismiss('save-fin');
      console.error(error);
      toast.error(error.message || "Erro fatal ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  // --- CALCULATORS FOR DASHBOARD STATS ---
  const professionalTotals = allowedFavorecidos.reduce((acc, fav) => {
    acc[fav] = transactions
      .filter(t => (t.selectedFavorecido || t.suggestedFavorecido) === fav)
      .reduce((sum, t) => sum + t.amount, 0);
    return acc;
  }, {} as Record<string, number>);

  const unmappedCount = transactions.filter(t => !t.selectedFavorecido && !t.suggestedFavorecido).length;

  return (
    <div className="dashboard-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button 
          onClick={() => router.back()} 
          style={{ padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}
        >
          <ArrowLeft size={18} />
        </button>
        <ReportHeader title="Conciliador Inteligente Banco do Brasil" />
      </div>

      {/* STEP 1: UPLOADER PANEL */}
      {transactions.length === 0 && (
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
              <p style={{ color: '#64748b', marginTop: '8px', fontSize: '0.9rem' }}>
                Arraste seu extrato bancário exportado do Banco do Brasil (.xlsx ou .csv) ou clique para procurar no computador.
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
              accept=".xlsx,.xls,.csv" 
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

      {/* STEP 2: INTERACTIVE GRID PANEL */}
      {transactions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Mini Metrics Panel */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            <div className="card" style={{ padding: '12px', background: '#f8fafc', borderLeft: '4px solid #3b82f6' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Aba Gerada BB</span>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '900', marginTop: '4px' }}>{month}{year}</h4>
            </div>

            {allowedFavorecidos.map(fav => (
              <div key={fav} className="card" style={{ padding: '12px', background: '#fdfdfd' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>{fav}</span>
                <h4 style={{ 
                  fontSize: '1rem', 
                  fontWeight: '900', 
                  marginTop: '4px',
                  color: professionalTotals[fav] >= 0 ? '#15803d' : '#b91c1c'
                }}>
                  R$ {professionalTotals[fav].toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h4>
              </div>
            ))}
          </div>

          {unmappedCount > 0 && (
            <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', color: '#92400e', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertCircle size={24} />
              <div>
                <h4 style={{ fontWeight: '800' }}>Existem {unmappedCount} lançamentos pendentes!</h4>
                <p style={{ fontSize: '0.85rem' }}>Alguns nomes de depósitos não foram localizados no histórico. Por favor, selecione o responsável manualmente nas caixas em vermelho.</p>
              </div>
            </div>
          )}

          {/* Grid Card */}
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: '800', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#eab308" /> Lançamentos do Extrato
              </h3>
              <button 
                onClick={() => {
                  if(confirm("Deseja mesmo cancelar a conciliação atual?")) {
                    setTransactions([]);
                    setFile(null);
                  }
                }} 
                style={{ fontSize: '0.75rem', color: '#991b1b', background: 'none', border: 'none', cursor: 'pointer' }}>
                Reiniciar Processo
              </button>
            </div>

            <div style={{ overflowX: 'auto', maxHeight: '500px' }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead style={{ position: 'sticky', top: '0', background: '#f8fafc', zIndex: 5 }}>
                  <tr>
                    <th style={{ width: '100px' }}>Data</th>
                    <th>Histórico Bancário</th>
                    <th style={{ width: '120px' }}>Valor R$</th>
                    <th style={{ minWidth: '180px' }}>Responsável Financeiro (BB)</th>
                    <th>Rateio Custo (Financeiro 26)</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => {
                    const selected = t.selectedFavorecido || t.suggestedFavorecido || '';
                    const isIncome = t.amount >= 0;
                    
                    return (
                      <tr key={t.id} style={{ 
                        background: !selected ? '#fff1f2' : (t.isMatched ? '#f0fdf4' : 'white'),
                        transition: 'background 0.2s'
                      }}>
                        <td style={{ fontWeight: '600', fontSize: '0.85rem' }}>
                          {t.date.split('-').reverse().join('/')}
                        </td>
                        <td style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155' }}>
                          {t.description}
                        </td>
                        <td>
                          <input 
                            type="number" 
                            step="0.01"
                            value={t.amount}
                            onChange={(e) => handleUpdateAmount(t.id, e.target.value)}
                            style={{ 
                              width: '100px', 
                              padding: '4px 8px', 
                              borderRadius: '6px', 
                              border: '1px solid #cbd5e1',
                              fontWeight: '800',
                              textAlign: 'right',
                              color: isIncome ? '#15803d' : '#b91c1c',
                              background: 'white'
                            }}
                          />
                        </td>
                        <td>
                          <select 
                            value={selected}
                            onChange={(e) => handleUpdateFavorecido(t.id, e.target.value)}
                            style={{ 
                              width: '100%', 
                              padding: '6px 12px', 
                              borderRadius: '8px', 
                              border: `2px solid ${!selected ? '#f87171' : '#cbd5e1'}`,
                              fontWeight: '800',
                              fontSize: '0.8rem',
                              background: selected ? 'white' : '#fef2f2'
                            }}
                          >
                            <option value="">-- Selecione o Responsável --</option>
                            {allowedFavorecidos.map(fav => (
                              <option key={fav} value={fav}>{fav}</option>
                            ))}
                          </select>
                          {t.isMatched && !t.selectedFavorecido && (
                            <span style={{ fontSize: '0.65rem', color: '#059669', fontWeight: '700', marginTop: '2px', display: 'block' }}>
                              ✨ Sugestão do histórico
                            </span>
                          )}
                        </td>
                        <td>
                          {!isIncome && selected.toUpperCase() === 'KINESIS' ? (
                            <select 
                              value={t.costCategory || 'geral'}
                              onChange={(e) => handleUpdateCostCategory(t.id, e.target.value)}
                              style={{
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                width: '100%',
                                background: '#eff6ff',
                                color: '#1e40af'
                              }}
                            >
                              <option value="geral">Gastos Gerais (Bloco A-C)</option>
                              <option value="secretaria">Gastos Secretária (Bloco E-G)</option>
                              <option value="kinesis">Gastos Kinesis (Bloco I-K)</option>
                            </select>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                              {isIncome ? 'N/A (Entrada)' : 'Não aplica (Não é Kinesis)'}
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button 
                              onClick={() => handleSplitTransaction(t.id)}
                              title="Dividir Lançamento entre 2 ou mais"
                              style={{ padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', color: '#1e40af', cursor: 'pointer' }}>
                              <Split size={14} />
                            </button>
                            <button 
                              onClick={() => handleRemoveTransaction(t.id)}
                              title="Excluir do envio"
                              style={{ padding: '6px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fef2f2', color: '#991b1b', cursor: 'pointer' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Action Footer Toolbar */}
            <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '700' }}>
                Total a Processar: {transactions.length} lançamentos
              </div>
              
              <button 
                onClick={handleSaveToExcel}
                disabled={saving}
                className="btn btn-primary"
                style={{ 
                  padding: '16px 36px', 
                  fontWeight: '900', 
                  fontSize: '1rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)' 
                }}
              >
                {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                {saving ? 'Gravando arquivos Excel...' : 'GRAVAR NAS PLANILHAS & SINCRONIZAR'}
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
