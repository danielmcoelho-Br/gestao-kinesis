"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
    FileText, 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    Eye,
    ArrowLeft,
    Image as ImageIcon,
    Layout,
    Activity,
    Settings,
    CheckCircle2,
    XCircle,
    X,
    Upload
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from "./actions";
import { toast } from "sonner";
import Header from "@/lab/components/Header";
import ConfirmModal from "@/lab/components/ConfirmModal";

export default function AssessmentsAdminPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    
    const [showModal, setShowModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<any>(null);
    
    // Deletion State
    const [templateToDelete, setTemplateToDelete] = useState<any>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        segment: "Cervical",
        icon_url: "",
        structure: {},
        is_active: true
    });

    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        if (savedUser) setUser(JSON.parse(savedUser));
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        const res = await getTemplates();
        if (res.success) setTemplates(res.data || []);
        setLoading(false);
    };

    const handleOpenModal = (template: any = null) => {
        if (template) {
            setEditingTemplate(template);
            setFormData({
                title: template.title,
                description: template.description || "",
                segment: template.segment,
                icon_url: template.icon_url || "",
                structure: template.structure || {},
                is_active: template.is_active
            });
        } else {
            setEditingTemplate(null);
            setFormData({
                title: "",
                description: "",
                segment: "Cervical",
                icon_url: "",
                structure: {},
                is_active: true
            });
        }
        setShowModal(true);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error("Imagem muito grande (máx 2MB)");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, icon_url: reader.result as string });
                toast.success("Imagem carregada!");
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingTemplate) {
            const res = await updateTemplate(editingTemplate.id, formData, "Administrador");
            if (res.success) {
                toast.success("Modelo atualizado!");
                setShowModal(false);
                fetchTemplates();
            } else {
                toast.error(res.error);
            }
        } else {
            const res = await createTemplate(formData);
            if (res.success) {
                toast.success("Modelo criado!");
                setShowModal(false);
                fetchTemplates();
            } else {
                toast.error(res.error);
            }
        }
    };

    const handleDelete = (template: any) => {
        setTemplateToDelete(template);
        setIsConfirmModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!templateToDelete) return;
        
        const res = await deleteTemplate(templateToDelete.id);
        if (res.success) {
            toast.success("Modelo excluído!");
            fetchTemplates();
        } else {
            toast.error(res.error);
        }
        setTemplateToDelete(null);
    };

    const filteredTemplates = templates.filter(t => 
        t.title.toLowerCase().includes(search.toLowerCase()) || 
        t.segment.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
            <Header showBackButton />
            <main style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Modelos de Avaliação</h1>
                    <button className="btn-primary" style={{ width: 'auto' }} onClick={() => handleOpenModal()}>
                        <Plus size={20} style={{ marginRight: '0.5rem' }} /> Novo Modelo
                    </button>
                </div>
                <div style={{ position: 'relative', marginBottom: '2rem' }}>
                    <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                        type="text" 
                        placeholder="Buscar por título ou segmento..." 
                        className="form-input" 
                        style={{ paddingLeft: '3rem' }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
                    {loading ? (
                        <p>Carregando...</p>
                    ) : filteredTemplates.map(template => (
                        <motion.div 
                            key={template.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ 
                                backgroundColor: 'white', 
                                padding: '1.5rem', 
                                borderRadius: '1.25rem', 
                                border: '1px solid var(--border)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem'
                            }}
                        >
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <div style={{ 
                                    width: '60px', 
                                    height: '60px', 
                                    borderRadius: '1rem', 
                                    backgroundColor: '#F3F4F6', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    overflow: 'hidden'
                                }}>
                                    {template.icon_url ? (
                                        <img src={template.icon_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <FileText size={24} style={{ color: 'var(--text-muted)' }} />
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>{template.title}</h3>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>{template.segment}</span>
                                </div>
                                <div>
                                    {template.is_active ? <CheckCircle2 size={18} color="green" /> : <XCircle size={18} color="red" />}
                                </div>
                            </div>
                            
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', minHeight: '2.5rem' }}>
                                {template.description || "Sem descrição disponível."}
                            </p>

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                                <button className="btn-primary" style={{ flex: 1, backgroundColor: 'white', color: 'var(--text)', border: '1px solid var(--border)', fontSize: '0.85rem' }} onClick={() => handleOpenModal(template)}>
                                    <Settings size={16} style={{ marginRight: '0.25rem' }} /> Configurar
                                </button>
                                <button className="btn-primary" style={{ flex: 0.2, backgroundColor: 'white', color: '#EF4444', border: '1px solid #FEE2E2', padding: '0' }} onClick={() => handleDelete(template.id)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>

            <AnimatePresence>
                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1.5rem', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}
                        >
                            <h2 style={{ marginBottom: '1.5rem' }}>{editingTemplate ? 'Editar Modelo' : 'Novo Modelo'}</h2>
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Título da Avaliação</label>
                                    <input type="text" className="form-input" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Descrição curta</label>
                                    <textarea className="form-input" style={{ height: '80px', padding: '0.75rem' }} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Segmento</label>
                                        <select className="form-input" value={formData.segment} onChange={e => setFormData({...formData, segment: e.target.value})}>
                                            <option value="Cervical">Cervical</option>
                                            <option value="Lombar">Lombar</option>
                                            <option value="Ombro">Ombro</option>
                                            <option value="Joelho">Joelho</option>
                                            <option value="Geral">Geral</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Ícone da Avaliação</label>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <div style={{ 
                                                width: '40px', 
                                                height: '40px', 
                                                borderRadius: '0.5rem', 
                                                backgroundColor: '#F3F4F6', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                border: '1px solid var(--border)',
                                                overflow: 'hidden'
                                            }}>
                                                {formData.icon_url ? (
                                                    <img src={formData.icon_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                ) : (
                                                    <ImageIcon size={20} style={{ color: '#9CA3AF' }} />
                                                )}
                                            </div>
                                            <label className="btn-primary" style={{ height: '40px', padding: '0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', backgroundColor: 'white', color: 'var(--text)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                                                <Upload size={14} /> Upload
                                                <input type="file" hidden accept="image/*" onChange={handleFileUpload} />
                                            </label>
                                            {formData.icon_url && (
                                                <button type="button" onClick={() => setFormData({...formData, icon_url: ''})} style={{ color: '#EF4444', background: 'none', border: 'none', fontSize: '0.7rem' }}>Remover</button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Método de Cálculo / Pontuação</label>
                                    <select 
                                        className="form-input" 
                                        value={(formData.structure as any).calculationType || "sum"}
                                        onChange={e => setFormData({
                                            ...formData, 
                                            structure: { ...formData.structure as any, calculationType: e.target.value }
                                        })}
                                    >
                                        <option value="sum">Soma Simples</option>
                                        <option value="percentage">Porcentagem (Soma/Máximo)</option>
                                        <option value="oswestry">Escala de Oswestry (ODI)</option>
                                        <option value="ndi">Escala de Neck Disability Index (NDI)</option>
                                        <option value="quickdash">QuickDASH (Membros Superiores)</option>
                                        <option value="lysholm">Escala de Lysholm (Joelho)</option>
                                        <option value="lbpq">Roland-Morris (Lombar)</option>
                                        <option value="man">MAN (Mini Avaliação Nutricional)</option>
                                        <option value="ves13">VES-13 (Vulnerabilidade do Idoso)</option>
                                        <option value="brief">BPI-SF (Inventário Breve de Dor)</option>
                                    </select>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                        Define como o sistema interpretará os dados preenchidos para gerar o resultado final.
                                    </p>
                                </div>
                                
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        Estrutura da Avaliação
                                        <button type="button" onClick={() => {
                                            const newStructure = { ...formData.structure as any };
                                            if (!newStructure.sections) newStructure.sections = [];
                                            newStructure.sections.push({ id: `sec_${Date.now()}`, title: "Nova Seção", fields: [] });
                                            setFormData({ ...formData, structure: newStructure });
                                        }} style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', border: '1px solid var(--primary)', color: 'var(--primary)', background: 'none' }}>
                                            + Adicionar Seção
                                        </button>
                                    </label>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border)', padding: '1rem', borderRadius: '0.75rem', backgroundColor: '#F9FAFB' }}>
                                        {((formData.structure as any).sections || []).length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>Nenhuma seção adicionada.</p>}
                                        {((formData.structure as any).sections || []).map((section: any, sIdx: number) => (
                                            <div key={section.id} style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                                    <input 
                                                        type="text" 
                                                        placeholder="Título da Seção" 
                                                        style={{ flex: 1, padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid var(--border)', fontSize: '0.85rem', fontWeight: 'bold' }} 
                                                        value={section.title} 
                                                        onChange={e => {
                                                            const newSections = [...(formData.structure as any).sections];
                                                            newSections[sIdx].title = e.target.value;
                                                            setFormData({ ...formData, structure: { ...formData.structure as any, sections: newSections } });
                                                        }}
                                                    />
                                                    <button type="button" onClick={() => {
                                                        const newSections = (formData.structure as any).sections.filter((_: any, i: number) => i !== sIdx);
                                                        setFormData({ ...formData, structure: { ...formData.structure as any, sections: newSections } });
                                                    }} style={{ color: '#EF4444', background: 'none', border: 'none' }}><Trash2 size={16} /></button>
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '1rem', borderLeft: '2px solid var(--border-light)' }}>
                                                    {(section.fields || []).map((field: any, fIdx: number) => (
                                                        <div key={field.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem' }}>
                                                                <input 
                                                                    type="text" 
                                                                    placeholder="Nome do Campo" 
                                                                    style={{ padding: '0.35rem', borderRadius: '0.25rem', border: '1px solid var(--border)', fontSize: '0.8rem' }} 
                                                                    value={field.label} 
                                                                    onChange={e => {
                                                                        const newSections = [...(formData.structure as any).sections];
                                                                        newSections[sIdx].fields[fIdx].label = e.target.value;
                                                                        setFormData({ ...formData, structure: { ...formData.structure as any, sections: newSections } });
                                                                    }}
                                                                />
                                                                <select 
                                                                    style={{ padding: '0.35rem', borderRadius: '0.25rem', border: '1px solid var(--border)', fontSize: '0.8rem' }}
                                                                    value={field.type}
                                                                    onChange={e => {
                                                                        const newSections = [...(formData.structure as any).sections];
                                                                        newSections[sIdx].fields[fIdx].type = e.target.value;
                                                                        setFormData({ ...formData, structure: { ...formData.structure as any, sections: newSections } });
                                                                    }}
                                                                >
                                                                    <option value="text">Texto</option>
                                                                    <option value="textarea">Área de Texto</option>
                                                                    <option value="number">Número</option>
                                                                    <option value="range">Escala (0-10)</option>
                                                                    <option value="checkbox">Checkbox</option>
                                                                    <option value="bodyschema">Mapa Corporal</option>
                                                                    <option value="table">Tabela</option>
                                                                </select>
                                                            </div>
                                                            <button type="button" onClick={() => {
                                                                const newSections = [...(formData.structure as any).sections];
                                                                newSections[sIdx].fields = newSections[sIdx].fields.filter((_: any, i: number) => i !== fIdx);
                                                                setFormData({ ...formData, structure: { ...formData.structure as any, sections: newSections } });
                                                            }} style={{ color: '#9CA3AF', background: 'none', border: 'none' }}><X size={14} /></button>
                                                        </div>
                                                    ))}
                                                    <button type="button" onClick={() => {
                                                        const newSections = [...(formData.structure as any).sections];
                                                        if (!newSections[sIdx].fields) newSections[sIdx].fields = [];
                                                        newSections[sIdx].fields.push({ id: `field_${Date.now()}`, label: "Novo Campo", type: "text" });
                                                        setFormData({ ...formData, structure: { ...formData.structure as any, sections: newSections } });
                                                    }} style={{ alignSelf: 'flex-start', fontSize: '0.7rem', color: 'var(--primary)', background: 'none', border: 'none', marginTop: '0.5rem' }}>+ Adicionar Campo</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                        <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} /> Modelo Ativo para aplicação
                                    </label>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button type="button" className="btn-primary" style={{ backgroundColor: '#F3F4F6', color: 'var(--text)', border: 'none' }} onClick={() => setShowModal(false)}>Cancelar</button>
                                    <button type="submit" className="btn-primary">Salvar Modelo</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmModal 
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmDelete}
                title="Excluir Modelo"
                message={`Tem certeza que deseja excluir o modelo "${templateToDelete?.title}"? Esta ação removerá o modelo permanentemente.`}
                confirmLabel="Sim, excluir"
                cancelLabel="Cancelar"
            />
        </div>
    );
}
