"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Send, 
  MessageCircle, 
  FileText, 
  CheckCircle2, 
  Clock, 
  User, 
  Users, 
  Check, 
  Loader2, 
  CalendarRange, 
  BookOpen, 
  ChevronRight, 
  Folder,
  Phone
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import { getGroupDetails, ensurePatientAccessToken } from "../../actions";
import { sendPushNotification } from "@/app/(integracao)/actions/push";
import Header from "@/lab/components/Header";
import { toast } from "sonner";

interface PatientMember {
  id: string;
  name: string;
  phone: string | null;
  accessToken: string | null;
  gender: string | null;
  age: number | null;
  createdAt: string;
}

interface GroupDetails {
  id: string;
  name: string;
  patients: PatientMember[];
}

interface WhatsAppQueueItem {
  patientId: string;
  name: string;
  phone: string;
  token: string;
  status: "pending" | "sending" | "sent";
}

export default function GroupIntegrationPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;

  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Tab State: 'mensagem' | 'diario' | 'arquivos'
  const [contentType, setContentType] = useState<"mensagem" | "diario" | "arquivos">("mensagem");

  // Form State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Destinatários selecionados
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
  
  // Fila de WhatsApp
  const [whatsappQueue, setWhatsappQueue] = useState<WhatsAppQueueItem[]>([]);
  const [preparingQueue, setPreparingQueue] = useState(false);

  // Biblioteca de materiais local
  const [libraryFolders, setLibraryFolders] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));

    fetchGroupDetails();
    loadLibraryFromLocalStorage();
  }, [groupId]);

  const fetchGroupDetails = async () => {
    setLoading(true);
    const result = await getGroupDetails(groupId);
    if (result.success && result.data) {
      setGroup(result.data as any);
      // Por padrão, todos os membros iniciam selecionados
      const ids = (result.data.patients || []).map((p: any) => p.id);
      setSelectedPatientIds(ids);
    } else {
      toast.error(result.error || "Falha ao carregar detalhes do grupo.");
      router.push("/dashboard");
    }
    setLoading(false);
  };

  const loadLibraryFromLocalStorage = () => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("kinesis_asset_library_folders");
      if (saved) {
        setLibraryFolders(JSON.parse(saved));
      } else {
        // Fallback default folders
        const defaults = [
          {
            id: "f-1",
            name: "Orientação Joelho e Quadril",
            files: [
              { id: "file-1", title: "Exercícios Iniciais de Joelho", type: "pdf", url: "https://kinesislab.com.br/docs/joelho_iniciais.pdf" },
              { id: "file-2", title: "Alongamentos e Mobilidade de Quadril", type: "pdf", url: "https://kinesislab.com.br/docs/quadril_alongamento.pdf" }
            ]
          },
          {
            id: "f-2",
            name: "Coluna Lombar",
            files: [
              { id: "file-3", title: "Higiene Postural do Dia a Dia", type: "pdf", url: "https://kinesislab.com.br/docs/lombar_postural.pdf" },
              { id: "file-4", title: "Exercícios de Estabilização Central", type: "video", url: "https://kinesislab.com.br/videos/lombar_core.mp4" }
            ]
          }
        ];
        setLibraryFolders(defaults);
        localStorage.setItem("kinesis_asset_library_folders", JSON.stringify(defaults));
      }
    }
  };

  const toggleFolder = (folderId: string) => {
    if (expandedFolders.includes(folderId)) {
      setExpandedFolders(prev => prev.filter(id => id !== folderId));
    } else {
      setExpandedFolders(prev => [...prev, folderId]);
    }
  };

  const toggleFileSelection = (file: any) => {
    const isSelected = selectedFiles.some(f => f.id === file.id);
    if (isSelected) {
      setSelectedFiles(prev => prev.filter(f => f.id !== file.id));
    } else {
      setSelectedFiles(prev => [...prev, file]);
    }
  };

  const handleSelectAllMembers = () => {
    if (!group) return;
    if (selectedPatientIds.length === group.patients.length) {
      setSelectedPatientIds([]);
    } else {
      setSelectedPatientIds(group.patients.map(p => p.id));
    }
  };

  const handleSelectMember = (id: string) => {
    if (selectedPatientIds.includes(id)) {
      setSelectedPatientIds(prev => prev.filter(pid => pid !== id));
    } else {
      setSelectedPatientIds(prev => [...prev, id]);
    }
  };

  // Enviar via Push Notification (100% Automático)
  const handleSendPush = async () => {
    if (!group) return;
    if (selectedPatientIds.length === 0) {
      toast.error("Selecione pelo menos um paciente destinatário.");
      return;
    }

    let payloadTitle = "";
    let payloadBody = "";

    if (contentType === "mensagem") {
      if (!title.trim() || !message.trim()) {
        toast.error("Preencha o título e a mensagem de envio.");
        return;
      }
      payloadTitle = title;
      payloadBody = message;
    } else if (contentType === "diario") {
      if (!startDate || !endDate) {
        toast.error("Selecione o período de início e fim do diário.");
        return;
      }
      payloadTitle = "Diário de Dor Kinesis";
      payloadBody = `Por favor, preencha o seu Diário de Dor diário entre as datas ${new Date(startDate).toLocaleDateString("pt-BR")} e ${new Date(endDate).toLocaleDateString("pt-BR")}.`;
      if (message.trim()) {
        payloadBody += `\nOrientação: ${message}`;
      }
    } else {
      // Arquivos / Materiais
      if (selectedFiles.length === 0) {
        toast.error("Selecione pelo menos um material de apoio para enviar.");
        return;
      }
      payloadTitle = "Novos Materiais KinesisLab";
      payloadBody = `Você recebeu ${selectedFiles.length} novo(s) material(is) educativo(s) da equipe Kinesis.`;
      if (message.trim()) {
        payloadBody += `\nOrientação: ${message}`;
      }
    }

    const toastId = toast.loading("Enviando notificações push...");
    
    const result = await sendPushNotification(selectedPatientIds, {
      title: payloadTitle,
      body: payloadBody
    });

    if (result.success) {
      toast.success(
        `Disparo concluído! Enviado com sucesso para ${result.count} de ${result.total} pacientes subscritos.`,
        { id: toastId, duration: 5000 }
      );
    } else {
      toast.error(result.error || "Falha ao enviar notificações push.", { id: toastId });
    }
  };

  // Preparar Fila de Envio WhatsApp (Semi-automático)
  const handlePrepareWhatsApp = async () => {
    if (!group) return;
    if (selectedPatientIds.length === 0) {
      toast.error("Selecione pelo menos um paciente para a fila.");
      return;
    }

    if (contentType === "diario" && (!startDate || !endDate)) {
      toast.error("Selecione o período de início e fim do diário.");
      return;
    }

    if (contentType === "arquivos" && selectedFiles.length === 0) {
      toast.error("Selecione pelo menos um material para envio.");
      return;
    }

    setPreparingQueue(true);
    const toastId = toast.loading("Garantindo chaves de acesso e preparando fila...");

    try {
      const queueItems: WhatsAppQueueItem[] = [];

      for (const patientId of selectedPatientIds) {
        const patient = group.patients.find(p => p.id === patientId);
        if (!patient) continue;

        if (!patient.phone) {
          toast.warning(`Paciente ${patient.name} não possui número de telefone cadastrado. Ele foi pulado da fila.`);
          continue;
        }

        // Garante que o paciente possui o accessToken para acessar o portal privado
        let token = patient.accessToken;
        if (!token) {
          const resToken = await ensurePatientAccessToken(patient.id);
          if (resToken.success && resToken.accessToken) {
            token = resToken.accessToken;
          } else {
            token = "sem-token";
          }
        }

        queueItems.push({
          patientId: patient.id,
          name: patient.name,
          phone: patient.phone.replace(/\D/g, ""), // Limpa o telefone para o link wa.me
          token: token || "",
          status: "pending"
        });
      }

      setWhatsappQueue(queueItems);
      toast.success("Fila de WhatsApp criada com sucesso! Acesse o painel da direita para enviar.", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao preparar fila de envio.", { id: toastId });
    } finally {
      setPreparingQueue(false);
    }
  };

  // Executa o envio individual do WhatsApp
  const handleSendWhatsAppIndividual = (item: WhatsAppQueueItem) => {
    setWhatsappQueue(prev => 
      prev.map(q => q.patientId === item.patientId ? { ...q, status: "sending" } : q)
    );

    const baseUrl = window.location.origin;
    let messageContent = "";

    const cleanName = item.name.split(" ")[0]; // Pega primeiro nome do paciente para ser mais amigável

    if (contentType === "mensagem") {
      messageContent = `Olá ${cleanName}! ${message}`;
    } else if (contentType === "diario") {
      const fmtStart = new Date(startDate + "T12:00:00").toLocaleDateString("pt-BR");
      const fmtEnd = new Date(endDate + "T12:00:00").toLocaleDateString("pt-BR");
      const link = `${baseUrl}/p/${item.token}/diario`;
      
      messageContent = `Olá ${cleanName}, aqui é da KinesisLab. Por favor, registre o seu Diário de Dor de ${fmtStart} até ${fmtEnd} pelo link: ${link}`;
      if (message.trim()) {
        messageContent += `\n\nOrientação complementar:\n${message}`;
      }
    } else {
      // Arquivos
      const fileLinks = selectedFiles.map(f => `👉 ${f.title}: ${f.url}`).join("\n");
      messageContent = `Olá ${cleanName}, aqui estão os materiais de apoio da KinesisLab selecionados para você:\n\n${fileLinks}`;
      if (message.trim()) {
        messageContent += `\n\nOrientação complementar:\n${message}`;
      }
    }

    const encodedMessage = encodeURIComponent(messageContent);
    const waUrl = `https://wa.me/${item.phone}?text=${encodedMessage}`;
    
    window.open(waUrl, "_blank");

    // Marca como enviado após um pequeno delay para feedback visual
    setTimeout(() => {
      setWhatsappQueue(prev => 
        prev.map(q => q.patientId === item.patientId ? { ...q, status: "sent" } : q)
      );
      toast.success(`Mensagem aberta para ${item.name}!`);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p style={{ marginTop: "1rem" }}>Carregando dados do grupo...</p>
        <style jsx>{`
          .loading-screen {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background-color: var(--bg);
            color: var(--text);
          }
          :global(.animate-spin) {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="group-page">
      <div className="background-gradient" />
      <Header />

      <main className="container main-content">
        {/* Back and Page Header */}
        <header className="page-header">
          <button className="back-btn" onClick={() => router.push("/dashboard")}>
            <ArrowLeft size={18} />
            <span>Voltar ao Painel</span>
          </button>
          
          <div className="title-row">
            <div className="title-info">
              <h2>Grupo: {group.name}</h2>
              <p className="subtitle">
                <Users size={16} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: "4px" }} />
                {group.patients.length} membros associados • Canal de Envio Integrado
              </p>
            </div>
          </div>
        </header>

        {/* 2-Column Grid */}
        <div className="layout-grid">
          
          {/* LADO ESQUERDO: PAINEL DE DISPARO */}
          <div className="column card-panel message-panel">
            <h3 className="panel-title">
              <Send size={18} className="icon-primary" />
              1. Preparar Conteúdo
            </h3>

            {/* Type selector Tabs */}
            <div className="tabs-container">
              <button 
                className={`tab-btn ${contentType === "mensagem" ? "active" : ""}`}
                onClick={() => setContentType("mensagem")}
              >
                <MessageCircle size={16} />
                <span>Mensagem</span>
              </button>
              <button 
                className={`tab-btn ${contentType === "diario" ? "active" : ""}`}
                onClick={() => setContentType("diario")}
              >
                <CalendarRange size={16} />
                <span>Diário de Dor</span>
              </button>
              <button 
                className={`tab-btn ${contentType === "arquivos" ? "active" : ""}`}
                onClick={() => setContentType("arquivos")}
              >
                <BookOpen size={16} />
                <span>Materiais</span>
              </button>
            </div>

            {/* Form Fields according to selected tab */}
            <div className="tab-content scrollbar">
              {contentType === "mensagem" && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="form-group">
                    <label className="form-label">Título da Notificação Push</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Lembrete Importante" 
                      className="form-input" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mensagem Personalizada</label>
                    <textarea 
                      placeholder="Escreva a mensagem que deseja enviar para os membros do grupo..." 
                      className="form-input textarea" 
                      value={message} 
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                    />
                  </div>
                </motion.div>
              )}

              {contentType === "diario" && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Data de Início</label>
                      <input 
                        type="date" 
                        className="form-input" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)} 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Data de Fim</label>
                      <input 
                        type="date" 
                        className="form-input" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)} 
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Orientação Complementar (Opcional)</label>
                    <textarea 
                      placeholder="Ex: Por favor, lembre-se de preencher sempre ao final do dia." 
                      className="form-input textarea" 
                      value={message} 
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                    />
                  </div>
                </motion.div>
              )}

              {contentType === "arquivos" && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="form-group">
                    <label className="form-label">Mensagem de Apresentação (Opcional)</label>
                    <textarea 
                      placeholder="Ex: Olá, aqui estão alguns materiais úteis para a sua reabilitação." 
                      className="form-input textarea" 
                      value={message} 
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ marginBottom: "0.75rem", display: "block" }}>
                      Selecione os Materiais da Biblioteca ({selectedFiles.length} selecionados):
                    </label>
                    
                    <div className="library-container">
                      {libraryFolders.length === 0 ? (
                        <p className="no-data-msg">Sua biblioteca de materiais está vazia.</p>
                      ) : (
                        libraryFolders.map(folder => {
                          const isExpanded = expandedFolders.includes(folder.id);
                          return (
                            <div key={folder.id} className="folder-item">
                              <div className="folder-header" onClick={() => toggleFolder(folder.id)}>
                                <Folder size={18} className="folder-icon" />
                                <span className="folder-name">{folder.name}</span>
                                <ChevronRight size={16} className={`chevron ${isExpanded ? "rotated" : ""}`} />
                              </div>

                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="folder-files-list"
                                  >
                                    {folder.files.map((file: any) => {
                                      const isChecked = selectedFiles.some(f => f.id === file.id);
                                      return (
                                        <label key={file.id} className="file-checkbox-label">
                                          <input 
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => toggleFileSelection(file)}
                                            className="file-checkbox"
                                          />
                                          <div className="file-info">
                                            <span className="file-title">{file.title}</span>
                                            <span className="file-type-badge">{file.type.toUpperCase()}</span>
                                          </div>
                                        </label>
                                      );
                                    })}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Action buttons */}
            <div className="panel-actions">
              <button 
                type="button" 
                className="btn-primary push-send-btn" 
                onClick={handleSendPush}
              >
                <Send size={18} />
                <span>Notificação Push (Lote)</span>
              </button>
              
              <button 
                type="button" 
                className="btn-primary wa-prep-btn" 
                onClick={handlePrepareWhatsApp}
                disabled={preparingQueue}
              >
                {preparingQueue ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <MessageCircle size={18} />
                )}
                <span>Preparar Fila WhatsApp</span>
              </button>
            </div>
          </div>

          {/* LADO DIREITO: SELEÇÃO DE DESTINATÁRIOS & FILA DE WHATSAPP */}
          <div className="column layout-right-column">
            
            {/* Bloco 1: Seleção de Destinatários */}
            <div className="card-panel recipients-panel">
              <div className="recipients-header">
                <h3 className="panel-title" style={{ margin: 0 }}>
                  <User size={18} className="icon-primary" />
                  2. Destinatários
                </h3>
                
                <button 
                  className="select-all-btn"
                  onClick={handleSelectAllMembers}
                >
                  {selectedPatientIds.length === group.patients.length ? "Deselecionar Todos" : "Selecionar Todos"}
                </button>
              </div>

              <div className="members-list scrollbar">
                {group.patients.map(patient => {
                  const isSelected = selectedPatientIds.includes(patient.id);
                  return (
                    <label 
                      key={patient.id} 
                      className={`member-row ${isSelected ? "selected" : ""}`}
                    >
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => handleSelectMember(patient.id)}
                        className="member-checkbox"
                      />
                      <div className="member-details">
                        <span className="member-name">{patient.name}</span>
                        <span className="member-meta">
                          {patient.phone ? patient.phone : "Sem telefone"} 
                          {patient.age ? ` • ${patient.age} anos` : ""}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Bloco 2: Fila do WhatsApp */}
            <div className="card-panel wa-queue-panel">
              <h3 className="panel-title">
                <Phone size={18} className="icon-whatsapp" />
                Fila de WhatsApp
              </h3>

              {whatsappQueue.length === 0 ? (
                <div className="queue-empty-state">
                  <p>A fila de WhatsApp está vazia no momento.</p>
                  <p className="tip">Selecione os destinatários à esquerda, configure a mensagem e clique em <strong>"Preparar Fila WhatsApp"</strong> para gerar os links personalizados.</p>
                </div>
              ) : (
                <div className="queue-list scrollbar">
                  {whatsappQueue.map((item, idx) => (
                    <div key={item.patientId} className={`queue-item ${item.status}`}>
                      <div className="queue-item-info">
                        <span className="queue-idx">#{idx + 1}</span>
                        <div className="queue-patient-desc">
                          <span className="queue-name">{item.name}</span>
                          <span className="queue-phone">{item.phone}</span>
                        </div>
                      </div>

                      <div className="queue-action-state">
                        {item.status === "sent" ? (
                          <span className="status-badge sent">
                            <Check size={14} /> Enviado
                          </span>
                        ) : item.status === "sending" ? (
                          <span className="status-badge sending">
                            <Loader2 size={12} className="animate-spin" /> Processando...
                          </span>
                        ) : (
                          <button 
                            className="btn-send-wa"
                            onClick={() => handleSendWhatsAppIndividual(item)}
                          >
                            <MessageCircle size={16} />
                            <span>Enviar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      </main>

      <style jsx>{`
        .group-page {
          min-height: 100vh;
          background-color: var(--bg);
          color: var(--text);
        }
        .main-content {
          padding: 2rem 1.5rem;
        }
        .page-header {
          margin-bottom: 2rem;
          margin-top: 1rem;
        }
        .back-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 1rem;
          transition: color 0.2s;
          padding: 0;
        }
        .back-btn:hover {
          color: var(--primary);
        }
        .title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .title-row h2 {
          font-size: 2.25rem;
          font-weight: 800;
          margin: 0 0 0.25rem 0;
          letter-spacing: -0.025em;
        }
        .subtitle {
          color: var(--text-muted);
          margin: 0;
          font-size: 0.95rem;
        }

        .layout-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 2rem;
          align-items: start;
        }
        .column {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          min-width: 0;
        }
        .layout-right-column {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .card-panel {
          background: white;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border);
          padding: 1.75rem;
          box-shadow: var(--shadow-lg);
        }
        .panel-title {
          font-size: 1.125rem;
          font-weight: bold;
          margin: 0 0 1.25rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .icon-primary {
          color: var(--primary);
        }
        .icon-whatsapp {
          color: #25D366;
        }

        /* Tabs Styles */
        .tabs-container {
          display: flex;
          gap: 0.5rem;
          background-color: #f1f5f9;
          padding: 0.35rem;
          border-radius: var(--radius-lg);
          margin-bottom: 1.5rem;
        }
        .tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.6rem 0.5rem;
          border-radius: var(--radius-md);
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tab-btn.active {
          background-color: white;
          color: var(--text);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        /* Form Inputs */
        .tab-content {
          min-height: 250px;
          max-height: 400px;
          overflow-y: auto;
          margin-bottom: 1.5rem;
          padding-right: 0.5rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .form-label {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text);
        }
        .form-input {
          padding: 0.75rem 1rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          background-color: white;
          font-size: 0.95rem;
          transition: all 0.2s;
          color: var(--text);
        }
        .form-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-light);
        }
        .textarea {
          resize: vertical;
          min-height: 100px;
        }

        /* Action Buttons */
        .panel-actions {
          display: flex;
          gap: 1rem;
        }
        .push-send-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background-color: var(--primary);
          color: white;
          border: none;
          padding: 0.85rem;
          font-weight: 600;
          cursor: pointer;
        }
        .wa-prep-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background-color: #25D366;
          color: white;
          border: none;
          padding: 0.85rem;
          font-weight: 600;
          cursor: pointer;
        }
        .wa-prep-btn:hover {
          background-color: #20ba5a;
        }
        .wa-prep-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Folder Structure for Materials */
        .library-container {
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          background-color: #fcfcfc;
          padding: 0.5rem;
        }
        .folder-item {
          margin-bottom: 0.5rem;
          border: 1px solid #f0f0f0;
          border-radius: var(--radius-md);
          background: white;
          overflow: hidden;
        }
        .folder-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
          user-select: none;
        }
        .folder-header:hover {
          background-color: #fafafa;
        }
        .folder-icon {
          color: #f59e0b;
        }
        .folder-name {
          font-weight: 600;
          font-size: 0.95rem;
          flex: 1;
        }
        .chevron {
          transition: transform 0.2s;
          color: var(--text-muted);
        }
        .chevron.rotated {
          transform: rotate(90deg);
        }
        .folder-files-list {
          padding: 0.5rem 1rem 0.75rem 2.25rem;
          border-top: 1px solid #f3f4f6;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          background-color: #fafbfd;
        }
        .file-checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          padding: 0.4rem 0;
        }
        .file-checkbox {
          width: 16px;
          height: 16px;
          accent-color: var(--primary);
        }
        .file-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }
        .file-title {
          font-weight: 500;
          color: var(--text);
        }
        .file-type-badge {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 1px 4px;
          border-radius: 4px;
          background-color: #e2e8f0;
          color: #475569;
        }

        /* Recipients Panel */
        .recipients-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 0.75rem;
        }
        .select-all-btn {
          background: transparent;
          border: none;
          color: var(--primary);
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
        }
        .select-all-btn:hover {
          text-decoration: underline;
        }
        .members-list {
          max-height: 200px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .member-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.6rem 0.75rem;
          border: 1px solid #f0f0f0;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s;
        }
        .member-row:hover {
          background-color: #f8fafc;
        }
        .member-row.selected {
          border-color: var(--primary-light);
          background-color: var(--primary-light) 5;
        }
        .member-checkbox {
          width: 18px;
          height: 18px;
          accent-color: var(--primary);
        }
        .member-details {
          display: flex;
          flex-direction: column;
        }
        .member-name {
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--text);
        }
        .member-meta {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        /* WhatsApp Queue Panel */
        .queue-empty-state {
          text-align: center;
          padding: 2rem 1rem;
          color: var(--text-muted);
          font-size: 0.9rem;
          line-height: 1.6;
        }
        .queue-empty-state .tip {
          font-size: 0.8rem;
          margin-top: 0.5rem;
        }
        .queue-list {
          max-height: 250px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .queue-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          background-color: white;
          transition: all 0.2s;
        }
        .queue-item.sending {
          border-color: #fbbf24;
          background-color: #fffbeb;
        }
        .queue-item.sent {
          border-color: #bbf7d0;
          background-color: #f0fdf4;
          opacity: 0.85;
        }
        .queue-item-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .queue-idx {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-muted);
        }
        .queue-patient-desc {
          display: flex;
          flex-direction: column;
        }
        .queue-name {
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--text);
        }
        .queue-phone {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .btn-send-wa {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background-color: #25D366;
          color: white;
          border: none;
          padding: 0.4rem 0.75rem;
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: 0.8rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .btn-send-wa:hover {
          background-color: #1faf58;
        }
        .status-badge {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .status-badge.sent {
          background-color: #dcfce7;
          color: #15803d;
        }
        .status-badge.sending {
          background-color: #fef3c7;
          color: #b45309;
        }

        /* Scrollbar custom styles */
        .scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        @media (max-width: 1024px) {
          .layout-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          .layout-right-column {
            gap: 1.5rem;
          }
        }
        @media (max-width: 768px) {
          .title-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          .title-row h2 {
            font-size: 1.75rem;
          }
          .panel-actions {
            flex-direction: column;
          }
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
