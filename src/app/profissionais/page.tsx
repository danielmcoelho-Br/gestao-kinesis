"use client";

import { useState, useEffect } from "react";
import { usePeriod } from "@/context/PeriodContext";


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

export default function ProfissionaisPage() {
  const { month, year } = usePeriod();
  const [profissionais, setProfissionais] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [defaultPercentage, setDefaultPercentage] = useState<number>(50);
  const [serviceRules, setServiceRules] = useState<ServiceRule[]>([]);
  const [newServiceCode, setNewServiceCode] = useState("");
  const [newServicePercentage, setNewServicePercentage] = useState<number>(50);

  const handleReprocess = async () => {
    if (!confirm(`Deseja recalcular todos os repasses para ${monthsNames[month]} de ${year}? Isso aplicará as regras vigentes na data de cada sessão para TODOS os atendimentos deste mês.`)) return;
    setLoading(true);
    try {
      const res = await fetch('/api/stats/reprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year })
      });
      if (res.ok) {
        alert(`Processamento concluído para ${monthsNames[month]}/${year}! Os valores foram atualizados.`);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const [isNewRule, setIsNewRule] = useState(false);
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);

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
    <div>
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>Configuração de Profissionais</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Cadastre os profissionais e suas regras de repasse (porcentagem).</p>
        </div>

        <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid var(--primary)', borderRadius: '12px', textAlign: 'right' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px' }}>Manutenção de Atendimentos</p>
          <button 
            onClick={handleReprocess} 
            className="btn" 
            disabled={loading}
            style={{ background: 'var(--primary)', color: 'white' }}
          >
            {loading ? "Processando..." : `Recalcular ${monthsNames[month]}/${year}`}
          </button>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '300px' }}>
            Use este botão para aplicar as novas porcentagens retroativamente aos atendimentos do mês selecionado.
          </p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Formulário */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h3>{editingId ? "Editar Profissional" : "Novo Profissional"}</h3>
          <form onSubmit={handleSubmit} style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Nome do Profissional</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                required 
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Porcentagem Padrão (%)</label>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Essa porcentagem será aplicada para todos os códigos que não tiverem uma regra específica.</p>
              <input 
                type="number" 
                value={defaultPercentage} 
                onChange={(e) => setDefaultPercentage(Number(e.target.value))} 
                min="0" max="100"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
              />
            </div>

            <div style={{ padding: '16px', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ marginBottom: '12px' }}>Regras Específicas por Código</h4>
              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input 
                  type="text" 
                  placeholder="Código (ex: PILATES)" 
                  value={newServiceCode}
                  onChange={(e) => setNewServiceCode(e.target.value)}
                  style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                />
                <input 
                  type="number" 
                  placeholder="%" 
                  value={newServicePercentage}
                  onChange={(e) => setNewServicePercentage(Number(e.target.value))}
                  min="0" max="100"
                  style={{ width: '70px', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                />
                <button type="button" onClick={handleAddRule} className="btn" style={{ padding: '8px 16px' }}>Add</button>
              </div>

              {serviceRules.length > 0 && (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {serviceRules.map((rule, idx) => (
                    <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid var(--border-color)' }}>
                      <span>{rule.serviceCode}</span>
                      <span>{Math.round(rule.percentage * 100)}% <button type="button" onClick={() => handleRemoveRule(idx)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', marginLeft: '12px' }}>X</button></span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {editingId && (
              <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '600', color: 'var(--primary)' }}>
                  <input 
                    type="checkbox" 
                    checked={isNewRule} 
                    onChange={(e) => setIsNewRule(e.target.checked)} 
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span>📅 Iniciar nova vigência (Histórico)</span>
                </label>
                
                {isNewRule && (
                  <div style={{ marginTop: '12px' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>A partir de qual data estas novas porcentagens passam a valer?</p>
                    <input 
                      type="date" 
                      value={effectiveDate} 
                      onChange={(e) => setEffectiveDate(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn" style={{ flex: 1 }}>{editingId ? "Salvar Alterações" : "Salvar Profissional"}</button>
              {editingId && (
                <button type="button" onClick={handleCancelEdit} style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'transparent' }}>Cancelar</button>
              )}
            </div>
          </form>
        </div>

        {/* Lista de Profissionais */}
        <div className="card">
          <h3>Profissionais Cadastrados</h3>
          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {profissionais.map((prof) => (
              <div key={prof.id} style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--surface-color)', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ color: 'var(--primary)', marginBottom: '8px' }}>{prof.name}</h4>
                    <p><strong>Padrão:</strong> {Math.round(prof.defaultPercentage * 100)}%</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleEdit(prof)}
                      style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDelete(prof.id)}
                      style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
                
                {prof.serviceRules.length > 0 && (
                  <div style={{ marginTop: '12px', padding: '8px', background: 'var(--bg-color)', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Regras Específicas:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {prof.serviceRules.map((r, i) => (
                        <span key={i} style={{ fontSize: '0.75rem', background: 'var(--surface-color)', padding: '2px 8px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                          {r.serviceCode}: {Math.round(r.percentage * 100)}%
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {profissionais.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                Nenhum profissional cadastrado ainda.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
