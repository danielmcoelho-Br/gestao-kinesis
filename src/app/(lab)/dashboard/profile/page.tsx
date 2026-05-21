"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/lab/components/Header";
import { updateProfile } from "./actions";
import { toast } from "sonner";
import { User, Key, Save, PenTool } from "lucide-react";
import SignaturePad from "@/lab/components/SignaturePad";

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        crefito: "",
        birth_date: "",
        signature: "",
        newPassword: "",
        confirmPassword: ""
    });

    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            const parsed = JSON.parse(savedUser);
            setUser(parsed);
            setFormData(prev => ({
                ...prev,
                name: parsed.name || "",
                email: parsed.email || "",
                crefito: parsed.crefito || "",
                birth_date: parsed.birth_date ? new Date(parsed.birth_date).toISOString().split('T')[0] : "",
                signature: parsed.signature || "",
            }));
        } else {
            router.push("/login");
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            toast.error("As senhas não coincidem");
            return;
        }

        setLoading(true);
        
        if (!user?.id) {
            toast.error("Sessão expirada. Por favor, saia e entre novamente.");
            setLoading(false);
            return;
        }

        const res = await updateProfile(user.id, formData);
        setLoading(false);

        if (res.success) {
            toast.success("Perfil atualizado com sucesso!");
            localStorage.setItem("user", JSON.stringify(res.data));
            setUser(res.data);
            setFormData(prev => ({ ...prev, newPassword: "", confirmPassword: "" }));
        } else {
            toast.error(res.error || "Erro ao atualizar perfil");
        }
    };

    if (!user) return null;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
            <Header showBackButton />
            <main style={{ maxWidth: '600px', margin: '2rem auto', padding: '0 1.5rem' }}>
                <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                            <User size={30} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0 }}>Meu Perfil</h2>
                            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Gerencie suas informações e senha</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label className="form-label">Nome Completo</label>
                            <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        
                        <div className="form-group">
                            <label className="form-label">E-mail</label>
                            <input type="email" className="form-input" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">CREFITO</label>
                                <input type="text" className="form-input" value={formData.crefito} onChange={e => setFormData({...formData, crefito: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Data de Nascimento</label>
                                <input type="date" className="form-input" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} />
                            </div>
                        </div>
                        
                        <div style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <PenTool size={18} /> Assinatura Digital
                            </h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Sua assinatura será incluída automaticamente ao final de todos os seus relatórios e avaliações.</p>
                            
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <SignaturePad 
                                    value={formData.signature}
                                    onChange={(val) => setFormData(prev => ({ ...prev, signature: val }))}
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Key size={18} /> Alterar Senha
                            </h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Preencha apenas se desejar alterar sua senha atual.</p>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Nova Senha</label>
                                    <input type="password" className="form-input" value={formData.newPassword} onChange={e => setFormData({...formData, newPassword: e.target.value})} placeholder="••••••••" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Confirmar Nova Senha</label>
                                    <input type="password" className="form-input" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} placeholder="••••••••" />
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                            <Save size={18} /> {loading ? "Salvando..." : "Salvar Alterações"}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
