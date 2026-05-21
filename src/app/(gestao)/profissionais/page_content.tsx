"use client";

import { useState, useEffect } from "react";
import { usePeriod } from "@/gestao/context/PeriodContext";
import { RefreshCw, UserPlus, Edit3, Trash2, Calendar, Settings } from "lucide-react";

interface ServiceRule {
  serviceCode: string;
  percentage: number;
}

interface Professional {
  id: string;
  name: string;
  role: string;
  defaultPercentage: number;
  serviceRules: ServiceRule[];
}

const monthsNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function ProfissionaisPageContent() {
  const { startMonth, startYear } = usePeriod();
  const [profissionais, setProfissionais] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [defaultPercentage, setDefaultPercentage] = useState<number>(50);
  const [serviceRules, setServiceRules] = useState<ServiceRule[]>([]);
  const [newServiceCode, setNewServiceCode] = useState("");
  const [newServicePercentage, setNewServicePercentage] = useState<number>(50);
  const [isNewRule, setIsNewRule] = useState(false);
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);

  const handleReprocess = async () => {
    if (!confirm(`Deseja recalcular todos os repasses para ${monthsNames[startMonth]} de ${startYear}? Isso aplicará as regras vigentes na data de cada sessão para TODOS os atendimentos deste mês.`)) return;
    setLoading(true);
    try {
      const res = await fetch('/api/stats/reprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: startMonth, year: startYear })
      });
      if (res.ok) {
        alert(`Processamento concluído para ${monthsNames[startMonth]}/${startYear}! Os valores foram atualizados.`);
      }
    } catch (e) {
      alert("Erro ao recalcular.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfissionais = async () => {
    try {
      const res = await fetch("/api/profissionais");
      if (res.ok) {
        const data = await res.json();
        setProfissionais(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProfissionais();
  }, []);

  const handleAddRule = () => {
    if (!newServiceCode) return;
    setServiceRules([...serviceRules, { serviceCode: newServiceCode, percentage: newServicePercentage / 100 }]);
    setNewServiceCode("");
    setNewServicePercentage(50);
  };

  const handleRemoveRule = (index: number) => {
    setServiceRules(serviceRules.filter((_, i) => i !== index));
  };

  const handleEdit = (prof: Professional) => {
    setEditingId(prof.id);
    setName(prof.name);
    setDefaultPercentage(prof.defaultPercentage * 100);
    setServiceRules(prof.serviceRules);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este profissional? Todos os atendimentos vinculados serão afetados.")) return;
    try {
      const res = await fetch(`/api/profissionais/${id}`, { method: "DELETE" });
      if (res.ok) fetchProfissionais();
    } catch (error) {
      console.error("Erro ao excluir profissional:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setDefaultPercentage(50);
    setServiceRules([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const payload = {
      name,
      defaultPercentage: defaultPercentage / 100,
      serviceRules,
      effectiveDate: isNewRule ? effectiveDate : null
    };

    try {
      const url = editingId ? `/api/profissionais/${editingId}` : "/api/profissionais";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        handleCancelEdit();
        fetchProfissionais();
        setIsNewRule(false);
      }
    } catch (error) {
      console.error("Erro ao salvar profissional:", error);
    }
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button 
          onClick={handleReprocess} 
          className="btn" 
          disabled={loading}
          style={{ 
            background: 'linear-gradient(135deg, var(--primary) 0%, #2563eb 100%)', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
          }}
        >
          {loading ? <RefreshCw className="animate-spin" size={18} /> : <RefreshCw size={18} />}
          Recalcular {monthsNames[startMonth]}/{startYear}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <UserPlus color="var(--primary)" size={24} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>{editingId ? "Editar Profissional" : "Novo Profissional"}</h2>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px' }}>NOME DO PROFISSIONAL</label>
              <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px' }}>PORCENTAGEM PADRÃO (%)</label>
              <input type="number" className="input" value={defaultPercentage} onChange={(e) => setDefaultPercentage(Number(e.target.value))} min="0" max="100" />
            </div>

            <div style={{ padding: '20px', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ marginBottom: '16px', fontSize: '0.9rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={16} /> Regras Específicas por Código
              </h4>
              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input type="text" className="input" placeholder="CÓDIGO" value={newServiceCode} onChange={(e) => setNewServiceCode(e.target.value)} style={{ flex: 1 }} />
                <input type="number" className="input" placeholder="%" value={newServicePercentage} onChange={(e) => setNewServicePercentage(Number(e.target.value))} min="0" max="100" style={{ width: '80px' }} />
                <button type="button" onClick={handleAddRule} className="btn" style={{ padding: '0 16px' }}>Add</button>
              </div>

              {serviceRules.length > 0 && (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {serviceRules.map((rule, idx) => (
                    <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>{rule.serviceCode}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{Math.round(rule.percentage * 100)}%</span>
                        <button type="button" onClick={() => handleRemoveRule(idx)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {editingId && (
              <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '700', color: 'var(--primary)', fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={isNewRule} onChange={(e) => setIsNewRule(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                  <span>📅 INICIAR NOVA VIGÊNCIA (HISTÓRICO)</span>
                </label>
                {isNewRule && (
                  <div style={{ marginTop: '12px' }}>
                    <input type="date" className="input" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn" style={{ flex: 1, background: 'var(--primary)', color: 'white' }}>{editingId ? "Salvar Alterações" : "Salvar Profissional"}</button>
              {editingId && (
                <button type="button" onClick={handleCancelEdit} className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)' }}>Cancelar</button>
              )}
            </div>
          </form>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <Calendar color="var(--primary)" size={24} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Profissionais Cadastrados</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {profissionais.map((prof) => (
              <div key={prof.id} style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '16px', background: 'var(--surface-color)', position: 'relative', transition: 'all 0.2s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ color: 'var(--primary)', fontWeight: '800', marginBottom: '4px' }}>{prof.name}</h4>
                    <p style={{ fontSize: '0.85rem' }}><strong>Padrão:</strong> {Math.round(prof.defaultPercentage * 100)}%</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEdit(prof)} style={{ padding: '8px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer' }}><Edit3 size={16} /></button>
                    <button onClick={() => handleDelete(prof.id)} style={{ padding: '8px', borderRadius: '10px', border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </div>
                </div>
                {prof.serviceRules.length > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {prof.serviceRules.map((r, i) => (
                      <span key={i} style={{ fontSize: '0.7rem', background: '#f1f5f9', padding: '4px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontWeight: '700', color: '#475569' }}>
                        {r.serviceCode}: {Math.round(r.percentage * 100)}%
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
