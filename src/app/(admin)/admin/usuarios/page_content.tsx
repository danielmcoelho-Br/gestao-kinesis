"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, Shield, User, Trash2, Mail, Loader2, Save, Edit3, X, Settings } from "lucide-react";

interface ServiceRule {
  serviceCode: string;
  percentage: number;
}

export default function UsuariosPageContent() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "SECRETARIA",
    defaultPercentage: 50,
  });

  // Specific service rules state
  const [serviceRules, setServiceRules] = useState<ServiceRule[]>([]);
  const [newServiceCode, setNewServiceCode] = useState("");
  const [newServicePercentage, setNewServicePercentage] = useState<number>(50);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(data);
    } catch (err: any) {
      setError("Erro ao carregar usuários: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddRule = () => {
    if (!newServiceCode) return;
    // Check if rule already exists
    const codeUpper = newServiceCode.toUpperCase().trim();
    if (serviceRules.some(r => r.serviceCode === codeUpper)) {
      alert("Esta regra já foi adicionada!");
      return;
    }
    setServiceRules([...serviceRules, { serviceCode: codeUpper, percentage: newServicePercentage / 100 }]);
    setNewServiceCode("");
    setNewServicePercentage(50);
  };

  const handleRemoveRule = (index: number) => {
    setServiceRules(serviceRules.filter((_, i) => i !== index));
  };

  const handleEditClick = (u: any) => {
    setIsEditing(true);
    setEditingId(u.id);
    setFormData({
      name: u.name,
      email: u.email,
      password: "", // Keep empty to avoid changing unless typed
      role: u.role,
      defaultPercentage: u.defaultPercentage !== null ? Math.round(u.defaultPercentage * 100) : 50,
    });
    setServiceRules(u.serviceRules || []);
    setError("");
    setSuccess("");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({ name: "", email: "", password: "", role: "SECRETARIA", defaultPercentage: 50 });
    setServiceRules([]);
    setError("");
    setSuccess("");
  };

  const handleDeleteClick = async (u: any) => {
    if (!confirm(`Tem certeza de que deseja excluir o usuário "${u.name}"? Se for um Fisioterapeuta, todas as suas regras de repasse também serão excluídas.`)) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setSuccess("Usuário removido com sucesso!");
      fetchUsers();
    } catch (err: any) {
      setError("Erro ao excluir usuário: " + err.message);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    setSuccess("");

    // Prepare payload
    const payload: any = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
    };

    if (formData.password) {
      payload.password = formData.password;
    } else if (!isEditing) {
      setError("A senha é obrigatória para novos usuários.");
      setFormLoading(false);
      return;
    }

    if (formData.role === "FISIOTERAPEUTA") {
      payload.defaultPercentage = formData.defaultPercentage / 100;
      payload.serviceRules = serviceRules;
    }

    try {
      const url = isEditing ? `/api/admin/users/${editingId}` : "/api/admin/users";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(isEditing ? "Usuário atualizado com sucesso!" : "Usuário cadastrado com sucesso!");
      handleCancelEdit();
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}><Loader2 className="animate-spin" /> Carregando...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '30px', marginTop: '20px' }}>
      
      {/* Formulário Unificado */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserPlus color="var(--primary)" size={24} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>
              {isEditing ? "Editar Membro" : "Novo Membro"}
            </h2>
          </div>
          {isEditing && (
            <button 
              onClick={handleCancelEdit} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              title="Cancelar Edição"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px' }}>NOME COMPLETO</label>
            <input className="input" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Ex: Marcelo Felipe" style={{ width: '100%' }} />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px' }}>E-MAIL</label>
            <input className="input" type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="marcelo@kinesis.com.br" style={{ width: '100%' }} />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px' }}>
              {isEditing ? "SENHA (DEIXE EM BRANCO PARA MANTER)" : "SENHA INICIAL"}
            </label>
            <input className="input" type="password" required={!isEditing} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder={isEditing ? "••••••••" : "Nova senha"} style={{ width: '100%' }} />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px' }}>FUNÇÃO (PERFIL)</label>
            <select className="input" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} style={{ padding: '10px', width: '100%', borderRadius: '8px' }}>
              <option value="SECRETARIA">Secretária</option>
              <option value="FISIOTERAPEUTA">Fisioterapeuta</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          {/* Configurações exclusivas para Fisioterapeuta */}
          {formData.role === "FISIOTERAPEUTA" && (
            <div style={{ 
              marginTop: '10px',
              padding: '20px', 
              background: 'rgba(99, 102, 241, 0.03)', 
              borderRadius: '16px', 
              border: '1px solid rgba(99, 102, 241, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={16} /> Configurações de Repasse
              </h4>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  PORCENTAGEM PADRÃO (%)
                </label>
                <input 
                  type="number" 
                  className="input" 
                  value={formData.defaultPercentage} 
                  onChange={(e) => setFormData({...formData, defaultPercentage: Number(e.target.value)})} 
                  min="0" 
                  max="100" 
                  style={{ width: '100%' }} 
                />
              </div>

              <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  REGRAS POR CÓDIGO (EXCEÇÕES)
                </label>
                
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="Código (ex: RPG)" 
                    value={newServiceCode} 
                    onChange={(e) => setNewServiceCode(e.target.value)} 
                    style={{ flex: 1, fontSize: '0.85rem' }} 
                  />
                  <input 
                    type="number" 
                    className="input" 
                    placeholder="%" 
                    value={newServicePercentage} 
                    onChange={(e) => setNewServicePercentage(Number(e.target.value))} 
                    min="0" 
                    max="100" 
                    style={{ width: '70px', fontSize: '0.85rem' }} 
                  />
                  <button 
                    type="button" 
                    onClick={handleAddRule} 
                    className="btn" 
                    style={{ padding: '0 14px', background: 'var(--primary)', color: 'white', fontSize: '0.8rem', borderRadius: '8px' }}
                  >
                    Add
                  </button>
                </div>

                {serviceRules.length > 0 && (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {serviceRules.map((rule, idx) => (
                      <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'white', borderRadius: '8px', border: '1px solid #f1f5f9', fontSize: '0.8rem' }}>
                        <span style={{ fontWeight: '700' }}>{rule.serviceCode}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontWeight: '800', color: 'var(--primary)' }}>{Math.round(rule.percentage * 100)}%</span>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveRule(idx)} 
                            style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: '600' }}>{error}</div>}
          {success && <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: '600' }}>{success}</div>}
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="submit" className="btn" disabled={formLoading} style={{ flex: 1, background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {formLoading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> {isEditing ? "Salvar Alterações" : "Cadastrar Membro"}</>}
            </button>
            {isEditing && (
              <button type="button" onClick={handleCancelEdit} className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Lista Unificada de Membros */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <Users color="var(--primary)" size={24} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Membros da Equipe</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Membro</th>
                <th>Perfil</th>
                <th>E-mail</th>
                <th>Repasse (Comissão)</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isUserFisio = u.role === 'FISIOTERAPEUTA';
                const isUserAdmin = ['ADMIN', 'ADMINISTRADOR', 'ADMINISTRATOR'].includes(String(u.role || '').toUpperCase());
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={16} color="#64748b" />
                        </div>
                        <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{u.name}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '8px', 
                        fontSize: '0.65rem', 
                        fontWeight: '800', 
                        background: isUserAdmin ? '#fee2e2' : u.role === 'FISIOTERAPEUTA' ? '#e0e7ff' : '#f1f5f9', 
                        color: isUserAdmin ? '#ef4444' : u.role === 'FISIOTERAPEUTA' ? '#4f46e5' : '#64748b', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px', 
                        width: 'fit-content' 
                      }}>
                        {isUserAdmin ? <Shield size={12} /> : <User size={12} />}
                        {u.role}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{u.email}</td>
                    <td>
                      {isUserFisio ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                            Padrão: <span style={{ color: 'var(--primary)' }}>{Math.round(u.defaultPercentage * 100)}%</span>
                          </span>
                          {u.serviceRules && u.serviceRules.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {u.serviceRules.map((rule: any, idx: number) => (
                                <span key={idx} style={{ fontSize: '0.65rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '6px', fontWeight: '700', color: '#475569' }}>
                                  {rule.serviceCode}: {Math.round(rule.percentage * 100)}%
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#cbd5e1' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleEditClick(u)} 
                          style={{ padding: '8px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Editar Membro"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(u)} 
                          style={{ padding: '8px', borderRadius: '10px', border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Excluir Membro"
                        >
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
      </div>

    </div>
  );
}
