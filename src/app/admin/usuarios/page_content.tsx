"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, Shield, User, Trash2, Mail, Loader2, Save } from "lucide-react";

export default function UsuariosPageContent() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "SECRETARIA"
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess("Usuário cadastrado com sucesso!");
      setFormData({ name: "", email: "", password: "", role: "SECRETARIA" });
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}><Loader2 className="animate-spin" /> Carregando...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px', marginTop: '20px' }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <UserPlus color="var(--primary)" size={24} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Novo Usuário</h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px' }}>NOME COMPLETO</label>
            <input className="input" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Ex: Maria Oliveira" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px' }}>E-MAIL</label>
            <input className="input" type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="maria@kinesis.com.br" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px' }}>SENHA INICIAL</label>
            <input className="input" type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px' }}>FUNÇÃO (PERFIL)</label>
            <select className="input" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} style={{ padding: '10px', width: '100%' }}>
              <option value="SECRETARIA">Secretária</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
          {error && <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</div>}
          {success && <div style={{ color: '#10b981', fontSize: '0.85rem' }}>{success}</div>}
          <button type="submit" className="btn" disabled={formLoading} style={{ background: 'var(--primary)', color: 'white', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {formLoading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Cadastrar Usuário</>}
          </button>
        </form>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <Users color="var(--primary)" size={24} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Usuários Ativos</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Perfil</th>
                <th>E-mail</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={16} color="#64748b" />
                      </div>
                      <span style={{ fontWeight: '600' }}>{u.name}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '800', background: u.role === 'ADMIN' ? '#fee2e2' : '#f1f5f9', color: u.role === 'ADMIN' ? '#ef4444' : '#64748b', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                      {u.role === 'ADMIN' ? <Shield size={12} /> : <User size={12} />}
                      {u.role}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{u.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
