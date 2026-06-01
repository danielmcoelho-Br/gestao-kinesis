"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { 
  Search, 
  UserPlus, 
  History as HistoryIcon, 
  ChevronRight, 
  LogOut,
  Home,
  X,
  Mars,
  Venus,
  Edit,
  Trash2,
  MessageCircle,
  FileText,
  CheckCircle2,
  Clock,
  Shield,
  Layout,
  User,
  Share2,
  ExternalLink,
  AlertTriangle,
  Users,
  Send
} from "lucide-react";


import { motion, AnimatePresence } from "framer-motion";
import { 
  getPatients, 
  createPatient, 
  updatePatient, 
  deletePatient, 
  findPatientByName, 
  getGestaoPatientsPendingRegister,
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup
} from "./actions";
import { toast } from "sonner";
import Header from "@/lab/components/Header";
import ConfirmModal from "@/lab/components/ConfirmModal";
import { questionnairesData } from "@/lab/data/questionnaires";

// Filter functional questionnaires (those with direct questions for patients)
const functionalQuestionnaires = Object.values(questionnairesData).filter(q => q.questions && q.questions.length > 0);

export default function DashboardPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const [patients, setPatients] = useState<any[]>([]);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // WhatsApp Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPatientForShare, setSelectedPatientForShare] = useState<any>(null);

  // Deletion State
  const [patientToDelete, setPatientToDelete] = useState<any>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Duplicate Check State
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicatePatient, setDuplicatePatient] = useState<any>(null);

  // Form state
  const [newName, setNewName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [newGender, setNewGender] = useState("Masculino");
  const [newDominance, setNewDominance] = useState("Destro");
  const [newActivityLevel, setNewActivityLevel] = useState("Ativo");
  const [newPhone, setNewPhone] = useState("");
  const [pendingGestaoPatients, setPendingGestaoPatients] = useState<any[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);

  // Recent Searches State
  const [recentPatients, setRecentPatients] = useState<any[]>([]);

  // Group States
  const [groups, setGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [groupName, setGroupName] = useState("");
  const [selectedGroupPatientIds, setSelectedGroupPatientIds] = useState<string[]>([]);
  const [groupModalSearch, setGroupModalSearch] = useState("");
  const [allPatients, setAllPatients] = useState<any[]>([]);

  // Group deletion confirmation
  const [groupToDelete, setGroupToDelete] = useState<any>(null);
  const [isConfirmGroupDeleteOpen, setIsConfirmGroupDeleteOpen] = useState(false);

  const fetchPendingPatients = async () => {
    setLoadingPending(true);
    const result = await getGestaoPatientsPendingRegister();
    if (result.success && result.data) {
      setPendingGestaoPatients(result.data);
    }
    setLoadingPending(false);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 8) val = val.slice(0, 8);
    if (val.length >= 5) {
      val = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4)}`;
    } else if (val.length >= 3) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    setBirthDate(val);
  };

  const parseFormattedDate = (dateString: string) => {
    if (!dateString) return null;
    const parts = dateString.split('/');
    if (parts.length !== 3) return null;
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00Z`);
  };

  const calculateAgeDetails = (dateString: string) => {
    const birthDate = parseFormattedDate(dateString);
    if (!birthDate) return null;
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    
    if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
      years--;
      months = (months + 12) % 12;
      if (today.getDate() < birthDate.getDate()) {
        months--;
        if (months < 0) months = 11;
      }
    } else if (today.getDate() < birthDate.getDate()) {
      months--;
      if (months < 0) {
        years--;
        months = 11;
      }
    }
    return { years, months };
  };

  const [user, setUser] = useState<any>(null);

  const fetchGroups = async () => {
    setLoadingGroups(true);
    const result = await getGroups();
    if (result.success && result.data) {
      setGroups(result.data);
    }
    setLoadingGroups(false);
  };

  const fetchAllPatients = async () => {
    const result = await getPatients("", 1000);
    if (result.success && result.data) {
      setAllPatients(result.data);
    }
  };

  const trackPatientSearch = (patient: any) => {
    if (!patient) return;
    const saved = localStorage.getItem("kinesis_recent_patients");
    let recent: any[] = saved ? JSON.parse(saved) : [];
    recent = recent.filter(p => p.id !== patient.id);
    recent.unshift({
      id: patient.id,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      createdAt: patient.createdAt,
      phone: patient.phone,
      hasOswestry: patient.hasOswestry
    });
    recent = recent.slice(0, 10);
    localStorage.setItem("kinesis_recent_patients", JSON.stringify(recent));
    setRecentPatients(recent);
  };

  const handlePatientClick = (patient: any) => {
    trackPatientSearch(patient);
    if (String(user?.role || '').toUpperCase() === 'SECRETARIA') {
      toast.info("Acesso restrito a uso clínico.");
    } else {
      router.push(`/dashboard/patient/${patient.id}`);
    }
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error("O nome do grupo não pode ser vazio.");
      return;
    }
    if (selectedGroupPatientIds.length === 0) {
      toast.error("Selecione pelo menos um paciente para o grupo.");
      return;
    }

    if (editingGroup) {
      const result = await updateGroup(editingGroup.id, groupName, selectedGroupPatientIds);
      if (result.success) {
        toast.success("Grupo atualizado com sucesso!");
        setShowGroupModal(false);
        fetchGroups();
      } else {
        toast.error(result.error);
      }
    } else {
      const result = await createGroup(groupName, selectedGroupPatientIds);
      if (result.success) {
        toast.success("Grupo criado com sucesso!");
        setShowGroupModal(false);
        fetchGroups();
      } else {
        toast.error(result.error);
      }
    }
  };

  const openNewGroupModal = () => {
    setEditingGroup(null);
    setGroupName("");
    setSelectedGroupPatientIds([]);
    setGroupModalSearch("");
    setShowGroupModal(true);
    fetchAllPatients(); // Ensure we have the latest list
  };

  const openEditGroupModal = (group: any) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setSelectedGroupPatientIds(group.patients.map((p: any) => p.id));
    setGroupModalSearch("");
    setShowGroupModal(true);
    fetchAllPatients(); // Ensure we have the latest list
  };

  const handleDeleteGroupClick = (group: any) => {
    setGroupToDelete(group);
    setIsConfirmGroupDeleteOpen(true);
  };

  const confirmDeleteGroup = async () => {
    if (!groupToDelete) return;
    const result = await deleteGroup(groupToDelete.id);
    if (result.success) {
      toast.success("Grupo excluído com sucesso!");
      fetchGroups();
    } else {
      toast.error(result.error);
    }
    setGroupToDelete(null);
    setIsConfirmGroupDeleteOpen(false);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
    
    const savedRecent = localStorage.getItem("kinesis_recent_patients");
    if (savedRecent) setRecentPatients(JSON.parse(savedRecent));

    fetchPatients();
    fetchGroups();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchPatients = async (query: string = "") => {
    const result = await getPatients(query);
    if (result.success) {
      setPatients(result.data || []);
    }
    setLoading(false);
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Check for duplicates before creating
    setLoading(true);
    const dupCheck = await findPatientByName(newName);
    setLoading(false);

    if (dupCheck.success && dupCheck.data) {
      setDuplicatePatient(dupCheck.data);
      setShowDuplicateModal(true);
      return;
    }

    await executeCreatePatient();
  };

  const executeCreatePatient = async () => {
    const ageDetails = calculateAgeDetails(birthDate);
    const result = await createPatient({
      name: newName,
      birth_date: parseFormattedDate(birthDate) || new Date(),
      age: ageDetails ? ageDetails.years : 0,
      gender: newGender,
      dominance: newDominance,
      activity_level: newActivityLevel,
      created_by_id: user?.id,
      phone: newPhone
    });

    if (result.success) {
      setShowNewPatientModal(false);
      setShowDuplicateModal(false);
      setNewName("");
      setBirthDate("");
      fetchPatients(search);
      toast.success("Paciente cadastrado com sucesso!");
    } else {
      toast.error(result.error);
    }
  };

  const handleUpdatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    const ageDetails = calculateAgeDetails(birthDate);
    const result = await updatePatient(editingPatient.id, {
      name: newName,
      birth_date: parseFormattedDate(birthDate) || new Date(),
      age: ageDetails ? ageDetails.years : 0,
      gender: newGender,
      dominance: newDominance,
      activity_level: newActivityLevel,
      phone: newPhone
    }, user?.id, user?.name);

    if (result.success) {
      setEditingPatient(null);
      fetchPatients(search);
      toast.success("Cadastro atualizado com sucesso!");
    } else {
      toast.error(result.error);
    }
  };

  const handleDeletePatient = (patient: any) => {
    setPatientToDelete(patient);
    setIsConfirmModalOpen(true);
  };

  const confirmDeletePatient = async () => {
    if (!patientToDelete) return;
    
    const id = patientToDelete.id;
    const result = await deletePatient(id);
    
    if (result.success) {
      // Optimistic update
      setPatients(prev => prev.filter(p => p.id !== id));
      toast.success("Paciente excluído com sucesso!");
      setShowNewPatientModal(false);
      setEditingPatient(null);
    } else {
      toast.error(result.error);
    }
    setPatientToDelete(null);
    setIsConfirmModalOpen(false);
  };

  const openEditModal = (patient: any) => {
    setEditingPatient(patient);
    setNewName(patient.name);
    
    let formattedDate = "";
    if (patient.birth_date) {
        const d = new Date(patient.birth_date);
        const day = String(d.getUTCDate()).padStart(2, '0');
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const year = d.getUTCFullYear();
        formattedDate = `${day}/${month}/${year}`;
    }
    setBirthDate(formattedDate);
    
    setNewGender(patient.gender || "Masculino");
    setNewDominance(patient.dominance || "Destro");
    setNewActivityLevel(patient.activity_level || "Ativo");
    setNewPhone(patient.phone || "");
    setShowNewPatientModal(true);
  };

  const handleOpenShareModal = (patient: any) => {
    setSelectedPatientForShare(patient);
    setShowShareModal(true);
  };

  const executeShare = (qId: string) => {
    if (!selectedPatientForShare) return;
    
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/assessment/public/${selectedPatientForShare.id}/${qId}`;
    const qName = questionnairesData[qId]?.title || qId;
    
    const message = encodeURIComponent(`Olá ${selectedPatientForShare.name}, por favor responda ao formulário de avaliação (${qName}) da KinesisLab: ${shareUrl}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
    
    setShowShareModal(false);
    toast.success("Link gerado e WhatsApp aberto!");
  };

  return (
    <div className="dashboard-page">
      <div className="background-gradient" />
      
      <Header />

      <main className="container main-content">
        <header className="page-header">
          <h2>Módulo Clínico & Integração</h2>
          <p>Gerencie pacientes, crie grupos e gerencie os canais de integração de forma centralizada.</p>
        </header>

        <div className="dashboard-grid">
          {/* LADO ESQUERDO: PACIENTES */}
          <div className="dashboard-column">
            <div className="list-container">
              <div className="column-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 className="list-title" style={{ margin: 0 }}>
                  <User size={20} style={{ color: 'var(--primary)' }} />
                  Pacientes
                </h3>
                <button 
                  className="btn-primary secondary-btn compact-btn" 
                  onClick={() => {
                    setEditingPatient(null);
                    setNewName("");
                    setBirthDate("");
                    setNewGender("Masculino");
                    setNewDominance("Destro");
                    setNewActivityLevel("Ativo");
                    setNewPhone("");
                    setShowNewPatientModal(true);
                    fetchPendingPatients();
                  }}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                >
                  <UserPlus size={16} />
                  <span>Novo</span>
                </button>
              </div>

              {/* Busca de Pacientes */}
              <div className="search-container" style={{ marginBottom: '1.5rem' }}>
                <Search className="search-icon" size={20} />
                <input 
                  type="text" 
                  placeholder="Buscar paciente por nome..."
                  className="form-input search-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Lista ou Recentes */}
              {search === "" ? (
                <div>
                  <h4 className="section-subtitle" style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <HistoryIcon size={14} /> Pesquisas Recentes
                  </h4>
                  <div className="patient-list">
                    {recentPatients.length === 0 ? (
                      <div className="empty-state">
                        Nenhum paciente pesquisado recentemente. Use o campo de busca acima para encontrar um paciente.
                      </div>
                    ) : (
                      recentPatients.map((patient, index) => (
                        <motion.div
                          key={`recent-${patient.id}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="patient-item-wrapper"
                          whileHover={{ borderColor: 'var(--primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                          style={{ alignItems: 'center' }}
                        >
                          <div className="patient-info" onClick={() => handlePatientClick(patient)}>
                            <div className="patient-header" style={{ width: '100%' }}>
                              <h4 className="patient-name">{patient.name}</h4>
                              <div className="patient-status">
                                {patient.hasOswestry ? (
                                  <span className="status-badge success">
                                    <CheckCircle2 size={12} /> ODI Concluído
                                  </span>
                                ) : (
                                  <span className="status-badge warning">
                                    <Clock size={12} /> ODI Pendente
                                  </span>
                                )}
                              </div>

                              <div className="patient-actions" style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleOpenShareModal(patient); }}
                                  className="btn-action share-btn"
                                  title="Compartilhar"
                                >
                                  <MessageCircle size={18} />
                                </button>

                                <button 
                                  onClick={(e) => { e.stopPropagation(); openEditModal(patient); }}
                                  className="btn-action edit-btn"
                                  title="Editar"
                                >
                                  <Edit size={18} />
                                </button>

                                {String(user?.role || '').toUpperCase() !== 'SECRETARIA' && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/assessment/select-segment/${patient.id}`); }}
                                    className="btn-action new-btn"
                                    title="Nova Avaliação"
                                  >
                                    <FileText size={18} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="patient-meta" style={{ marginTop: '0.25rem' }}>
                              {patient.age} anos | {patient.gender} | Cadastrado em {new Date(patient.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="section-subtitle" style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Resultado da Busca
                  </h4>
                  <div className="patient-list">
                    {loading ? (
                      <div className="status-message">Buscando pacientes...</div>
                    ) : patients.length === 0 ? (
                      <div className="status-message">Nenhum paciente encontrado.</div>
                    ) : (
                      patients.map((patient, index) => (
                        <motion.div
                          key={`search-${patient.id}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="patient-item-wrapper"
                          whileHover={{ borderColor: 'var(--primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                          style={{ alignItems: 'center' }}
                        >
                          <div className="patient-info" onClick={() => handlePatientClick(patient)}>
                            <div className="patient-header" style={{ width: '100%' }}>
                              <h4 className="patient-name">{patient.name}</h4>
                              <div className="patient-status">
                                {patient.hasOswestry ? (
                                  <span className="status-badge success">
                                    <CheckCircle2 size={12} /> ODI Concluído
                                  </span>
                                ) : (
                                  <span className="status-badge warning">
                                    <Clock size={12} /> ODI Pendente
                                  </span>
                                )}
                              </div>

                              <div className="patient-actions" style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleOpenShareModal(patient); }}
                                  className="btn-action share-btn"
                                  title="Compartilhar"
                                >
                                  <MessageCircle size={18} />
                                </button>

                                <button 
                                  onClick={(e) => { e.stopPropagation(); openEditModal(patient); }}
                                  className="btn-action edit-btn"
                                  title="Editar"
                                >
                                  <Edit size={18} />
                                </button>

                                {String(user?.role || '').toUpperCase() !== 'SECRETARIA' && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/assessment/select-segment/${patient.id}`); }}
                                    className="btn-action new-btn"
                                    title="Nova Avaliação"
                                  >
                                    <FileText size={18} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="patient-meta" style={{ marginTop: '0.25rem' }}>
                              {patient.age} anos | {patient.gender} | Cadastrado em {new Date(patient.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* LADO DIREITO: GRUPOS */}
          <div className="dashboard-column">
            <div className="list-container">
              <div className="column-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 className="list-title" style={{ margin: 0 }}>
                  <Users size={20} style={{ color: 'var(--primary)' }} />
                  Grupos de Envio
                </h3>
                <button 
                  className="btn-primary secondary-btn compact-btn" 
                  onClick={openNewGroupModal}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                >
                  <Users size={16} style={{ marginRight: '0.25rem' }} />
                  <span>Novo Grupo</span>
                </button>
              </div>

              <div className="group-list">
                {loadingGroups ? (
                  <div className="status-message">Carregando grupos...</div>
                ) : groups.length === 0 ? (
                  <div className="empty-state">
                    Nenhum grupo de integração cadastrado. Crie grupos para simplificar o envio de diários e mensagens para vários pacientes ao mesmo tempo.
                  </div>
                ) : (
                  groups.map((group, index) => (
                    <motion.div
                      key={group.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group-item-wrapper"
                      whileHover={{ borderColor: 'var(--primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    >
                      <div className="group-info" onClick={() => router.push(`/dashboard/group/${group.id}`)}>
                        <div className="group-header">
                          <h4 className="group-name-title">{group.name}</h4>
                          <span className="members-badge">
                            {group.patients.length} {group.patients.length === 1 ? 'membro' : 'membros'}
                          </span>
                        </div>
                        <p className="group-description">
                          {group.patients.slice(0, 3).map((p: any) => p.name).join(", ")}
                          {group.patients.length > 3 && " e outros..."}
                        </p>
                      </div>

                      <div className="group-actions">
                        <button 
                          onClick={() => router.push(`/dashboard/group/${group.id}`)}
                          className="btn-action send-btn"
                          title="Abrir Integração"
                        >
                          <Send size={18} />
                        </button>
                        <button 
                          onClick={() => openEditGroupModal(group)}
                          className="btn-action edit-btn"
                          title="Editar Grupo"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteGroupClick(group)}
                          className="btn-action delete-btn"
                          title="Excluir Grupo"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* WhatsApp Selection Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
              onClick={() => setShowShareModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{ position: 'relative', backgroundColor: '#ffffff', zIndex: 10, padding: '2rem', borderRadius: '1.5rem', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
            >
              <div className="modal-header">
                <h3>Compartilhar Questionário</h3>
                <button onClick={() => setShowShareModal(false)} className="close-btn">
                  <X size={20} />
                </button>
              </div>

              <p className="modal-description">
                Selecione o questionário funcional abaixo para enviar a <strong>{selectedPatientForShare?.name}</strong> via WhatsApp.
              </p>

              <div className="modal-list scrollbar">
                {functionalQuestionnaires.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => executeShare(q.id)}
                    className="modal-list-item"
                  >
                    <div className="item-info">
                      <div className="item-title">{q.title}</div>
                      <div className="item-subtitle">{q.segment.charAt(0).toUpperCase() + q.segment.slice(1)}</div>
                    </div>
                    <Share2 size={16} style={{ color: 'var(--primary)' }} />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Patient Modal (Add/Edit) */}
      <AnimatePresence>
        {showNewPatientModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
              onClick={() => { setShowNewPatientModal(false); setEditingPatient(null); }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ position: 'relative', backgroundColor: '#ffffff', zIndex: 10, padding: '2rem', borderRadius: '1.5rem', width: '100%', maxWidth: '700px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflowY: 'auto', maxHeight: '90vh' }}
            >
              <button 
                className="close-btn absolute"
                onClick={() => { setShowNewPatientModal(false); setEditingPatient(null); }}
              >
                <X size={24} />
              </button>

              <div className="modal-header compact">
                <h3>{editingPatient ? 'Editar Paciente' : 'Novo Cadastro'}</h3>
                {editingPatient && (
                  <button 
                    onClick={() => handleDeletePatient(editingPatient)}
                    className="delete-inline-btn"
                  >
                    <Trash2 size={16} /> <span className="hide-on-mobile">Excluir</span>
                  </button>
                )}
              </div>

               <form onSubmit={editingPatient ? handleUpdatePatient : handleCreatePatient}>
                {!editingPatient && pendingGestaoPatients.length > 0 && (
                  <div className="form-group" style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '1.0rem', border: '1px dashed #cbd5e1' }}>
                    <label className="form-label" style={{ color: '#0f172a', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#9d1d1d' }}></span>
                      Importar Paciente da Gestão (Planilha Financeira)
                    </label>
                    <select
                      className="form-input"
                      value=""
                      onChange={(e) => {
                        const selected = pendingGestaoPatients.find(p => p.name === e.target.value);
                        if (selected) {
                          setNewName(selected.name);
                          if (selected.phone) {
                            setNewPhone(selected.phone);
                          }
                          toast.success(`Paciente ${selected.name} carregado!`);
                        }
                      }}
                      style={{ marginTop: '0.5rem', borderColor: '#cbd5e1' }}
                    >
                      <option value="">-- Selecione para preencher os dados --</option>
                      {pendingGestaoPatients.map((p, idx) => (
                        <option key={idx} value={p.name}>
                          {p.name} {p.phone ? `(${p.phone})` : '(Sem Telefone)'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Nome Completo</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Maria da Silva"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Telefone</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: (11) 99999-9999"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Data de Nascimento</label>
                    <input
                      type="text"
                      className="form-input"
                      value={birthDate}
                      onChange={handleDateChange}
                      placeholder="DD/MM/AAAA"
                      maxLength={10}
                      required
                    />
                    {birthDate && (
                      <div className="age-badge">
                        {(() => {
                          const details = calculateAgeDetails(birthDate);
                          return details ? `${details.years} anos e ${details.months} meses` : '';
                        })()}
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sexo</label>
                    <div className="gender-toggle">
                      <button
                        type="button"
                        onClick={() => setNewGender("Masculino")}
                        className={`gender-btn male ${newGender === "Masculino" ? "active" : ""}`}
                      >
                        <Mars size={24} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewGender("Feminino")}
                        className={`gender-btn female ${newGender === "Feminino" ? "active" : ""}`}
                      >
                        <Venus size={24} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Dominância</label>
                    <select 
                      className="form-input" 
                      value={newDominance} 
                      onChange={(e) => setNewDominance(e.target.value)}
                    >
                      <option value="Destro">Destro</option>
                      <option value="Canhoto">Canhoto</option>
                      <option value="Ambidestro">Ambidestro</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nível de Atividade</label>
                    <select 
                      className="form-input" 
                      value={newActivityLevel} 
                      onChange={(e) => setNewActivityLevel(e.target.value)}
                    >
                      <option value="Ativo">Ativo / Pratica Exercícios</option>
                      <option value="Sedentário">Sedentário</option>
                    </select>
                  </div>
                </div>

                <div className="modal-footer">
                  <button 
                    type="button"
                    className="btn-primary secondary-btn flex-1"
                    onClick={() => { setShowNewPatientModal(false); setEditingPatient(null); }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary flex-1"
                  >
                    {editingPatient ? 'Salvar Alterações' : 'Salvar Paciente'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
 
      {/* Duplicate Patient Warning Modal */}
      <AnimatePresence>
        {showDuplicateModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
              onClick={() => setShowDuplicateModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{ 
                position: 'relative', 
                backgroundColor: '#ffffff', 
                zIndex: 10001, 
                padding: '2rem', 
                borderRadius: '1.5rem', 
                width: '100%', 
                maxWidth: '450px', 
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                textAlign: 'center'
              }}
            >
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '16px', 
                backgroundColor: '#FEF3C7', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                color: '#D97706'
              }}>
                <AlertTriangle size={32} />
              </div>

              <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--text)' }}>
                Paciente já existe!
              </h3>
              
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
                Já existe um paciente cadastrado com o nome <strong>{newName}</strong>.<br/>
                O que você deseja fazer?
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button 
                  onClick={() => router.push(`/dashboard/patient/${duplicatePatient?.id}`)} 
                  className="btn-primary"
                  style={{ backgroundColor: 'var(--secondary)', border: 'none' }}
                >
                  Ir para a ficha do paciente
                </button>
                
                <button 
                  onClick={executeCreatePatient} 
                  className="btn-primary secondary-btn"
                  style={{ border: '1px solid var(--border)' }}
                >
                  Criar mesmo assim
                </button>

                <button 
                  onClick={() => setShowDuplicateModal(false)} 
                  style={{ 
                    padding: '0.75rem', 
                    background: 'none', 
                    border: 'none', 
                    color: 'var(--text-muted)', 
                    fontWeight: '600', 
                    cursor: 'pointer' 
                  }}
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Grupo (Novo) */}
      <AnimatePresence>
        {showGroupModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
              onClick={() => setShowGroupModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ position: 'relative', backgroundColor: '#ffffff', zIndex: 10000, padding: '2rem', borderRadius: '1.5rem', width: '100%', maxWidth: '600px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflowY: 'auto', maxHeight: '90vh' }}
            >
              <button 
                className="close-btn absolute"
                onClick={() => setShowGroupModal(false)}
              >
                <X size={24} />
              </button>

              <div className="modal-header compact">
                <h3>{editingGroup ? 'Editar Grupo' : 'Novo Grupo'}</h3>
              </div>

              <form onSubmit={handleSaveGroup}>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label" style={{ fontWeight: 'bold' }}>Nome do Grupo</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Pacientes da Tarde, Joelho Quadril, etc."
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    required
                    style={{ border: '1px solid var(--border)' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label" style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Selecionar Pacientes Membros</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {selectedGroupPatientIds.length} selecionado(s)
                    </span>
                  </label>

                  {/* Campo de Busca Interno do Modal */}
                  <div className="search-container" style={{ margin: '0.5rem 0 1rem 0', position: 'relative' }}>
                    <Search className="search-icon" size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      placeholder="Filtrar pacientes por nome..."
                      className="form-input"
                      value={groupModalSearch}
                      onChange={(e) => setGroupModalSearch(e.target.value)}
                      style={{ paddingLeft: '2.5rem', fontSize: '0.9rem', height: '40px', border: '1px solid var(--border)' }}
                    />
                  </div>

                  {/* Lista de seleção com checkboxes */}
                  <div style={{ 
                    maxHeight: '250px', 
                    overflowY: 'auto', 
                    border: '1px solid var(--border)', 
                    borderRadius: 'var(--radius-lg)', 
                    padding: '0.5rem',
                    backgroundColor: '#fafafa'
                  }}>
                    {allPatients.filter(patient => 
                      patient.name.toLowerCase().includes(groupModalSearch.toLowerCase())
                    ).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Nenhum paciente correspondente.
                      </div>
                    ) : (
                      allPatients
                        .filter(patient => patient.name.toLowerCase().includes(groupModalSearch.toLowerCase()))
                        .map(patient => {
                          const isChecked = selectedGroupPatientIds.includes(patient.id);
                          return (
                            <label 
                              key={patient.id} 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.75rem', 
                                padding: '0.75rem 0.5rem', 
                                borderBottom: '1px solid #f0f0f0', 
                                cursor: 'pointer',
                                transition: 'background-color 0.2s',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.95rem'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedGroupPatientIds(prev => prev.filter(id => id !== patient.id));
                                  } else {
                                    setSelectedGroupPatientIds(prev => [...prev, patient.id]);
                                  }
                                }}
                                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                              />
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: '500', color: 'var(--text)' }}>{patient.name}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{patient.age} anos | {patient.phone || 'Sem telefone'}</span>
                              </div>
                            </label>
                          );
                        })
                    )}
                  </div>
                </div>

                <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
                  <button 
                    type="button"
                    className="btn-primary secondary-btn flex-1"
                    onClick={() => setShowGroupModal(false)}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary flex-1"
                  >
                    {editingGroup ? 'Atualizar Grupo' : 'Salvar Grupo'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .dashboard-page {
          min-height: 100vh;
          background-color: var(--bg);
        }
        .main-content {
          padding: 2rem 1.5rem;
        }
        .page-header {
          text-align: center;
          margin-bottom: 3rem;
          margin-top: 2rem;
        }
        .page-header h2 {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          letter-spacing: -0.025em;
        }
        .actions-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .search-container {
          flex: 1;
          min-width: 300px;
          position: relative;
        }
        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }
        .search-input {
          padding-left: 3rem;
        }
        .action-buttons {
          display: flex;
          gap: 1rem;
        }
        .secondary-btn {
          width: auto;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background-color: white;
          color: var(--text);
          border: 1px solid var(--border);
          margin-top: 0;
        }
        .admin-btn {
          width: auto;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background-color: #FEF2F2;
          color: var(--primary);
          border: 1px solid #FECACA;
          margin-top: 0;
        }
        .list-container {
          background: white;
          padding: 2rem;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border);
        }
        .list-title {
          font-size: 1.25rem;
          font-weight: bold;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .patient-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .status-message {
          text-align: center;
          padding: 3rem 0;
          color: var(--text-muted);
        }
        .patient-item-wrapper {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem;
          background-color: white;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          transition: all 0.2s;
        }
        .patient-info {
          flex: 1;
          cursor: pointer;
        }
        .patient-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.25rem;
          flex-wrap: wrap;
        }
        .patient-name {
          font-size: 1.125rem;
          font-weight: bold;
          margin: 0;
        }
        .status-badge {
          font-size: 0.7rem;
          padding: 2px 8px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .status-badge.success {
          background-color: #DCFCE7;
          color: #166534;
        }
        .status-badge.warning {
          background-color: #FEF3C7;
          color: #92400E;
        }
        .patient-meta {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin: 0;
        }
        .patient-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .btn-action {
          padding: 0.6rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          cursor: pointer;
          transition: all 0.2s;
          background: white;
        }
        .share-btn { border-color: #25D366; background-color: #25D36610; color: #25D366; }
        .edit-btn { color: var(--text-muted); }
        .new-btn { border-color: var(--primary); background-color: var(--primary-light); color: var(--primary); }
        .delete-btn { border-color: #FEE2E2; background-color: #FEF2F2; color: #EF4444; }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999 !important;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        :global(.modal-backdrop) {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.75) !important;
          backdrop-filter: blur(8px) !important;
          -webkit-backdrop-filter: blur(8px) !important;
          z-index: -1;
        }
        :global(.modal-content) {
          position: relative;
          background-color: #ffffff !important;
          z-index: 10000 !important;
          padding: 2rem;
          border-radius: var(--radius-xl);
          width: 100%;
          max-width: 500px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5) !important;
        }
        :global(.large-modal) {
          max-width: 700px !important;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .modal-description {
          color: var(--text-muted);
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
        }
        .close-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
        }
        .close-btn.absolute {
          position: absolute;
          right: 1.5rem;
          top: 1.5rem;
        }
        .modal-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 40vh;
          overflow-y: auto;
          padding-right: 0.5rem;
        }
        .modal-list-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          margin-bottom: 0.5rem;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
          text-align: left;
        }
        .modal-list-item:hover {
          border-color: var(--primary);
          background-color: var(--primary-light);
        }
        .item-title { font-weight: bold; color: var(--text); }
        .item-subtitle { font-size: 0.75rem; color: var(--text-muted); }

        /* Large Modal Specifics */
        .large-modal {
          padding: 2.5rem;
        }
        .modal-header.compact {
          margin-bottom: 1.5rem;
        }
        .delete-inline-btn {
          color: #EF4444;
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          fontSize: 0.875rem;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .age-badge {
          fontSize: 0.75rem;
          color: var(--primary);
          marginTop: 0.4rem;
          fontWeight: bold;
        }
        .gender-toggle {
          display: flex;
          gap: 0.5rem;
          height: 45px;
        }
        .gender-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-lg);
          border: 2px solid #f3f4f6;
          background-color: white;
          cursor: pointer;
          transition: all 0.2s;
        }
        .gender-btn.male { color: #3B82F6; }
        .gender-btn.male.active { border-color: #3B82F6; background-color: #EFF6FF; }
        .gender-btn.female { color: #EC4899; }
        .gender-btn.female.active { border-color: #EC4899; background-color: #FDF2F8; }
        .modal-footer {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }
        .flex-1 { flex: 1; }

        @media (max-width: 1024px) {
          .page-header h2 {
            font-size: 2rem;
          }
        }

        @media (max-width: 768px) {
          .main-content {
            padding: 1rem;
          }
          .page-header {
            margin-bottom: 2rem;
          }
          .search-container {
            min-width: 100%;
          }
          .action-buttons {
            width: 100%;
          }
          .action-buttons button {
            flex: 1;
            justify-content: center;
          }
          .list-container {
            padding: 1.5rem;
          }
          .patient-item-wrapper {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          .patient-actions {
            width: 100%;
            justify-content: space-between;
          }
          .btn-action {
            flex: 1;
            display: flex;
            justify-content: center;
          }
          .form-grid {
            grid-template-columns: 1fr;
          }
          .modal-content {
            padding: 1.5rem !important;
          }
          .modal-footer {
            flex-direction: column-reverse;
          }
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-top: 1rem;
          margin-bottom: 2rem;
        }
        .dashboard-column {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          min-width: 0;
        }
        .column-header-row {
          border-bottom: 1px solid var(--border);
          padding-bottom: 0.75rem;
        }
        .empty-state {
          text-align: center;
          padding: 2.5rem 1.5rem;
          color: var(--text-muted);
          background-color: #fafafa;
          border: 1px dashed var(--border);
          border-radius: var(--radius-lg);
          font-size: 0.9rem;
          line-height: 1.5;
        }
        .group-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .group-item-wrapper {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem;
          background-color: white;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          transition: all 0.2s;
        }
        .group-info {
          flex: 1;
          cursor: pointer;
          min-width: 0;
          margin-right: 1rem;
        }
        .group-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.25rem;
        }
        .group-name-title {
          font-size: 1.125rem;
          font-weight: bold;
          margin: 0;
          color: var(--text);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .members-badge {
          font-size: 0.7rem;
          padding: 2px 8px;
          border-radius: 10px;
          background-color: #f1f5f9;
          color: var(--text-muted);
          font-weight: 500;
          white-space: nowrap;
        }
        .group-description {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .group-actions {
          display: flex;
          gap: 0.5rem;
        }
        .send-btn { 
          border-color: var(--primary); 
          background-color: var(--primary-light); 
          color: var(--primary); 
        }

        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }
      `}</style>
      <ConfirmModal 
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDeletePatient}
        title="Excluir Paciente"
        message={`Tem certeza que deseja excluir o cadastro de ${patientToDelete?.name}? Todos os dados e avaliações relacionados serão perdidos permanentemente.`}
        confirmLabel="Sim, excluir"
        cancelLabel="Cancelar"
      />
      <ConfirmModal 
        isOpen={isConfirmGroupDeleteOpen}
        onClose={() => setIsConfirmGroupDeleteOpen(false)}
        onConfirm={confirmDeleteGroup}
        title="Excluir Grupo de Integração"
        message={`Tem certeza que deseja excluir o grupo ${groupToDelete?.name}? Os pacientes pertencentes a ele não serão excluídos, apenas a associação ao grupo.`}
        confirmLabel="Sim, excluir"
        cancelLabel="Cancelar"
      />

    </div>
  );
}
