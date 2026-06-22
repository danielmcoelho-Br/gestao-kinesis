"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  ClipboardList, 
  Activity, 
  ChevronRight,
  User,
  History,
  TrendingUp,
  Trash2,
  Pencil,
  AlertTriangle,
  ExternalLink,
  MessageCircle,
  Mic,
  MicOff,
  Send,
  Folder,
  FolderPlus,
  FileText,
  Video,
  X,
  XCircle,
  CalendarRange,
  Clock,
  Sparkles,
  CheckCircle2,
  Archive,
  ChevronDown,
  ChevronUp
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import { 
  getPatientAssessments, 
  deleteAssessment, 
  ensurePatientAccessToken,
  getPatientEvolutions,
  createPatientEvolution,
  updatePatientEvolution,
  deletePatientEvolution,
  getPatientDiaryHistory,
  getPatientDiagnoses,
  addPatientDiagnosis,
  updatePatientDiagnosisStatus,
  updatePatientDiagnosis,
  deletePatientDiagnosis,
  getClinicalSegmentsAndSuggestions
} from "../../actions";
import { sendPushNotification } from "@/app/(integracao)/actions/push";
import { questionnairesData } from "@/lab/data/questionnaires";
import Header from "@/lab/components/Header";
import ConfirmModal from "@/lab/components/ConfirmModal";
import PatientDocuments from "@/lab/components/PatientDocuments";
import { toast } from "sonner";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';


export default function PatientHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.patientId as string;

  const [assessments, setAssessments] = useState<any[]>([]);
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<'avaliacoes' | 'evolucoes' | 'integracao'>('avaliacoes');

  // Deletion State
  const [assessmentToDelete, setAssessmentToDelete] = useState<any>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Diagnoses States
  const [diagnoses, setDiagnoses] = useState<any[]>([]);
  const [clinicalSegments, setClinicalSegments] = useState<any[]>([]);
  const [loadingDiagnoses, setLoadingDiagnoses] = useState(true);
  const [isAddDiagOpen, setIsAddDiagOpen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState("");
  const [selectedDiagnosis, setSelectedDiagnosis] = useState("");
  const [customSegment, setCustomSegment] = useState("");
  const [customDiagnosis, setCustomDiagnosis] = useState("");
  const [diagStartDate, setDiagStartDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Discharge State
  const [diagToDischarge, setDiagToDischarge] = useState<any>(null);
  const [dischargeDate, setDischargeDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isDropout, setIsDropout] = useState(false);

  // Edit Diagnosis State
  const [diagToEdit, setDiagToEdit] = useState<any>(null);
  const [editSegment, setEditSegment] = useState("");
  const [editDiagnosis, setEditDiagnosis] = useState("");
  const [customEditSegment, setCustomEditSegment] = useState("");
  const [customEditDiagnosis, setCustomEditDiagnosis] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editStatus, setEditStatus] = useState("ATIVO");
  const [editDischargeDate, setEditDischargeDate] = useState("");

  // Delete State
  const [diagToDelete, setDiagToDelete] = useState<any>(null);

  // History Accordion State
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  // Evolutions State
  const [evolutions, setEvolutions] = useState<any[]>([]);
  const [evolutionContent, setEvolutionContent] = useState("");
  const [evolutionDate, setEvolutionDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingEvolutionId, setEditingEvolutionId] = useState<string | null>(null);
  const [loadingEvolutions, setLoadingEvolutions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const evolutionTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Integration State
  const [diaryLogs, setDiaryLogs] = useState<any[]>([]);
  const [loadingDiary, setLoadingDiary] = useState(false);
  const [contentType, setContentType] = useState<'mensagem' | 'diario' | 'arquivos'>('mensagem');
  
  // Custom message form fields
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  
  // Diary options
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [scheduleTimes, setScheduleTimes] = useState<string[]>(["08:00"]);
  const [scheduleDays, setScheduleDays] = useState<number[]>([1, 2, 3, 4, 5]); // Seg a Sex

  // Files options
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [libraryFolders, setLibraryFolders] = useState<any[]>([]);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showAddFile, setShowAddFile] = useState<string | null>(null); // FolderId
  const [newFileTitle, setNewFileTitle] = useState("");
  const [newFileUrl, setNewFileUrl] = useState("");
  const [newFileType, setNewFileType] = useState<"video" | "pdf">("pdf");

  // Local communications logs
  const [sentLogs, setSentLogs] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const result = await getPatientAssessments(patientId);
    if (result.success && result.data) {
      setAssessments(result.data.assessments || []);
      setPatient(result.data.patient);
    }
    setLoading(false);
  };

  const fetchEvolutions = async () => {
    setLoadingEvolutions(true);
    const res = await getPatientEvolutions(patientId);
    if (res.success && res.data) {
      setEvolutions(res.data);
    }
    setLoadingEvolutions(false);
  };

  const fetchDiaryLogs = async () => {
    setLoadingDiary(true);
    const res = await getPatientDiaryHistory(patientId);
    if (res.success && res.data) {
      setDiaryLogs(res.data);
    }
    setLoadingDiary(false);
  };

  const fetchDiagnoses = async () => {
    setLoadingDiagnoses(true);
    const result = await getPatientDiagnoses(patientId);
    if (result.success && result.data) {
      setDiagnoses(result.data);
    }
    setLoadingDiagnoses(false);
  };

  const fetchSuggestions = async () => {
    const res = await getClinicalSegmentsAndSuggestions();
    if (res.success && res.data) {
      setClinicalSegments(res.data);
    }
  };

  const handleAddDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSegment) {
      toast.error("Por favor, selecione um segmento.");
      return;
    }

    let segment = selectedSegment;
    if (selectedSegment === "Outros" && customSegment.trim()) {
      segment = customSegment.trim();
    } else if (selectedSegment === "Outros") {
      toast.error("Por favor, digite o nome do segmento.");
      return;
    }

    let diagnosisName = selectedDiagnosis;
    if (selectedDiagnosis === "Outro" && customDiagnosis.trim()) {
      diagnosisName = customDiagnosis.trim();
    } else if (selectedDiagnosis === "Outro") {
      toast.error("Por favor, digite o diagnóstico.");
      return;
    } else if (selectedSegment === "Outros" && customDiagnosis.trim()) {
      diagnosisName = customDiagnosis.trim();
    } else if (selectedSegment === "Outros") {
      toast.error("Por favor, digite o diagnóstico.");
      return;
    }

    if (!diagnosisName) {
      toast.error("Por favor, selecione ou digite um diagnóstico.");
      return;
    }

    try {
      const res = await addPatientDiagnosis(patientId, {
        segment,
        diagnosis: diagnosisName,
        start_date: new Date(diagStartDate)
      });

      if (res.success) {
        toast.success("Diagnóstico adicionado com sucesso!");
        setIsAddDiagOpen(false);
        setSelectedSegment("");
        setSelectedDiagnosis("");
        setCustomSegment("");
        setCustomDiagnosis("");
        setDiagStartDate(new Date().toISOString().split('T')[0]);
        fetchDiagnoses();
        fetchSuggestions();
      } else {
        toast.error(res.error || "Erro ao adicionar diagnóstico.");
      }
    } catch (err: any) {
      console.error("Erro ao salvar diagnóstico:", err);
      toast.error("Sessão expirada ou erro de rede. Por favor, recarregue a página.");
    }
  };

  const handleDischargeConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagToDischarge) return;

    try {
      const status = isDropout ? "DESISTENCIA" : "ALTA";
      const res = await updatePatientDiagnosisStatus(diagToDischarge.id, status, new Date(dischargeDate));
      if (res.success) {
        toast.success(isDropout ? "Desistência registrada com sucesso!" : "Alta registrada com sucesso!");
        setDiagToDischarge(null);
        setDischargeDate(new Date().toISOString().split('T')[0]);
        setIsDropout(false);
        fetchDiagnoses();
      } else {
        toast.error(res.error || (isDropout ? "Erro ao registrar desistência." : "Erro ao registrar alta."));
      }
    } catch (err: any) {
      console.error("Erro ao registrar status de diagnóstico:", err);
      toast.error("Sessão expirada ou erro de rede. Por favor, recarregue a página.");
    }
  };

  const handleEditClick = (diag: any) => {
    setDiagToEdit(diag);
    
    // Check if the segment exists in our segments list
    const segmentList = getSegmentsList();
    if (segmentList.includes(diag.segment)) {
      setEditSegment(diag.segment);
      setCustomEditSegment("");
    } else {
      setEditSegment("Outros");
      setCustomEditSegment(diag.segment);
    }
    
    // Check if the diagnosis exists in the segment suggestions
    const diagList = getDiagnosesForSegment(diag.segment);
    if (diagList.includes(diag.diagnosis)) {
      setEditDiagnosis(diag.diagnosis);
      setCustomEditDiagnosis("");
    } else {
      setEditDiagnosis("Outro");
      setCustomEditDiagnosis(diag.diagnosis);
    }
    
    setEditStartDate(new Date(diag.start_date).toISOString().split('T')[0]);
    setEditStatus(diag.status);
    setEditDischargeDate(diag.discharge_date ? new Date(diag.discharge_date).toISOString().split('T')[0] : "");
  };

  const handleEditConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagToEdit) return;

    try {
      const finalSegment = editSegment === "Outros" ? customEditSegment : editSegment;
      const finalDiagnosis = (editSegment === "Outros" || editDiagnosis === "Outro") ? customEditDiagnosis : editDiagnosis;
      const finalStatus = editStatus;
      const finalDischargeDate = (editStatus === "ALTA" || editStatus === "DESISTENCIA") 
        ? (editDischargeDate ? new Date(editDischargeDate) : new Date())
        : null;

      const res = await updatePatientDiagnosis(diagToEdit.id, {
        segment: finalSegment,
        diagnosis: finalDiagnosis,
        start_date: new Date(editStartDate),
        status: finalStatus,
        discharge_date: finalDischargeDate
      });

      if (res.success) {
        toast.success("Diagnóstico atualizado com sucesso!");
        setDiagToEdit(null);
        fetchDiagnoses();
      } else {
        toast.error(res.error || "Erro ao atualizar diagnóstico.");
      }
    } catch (err: any) {
      console.error("Erro ao atualizar diagnóstico:", err);
      toast.error("Erro ao processar atualização.");
    }
  };

  const handleDeleteDiagConfirm = async () => {
    if (!diagToDelete) return;

    try {
      const res = await deletePatientDiagnosis(diagToDelete.id);
      if (res.success) {
        toast.success("Diagnóstico excluído com sucesso!");
        setDiagToDelete(null);
        fetchDiagnoses();
      } else {
        toast.error(res.error || "Erro ao excluir diagnóstico.");
      }
    } catch (err: any) {
      console.error("Erro ao excluir diagnóstico:", err);
      toast.error("Sessão expirada ou erro de rede. Por favor, recarregue a página.");
    }
  };

  useEffect(() => {
    setIsMounted(true);
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));

    fetchData();
    fetchEvolutions();
    fetchDiaryLogs();
    fetchDiagnoses();
    fetchSuggestions();
    loadLibraryFromLocalStorage();
    loadSentLogsFromLocalStorage();
  }, [patientId]);

  // Speech-to-Text initialization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'pt-BR';

        rec.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (finalTranscript) {
            setEvolutionContent(prev => prev + (prev ? " " : "") + finalTranscript);
          }
        };

        rec.onerror = (event: any) => {
          console.error("Speech recognition error", event);
          setIsRecording(false);
          toast.error("Erro na gravação: " + event.error);
        };

        rec.onend = () => {
          setIsRecording(false);
        };

        setRecognition(rec);
      }
    }
  }, []);

  // --- LOCAL LIBRARY STORAGE ---
  const loadLibraryFromLocalStorage = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("kinesis_asset_library_folders");
      if (saved) {
        setLibraryFolders(JSON.parse(saved));
      } else {
        const defaults = [
          {
            id: "f-1",
            name: "Joelho e Quadril",
            files: [
              { id: "fi-1", title: "Exercício de Mobilidade de Joelho (Vídeo)", url: "https://www.youtube.com/watch?v=knee-mob-1", type: "video" },
              { id: "fi-2", title: "Guia de Reabilitação Pós-Operatória (PDF)", url: "https://kinesis.com.br/materiais/guia-joelho.pdf", type: "pdf" }
            ]
          },
          {
            id: "f-2",
            name: "Coluna Lombar",
            files: [
              { id: "fi-3", title: "Alongamento Cat-Cow (Vídeo)", url: "https://www.youtube.com/watch?v=cat-cow", type: "video" },
              { id: "fi-4", title: "Cartilha de Postura Ergonomica (PDF)", url: "https://kinesis.com.br/materiais/cartilha-lombar.pdf", type: "pdf" }
            ]
          }
        ];
        localStorage.setItem("kinesis_asset_library_folders", JSON.stringify(defaults));
        setLibraryFolders(defaults);
      }
    }
  };

  const loadSentLogsFromLocalStorage = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("kinesis_integration_sent_logs");
      if (saved) {
        const parsed = JSON.parse(saved);
        const filtered = parsed.filter((log: any) => log.patientId === patientId);
        setSentLogs(filtered.reverse());
      }
    }
  };

  const saveSentLog = (type: string, details: string) => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("kinesis_integration_sent_logs");
      const parsed = saved ? JSON.parse(saved) : [];
      const newLog = {
        id: "log-" + Date.now(),
        patientId,
        patientName: patient?.name || "Paciente",
        type,
        details,
        createdAt: new Date().toISOString()
      };
      parsed.push(newLog);
      localStorage.setItem("kinesis_integration_sent_logs", JSON.stringify(parsed));
      setSentLogs(prev => [newLog, ...prev]);
    }
  };

  // --- SPEECH CONTROL ---
  const toggleRecording = () => {
    if (!recognition) {
      toast.error("O Speech-to-Text não é suportado neste navegador.");
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
      toast.success("Gravação por voz pausada.");
    } else {
      try {
        recognition.start();
        setIsRecording(true);
        toast.success("Microfone ativado! Fale para transcrever.");
      } catch (e) {
        console.error(e);
        toast.error("Erro ao ativar o microfone.");
      }
    }
  };

  // --- SAVE EVOLUTION ---
  const handleSaveEvolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evolutionContent.trim()) {
      toast.error("O conteúdo da evolução não pode ser vazio.");
      return;
    }

    toast.loading("Salvando evolução...", { id: 'save-evolution' });
    
    if (editingEvolutionId) {
      const res = await updatePatientEvolution(editingEvolutionId, evolutionContent, new Date(evolutionDate));
      toast.dismiss('save-evolution');
      if (res.success) {
        toast.success("Evolução atualizada com sucesso!");
        setEditingEvolutionId(null);
        setEvolutionContent("");
        setEvolutionDate(new Date().toISOString().split('T')[0]);
        fetchEvolutions();
      } else {
        toast.error(res.error || "Erro ao salvar.");
      }
    } else {
      const res = await createPatientEvolution({
        patientId,
        content: evolutionContent,
        date: new Date(evolutionDate),
        createdById: user?.id
      });
      toast.dismiss('save-evolution');
      if (res.success) {
        toast.success("Evolução registrada com sucesso!");
        setEvolutionContent("");
        setEvolutionDate(new Date().toISOString().split('T')[0]);
        fetchEvolutions();
      } else {
        toast.error(res.error || "Erro ao salvar.");
      }
    }
  };

  const handleEditEvolution = (evo: any) => {
    setEditingEvolutionId(evo.id);
    setEvolutionContent(evo.content);
    setEvolutionDate(new Date(evo.date).toISOString().split('T')[0]);
    if (evolutionTextareaRef.current) {
      evolutionTextareaRef.current.focus();
    }
    toast.info("Evolução carregada no editor para alteração.");
  };

  const handleDeleteEvolutionClick = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente esta evolução?")) return;
    
    toast.loading("Excluindo evolução...", { id: 'delete-evolution' });
    const res = await deletePatientEvolution(id);
    toast.dismiss('delete-evolution');
    
    if (res.success) {
      toast.success("Evolução excluída!");
      fetchEvolutions();
      if (editingEvolutionId === id) {
        setEditingEvolutionId(null);
        setEvolutionContent("");
        setEvolutionDate(new Date().toISOString().split('T')[0]);
      }
    } else {
      toast.error(res.error || "Erro ao excluir.");
    }
  };

  // --- DISPATCHER HELPERS ---
  const toggleDay = (day: number) => {
    setScheduleDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const addTime = () => {
    setScheduleTimes(prev => [...prev, "08:00"]);
  };

  const updateTime = (idx: number, val: string) => {
    setScheduleTimes(prev => {
      const clone = [...prev];
      clone[idx] = val;
      return clone;
    });
  };

  const removeTime = (idx: number) => {
    setScheduleTimes(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSelectFile = (file: any) => {
    if (selectedFiles.some(f => f.id === file.id)) {
      setSelectedFiles(prev => prev.filter(f => f.id !== file.id));
    } else {
      setSelectedFiles(prev => [...prev, file]);
      toast.success(`Arquivo "${file.title}" adicionado à lista.`);
    }
  };

  const handleRemoveSelectedFile = (id: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    const newFolder = {
      id: "f-" + Date.now(),
      name: newFolderName,
      files: []
    };
    const updated = [...libraryFolders, newFolder];
    setLibraryFolders(updated);
    localStorage.setItem("kinesis_asset_library_folders", JSON.stringify(updated));
    setNewFolderName("");
    setShowAddFolder(false);
    toast.success("Pasta criada com sucesso!");
  };

  const handleAddFileToFolder = (folderId: string) => {
    if (!newFileTitle.trim() || !newFileUrl.trim()) return;
    const newFile = {
      id: "fi-" + Date.now(),
      title: newFileTitle,
      url: newFileUrl,
      type: newFileType
    };
    const updated = libraryFolders.map(folder => {
      if (folder.id === folderId) {
        return {
          ...folder,
          files: [...(folder.files || []), newFile]
        };
      }
      return folder;
    });
    setLibraryFolders(updated);
    localStorage.setItem("kinesis_asset_library_folders", JSON.stringify(updated));
    setNewFileTitle("");
    setNewFileUrl("");
    setShowAddFile(null);
    toast.success("Material adicionado com sucesso!");
  };

  // --- SEND INTEGRATIONS ---
  const getWhatsAppLink = async () => {
    let formattedText = "";
    
    let scheduleInfo = "";
    const validTimes = scheduleTimes.filter(t => t);
    if (validTimes.length > 0) {
      scheduleInfo += `\n\n📝 *Programação Programada:*\n` + validTimes.map(t => `⏰ *${t}*`).join("\n");
    }
    
    if (scheduleDays.length > 0) {
      const weekDayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
      const days = scheduleDays.map((d: number) => weekDayNames[d]).join(", ");
      scheduleInfo += `\n📅 *Dias:* ${days}`;
    }

    if (startDate && endDate) {
      const start = new Date(startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const end = new Date(endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      scheduleInfo += `\n⏳ *Período:* ${start} até ${end}`;
    }

    if (contentType === 'diario') {
      let token = patient?.accessToken;
      try {
        const res = await ensurePatientAccessToken(patientId);
        if (res.success && res.accessToken) {
          token = res.accessToken;
        }
      } catch (e) {
        console.error("Erro ao gerar token:", e);
      }

      const baseUrl = window.location.origin;
      const portalUrl = token ? `${baseUrl}/p/${token}/diario` : "Preencha via app.";

      formattedText = `📝 *Diário de Dor (Kinesis)*\n\n${message || "Olá! Por favor, acompanhe o seu diário de dor pelo nosso canal direto no link abaixo:"}${scheduleInfo}\n\n🔗 *Acesse aqui:* ${portalUrl}`;
    } else if (contentType === 'arquivos') {
      const linksList = selectedFiles.map((f: any) => `*${f.title}*\n🔗 ${f.url}`).join("\n\n");
      formattedText = `📂 *Materiais Compartilhados (Kinesis)*\n\n${message ? message + "\n\n" : ""}${linksList}${scheduleInfo}`;
    } else {
      formattedText = `🎈 *${title}*\n\n${message}${scheduleInfo}`;
    }

    const cleanPhone = (patient?.phone || "").replace(/\D/g, '');
    const messageUrl = encodeURIComponent(formattedText);
    return cleanPhone ? `https://wa.me/${cleanPhone}?text=${messageUrl}` : `https://wa.me/?text=${messageUrl}`;
  };

  const handleWhatsAppSend = async () => {
    if (contentType === 'diario' && (!startDate || !endDate)) {
      toast.error("Preencha as datas de início e fim do Diário de Dor.");
      return;
    }
    if (contentType === 'arquivos' && selectedFiles.length === 0) {
      toast.error("Selecione ao menos um arquivo da biblioteca.");
      return;
    }
    if (contentType === 'mensagem' && (!title || !message)) {
      toast.error("Preencha o título e a mensagem.");
      return;
    }

    toast.loading("Processando link do WhatsApp...", { id: 'wa' });
    const finalLink = await getWhatsAppLink();
    toast.dismiss('wa');
    
    window.open(finalLink, '_blank');
    saveSentLog("WhatsApp", `${contentType === 'diario' ? 'Solicitação de Diário de Dor' : contentType === 'arquivos' ? `${selectedFiles.length} arquivos enviados` : title}`);
    toast.success("Mensagem aberta no WhatsApp!");
  };

  const handleSendPush = async () => {
    if (contentType === 'diario' && (!startDate || !endDate)) {
      toast.error("Preencha as datas de início e fim do Diário de Dor.");
      return;
    }
    if (contentType === 'arquivos' && selectedFiles.length === 0) {
      toast.error("Selecione ao menos um arquivo da biblioteca.");
      return;
    }
    if (contentType === 'mensagem' && (!title || !message)) {
      toast.error("Preencha o título e a mensagem.");
      return;
    }

    toast.loading("Enviando push notification...", { id: 'push' });
    
    const payloadTitle = contentType === 'diario' ? 'Diário de Dor Kinesis' : contentType === 'arquivos' ? 'Novos Materiais Recebidos' : title;
    let payloadBody = message || 'Você recebeu uma atualização clínica do seu terapeuta.';
    if (contentType === 'arquivos') {
      payloadBody = `${message ? message + ' ' : ''}Arquivos anexados: ${selectedFiles.map(f => f.title).join(', ')}`;
    }

    const res = await sendPushNotification([patientId], { title: payloadTitle, body: payloadBody });
    toast.dismiss('push');
    
    if (res.success) {
      toast.success(`Notificação Push enviada para o dispositivo!`);
      saveSentLog("Push Notification", `${payloadTitle}: ${payloadBody}`);
    } else {
      toast.error("Dispositivo do paciente não possui inscrição ativa.");
    }
  };

  const handleDeleteAssessment = (e: React.MouseEvent, assessment: any) => {
    e.stopPropagation();
    setAssessmentToDelete(assessment);
    setIsConfirmModalOpen(true);
  };

  const confirmDeleteAssessment = async () => {
    if (!assessmentToDelete) return;
    
    const id = assessmentToDelete.id;
    const result = await deleteAssessment(id);
    
    if (result.success) {
      setAssessments(prev => prev.filter(p => p.id !== id));
      toast.success("Avaliação excluída com sucesso!");
    } else {
      toast.error(result.error);
    }
    setAssessmentToDelete(null);
  };

  const typeCounts = assessments.reduce((acc: any, curr: any) => {
    acc[curr.assessment_type] = (acc[curr.assessment_type] || 0) + 1;
    return acc;
  }, {});

  const hasEvolution = Object.values(typeCounts).some((count: any) => count > 1);

  // Recharts Graph Data compiler
  const chartData = diaryLogs.map(log => ({
    data: new Date(log.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    dor: log.painLevel
  }));

  const weekDays = [
    { id: 1, label: "S" },
    { id: 2, label: "T" },
    { id: 3, label: "Q" },
    { id: 4, label: "Q" },
    { id: 5, label: "S" },
    { id: 6, label: "S" },
    { id: 0, label: "D" }
  ];

  const getDiagnosesForSegment = (segName: string): string[] => {
    const found = clinicalSegments.find((s: any) => s.name === segName);
    if (!found) return [];
    return found.suggestions.map((s: any) => s.diagnosis as string).filter(Boolean);
  };

  const getSegmentsList = (): string[] => {
    const list = clinicalSegments.map((s: any) => s.name as string);
    if (!list.includes("Outros")) {
      list.push("Outros");
    }
    return list;
  };

  return (
    <div className="patient-history-page">
      <div className="background-gradient" />
      
      <Header showBackButton />

      <header className="container patient-header-section">
        {patient && (
          <div className="header-content stack-on-mobile">
            <div className="patient-main-info">
              <div className="avatar-wrapper" style={{ backgroundColor: '#9d1d1d' }}>
                <User size={40} />
              </div>
              <div className="text-info text-center-mobile">
                <h1>{patient.name}</h1>
                <p>{patient.age || 'N/A'} anos | {patient.gender || 'Não especificado'} | {patient.phone || 'Sem Telefone'}</p>
                <p className="patient-id-tag">ID do Paciente: {patient.id.slice(-8).toUpperCase()}</p>
              </div>
            </div>

            <div className="header-actions">
              {hasEvolution && (
                <button 
                  className="btn-primary secondary-btn"
                  onClick={() => router.push(`/dashboard/patient/${patientId}/evolution`)}
                >
                  <TrendingUp size={20} />
                  <span>Histórico Clínico</span>
                </button>
              )}
              <button 
                className="btn-primary"
                onClick={() => router.push(`/dashboard/assessment/select-segment/${patientId}`)}
              >
                <Plus size={20} />
                <span>Nova Avaliação</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Tab Switcher Navigation */}
      <div className="container" style={{ marginBottom: '1.5rem' }}>
        <div className="tab-switcher-wrapper">
          <button 
            onClick={() => setActiveTab('avaliacoes')}
            className={`tab-switch-btn ${activeTab === 'avaliacoes' ? 'active' : ''}`}
          >
            <ClipboardList size={18} />
            <span>Avaliações & Documentos</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('evolucoes')}
            className={`tab-switch-btn ${activeTab === 'evolucoes' ? 'active' : ''}`}
          >
            <Mic size={18} />
            <span>Diários de Evolução (Voz)</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('integracao')}
            className={`tab-switch-btn ${activeTab === 'integracao' ? 'active' : ''}`}
          >
            <MessageCircle size={18} />
            <span>Integração & WhatsApp</span>
          </button>
        </div>
      </div>

      <main className="container main-content">
        <AnimatePresence mode="wait">
          {/* TAB 1: AVALIAÇÕES */}
          {activeTab === 'avaliacoes' && (
            <motion.div
              key="avaliacoes-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Diagnósticos Clínicos Section */}
              <div className="clinical-profile-container" style={{ marginBottom: '1.5rem' }}>
                <div className="section-card">
                  <div className="section-card-header">
                    <div className="header-title-group">
                      <Activity size={24} style={{ color: '#9d1d1d' }} />
                      <h3>Perfil Clínico / Diagnósticos</h3>
                    </div>
                    {!isAddDiagOpen && (
                      <button 
                        className="btn-add-diag"
                        onClick={() => setIsAddDiagOpen(true)}
                        style={{ backgroundColor: '#9d1d1d' }}
                      >
                        <Plus size={16} />
                        <span>Adicionar Diagnóstico</span>
                      </button>
                    )}
                  </div>

                  {/* Adicionar Diagnóstico Form */}
                  {isAddDiagOpen && (
                    <motion.form 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="add-diag-form"
                      onSubmit={handleAddDiagnosis}
                    >
                      <h4 className="form-title" style={{ color: '#9d1d1d' }}>Novo Diagnóstico</h4>
                      
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Segmento Corporal</label>
                          <select 
                            value={selectedSegment}
                            onChange={(e) => {
                              setSelectedSegment(e.target.value);
                              setSelectedDiagnosis("");
                            }}
                            required
                          >
                            <option value="">Selecione...</option>
                            {getSegmentsList().map(seg => (
                              <option key={seg} value={seg}>{seg}</option>
                            ))}
                          </select>
                        </div>

                        {selectedSegment === "Outros" && (
                          <div className="form-group">
                            <label>Nome do Segmento</label>
                            <input 
                              type="text" 
                              value={customSegment}
                              onChange={(e) => setCustomSegment(e.target.value)}
                              placeholder="Ex: Cotovelo, Punho..."
                              required
                            />
                          </div>
                        )}

                        {selectedSegment && selectedSegment !== "Outros" && (
                          <div className="form-group">
                            <label>Diagnóstico</label>
                            <select 
                              value={selectedDiagnosis}
                              onChange={(e) => setSelectedDiagnosis(e.target.value)}
                              required
                            >
                              <option value="">Selecione...</option>
                              {getDiagnosesForSegment(selectedSegment).map(diag => (
                                <option key={diag} value={diag}>{diag}</option>
                              ))}
                              <option value="Outro">Outro...</option>
                            </select>
                          </div>
                        )}

                        {(selectedSegment === "Outros" || selectedDiagnosis === "Outro") && (
                          <div className="form-group">
                            <label>Especificar Diagnóstico</label>
                            <input 
                              type="text" 
                              value={customDiagnosis}
                              onChange={(e) => setCustomDiagnosis(e.target.value)}
                              placeholder="Digite o diagnóstico"
                              required
                            />
                          </div>
                        )}

                        <div className="form-group">
                          <label>Data de Início</label>
                          <input 
                            type="date" 
                            value={diagStartDate}
                            onChange={(e) => setDiagStartDate(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={() => setIsAddDiagOpen(false)}>
                          Cancelar
                        </button>
                        <button type="submit" className="btn-submit" style={{ backgroundColor: '#9d1d1d' }}>
                          Salvar Diagnóstico
                        </button>
                      </div>
                    </motion.form>
                  )}

                  {/* Alta Form Overlay */}
                  {diagToDischarge && (
                    <div className="modal-backdrop" onClick={() => setDiagToDischarge(null)}>
                      <div className="discharge-dialog" onClick={(e) => e.stopPropagation()}>
                        <h4>Dar Alta do Tratamento</h4>
                        <p className="discharge-subtitle">Registrar alta para: <strong>{diagToDischarge.diagnosis}</strong> ({diagToDischarge.segment})</p>
                        
                        <form onSubmit={handleDischargeConfirm}>
                          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                            <label>Data da Alta</label>
                            <input 
                              type="date" 
                              value={dischargeDate}
                              onChange={(e) => setDischargeDate(e.target.value)}
                              required
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input 
                              type="checkbox" 
                              id="isDropoutCheckbox"
                              checked={isDropout}
                              onChange={(e) => setIsDropout(e.target.checked)}
                              style={{ width: 'auto', margin: 0, cursor: 'pointer' }}
                            />
                            <label htmlFor="isDropoutCheckbox" style={{ margin: 0, cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem' }}>
                              Desistência de Tratamento
                            </label>
                          </div>
                          <div className="form-actions">
                            <button type="button" className="btn-cancel" onClick={() => { setDiagToDischarge(null); setIsDropout(false); }}>
                              Cancelar
                            </button>
                            <button type="submit" className={`btn-submit discharge-confirm-btn ${isDropout ? 'dropout-submit' : ''}`} style={isDropout ? { backgroundColor: '#ef4444' } : {}}>
                              {isDropout ? 'Confirmar Desistência' : 'Confirmar Alta'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Editar Diagnóstico Form Overlay */}
                  {diagToEdit && (
                    <div className="modal-backdrop" onClick={() => setDiagToEdit(null)}>
                      <div className="discharge-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%' }}>
                        <h4 style={{ color: '#9d1d1d', marginBottom: '0.5rem' }}>Editar Diagnóstico Clínico</h4>
                        <p className="discharge-subtitle" style={{ marginBottom: '1.5rem' }}>
                          Paciente: <strong>{patient?.name}</strong>
                        </p>
                        
                        <form onSubmit={handleEditConfirm}>
                          <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label>Segmento Corporal</label>
                            <select 
                              value={editSegment}
                              onChange={(e) => {
                                setEditSegment(e.target.value);
                                setEditDiagnosis("");
                              }}
                              required
                            >
                              <option value="">Selecione...</option>
                              {getSegmentsList().map(seg => (
                                <option key={seg} value={seg}>{seg}</option>
                              ))}
                            </select>
                          </div>

                          {editSegment === "Outros" && (
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                              <label>Nome do Segmento</label>
                              <input 
                                type="text" 
                                value={customEditSegment}
                                onChange={(e) => setCustomEditSegment(e.target.value)}
                                placeholder="Ex: Cotovelo, Punho..."
                                required
                              />
                            </div>
                          )}

                          {editSegment && editSegment !== "Outros" && (
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                              <label>Diagnóstico</label>
                              <select 
                                value={editDiagnosis}
                                onChange={(e) => setEditDiagnosis(e.target.value)}
                                required
                              >
                                <option value="">Selecione...</option>
                                {getDiagnosesForSegment(editSegment).map(diag => (
                                  <option key={diag} value={diag}>{diag}</option>
                                ))}
                                <option value="Outro">Outro...</option>
                              </select>
                            </div>
                          )}

                          {(editSegment === "Outros" || editDiagnosis === "Outro") && (
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                              <label>Especificar Diagnóstico</label>
                              <input 
                                type="text" 
                                value={customEditDiagnosis}
                                onChange={(e) => setCustomEditDiagnosis(e.target.value)}
                                placeholder="Digite o diagnóstico"
                                required
                              />
                            </div>
                          )}

                          <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label>Data de Início</label>
                            <input 
                              type="date" 
                              value={editStartDate}
                              onChange={(e) => setEditStartDate(e.target.value)}
                              required
                            />
                          </div>

                          <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label>Status do Tratamento</label>
                            <select 
                              value={editStatus}
                              onChange={(e) => {
                                setEditStatus(e.target.value);
                                if (e.target.value === "ATIVO") {
                                  setEditDischargeDate("");
                                } else if (!editDischargeDate) {
                                  setEditDischargeDate(new Date().toISOString().split('T')[0]);
                                }
                              }}
                              required
                            >
                              <option value="ATIVO">Em Tratamento (Ativo)</option>
                              <option value="ALTA">Alta de Tratamento</option>
                              <option value="DESISTENCIA">Desistência de Tratamento</option>
                            </select>
                          </div>

                          {(editStatus === "ALTA" || editStatus === "DESISTENCIA") && (
                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                              <label>Data de Conclusão / Alta</label>
                              <input 
                                type="date" 
                                value={editDischargeDate}
                                onChange={(e) => setEditDischargeDate(e.target.value)}
                                required
                              />
                            </div>
                          )}

                          <div className="form-actions" style={{ marginTop: '1.5rem' }}>
                            <button type="button" className="btn-cancel" onClick={() => setDiagToEdit(null)}>
                              Cancelar
                            </button>
                            <button type="submit" className="btn-submit" style={{ backgroundColor: '#9d1d1d' }}>
                              Salvar Alterações
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Diagnoses Content */}
                  <div className="diagnoses-content">
                    {loadingDiagnoses ? (
                      <p className="loading-text">Carregando perfil clínico...</p>
                    ) : diagnoses.length === 0 ? (
                      <p className="empty-text">Nenhum diagnóstico clínico cadastrado para este paciente.</p>
                    ) : (
                      <div className="diagnoses-lists-wrapper">
                        {/* Active Diagnoses */}
                        {diagnoses.filter(d => d.status === "ATIVO").length > 0 && (
                          <div className="active-diagnoses-list">
                            <h4 className="list-subtitle">Em Tratamento (Ativos)</h4>
                            <div className="diagnoses-grid">
                              {diagnoses.filter(d => d.status === "ATIVO").map(diag => (
                                <div key={diag.id} className="diagnosis-card active-card" style={{ borderLeftColor: '#9d1d1d' }}>
                                  <div className="diag-card-header">
                                    <span className="segment-badge" style={{ color: '#9d1d1d', backgroundColor: '#fef2f2' }}>{diag.segment}</span>
                                    <div className="diag-actions">
                                      <button 
                                        className="action-btn-discharge" 
                                        title="Dar Alta"
                                        onClick={() => {
                                          setDiagToDischarge(diag);
                                          setDischargeDate(new Date().toISOString().split('T')[0]);
                                        }}
                                      >
                                        <CheckCircle2 size={14} />
                                        <span>Alta</span>
                                      </button>
                                      <button 
                                        className="action-btn-edit" 
                                        title="Editar Diagnóstico"
                                        onClick={() => handleEditClick(diag)}
                                      >
                                        <Pencil size={12} />
                                        <span>Editar</span>
                                      </button>
                                      <button 
                                        className="action-btn-delete" 
                                        title="Excluir"
                                        onClick={() => setDiagToDelete(diag)}
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </div>
                                  <h4 className="diag-name">{diag.diagnosis}</h4>
                                  <p className="diag-date">
                                    <Calendar size={14} />
                                    Início em: {new Date(diag.start_date).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* No active diagnoses but has history */}
                        {diagnoses.filter(d => d.status === "ATIVO").length === 0 && (
                          <p className="all-discharged-text">Paciente sem tratamentos ativos no momento.</p>
                        )}

                        {/* Discharged Diagnoses (History) */}
                        {diagnoses.filter(d => d.status === "ALTA" || d.status === "DESISTENCIA").length > 0 && (
                          <div className="history-diagnoses-section">
                            <button 
                              type="button"
                              className="history-toggle"
                              onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                            >
                              <Archive size={16} />
                              <span>Histórico de Altas/Desistências ({diagnoses.filter(d => d.status === "ALTA" || d.status === "DESISTENCIA").length})</span>
                              {isHistoryExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>

                            {isHistoryExpanded && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="history-list"
                              >
                                <div className="diagnoses-grid">
                                  {diagnoses.filter(d => d.status === "ALTA" || d.status === "DESISTENCIA").map(diag => {
                                    const isDropoutDiag = diag.status === "DESISTENCIA";
                                    return (
                                      <div key={diag.id} className={`diagnosis-card discharged-card ${isDropoutDiag ? 'dropout-card' : ''}`}>
                                        <div className="diag-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <span className="segment-badge discharged-badge">{diag.segment}</span>
                                            {isDropoutDiag && (
                                              <span className="dropout-badge" style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '0.125rem 0.375rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>
                                                Desistência
                                              </span>
                                            )}
                                          </div>
                                          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                                            <button 
                                              className="action-btn-delete" 
                                              style={{ color: '#9ca3af', padding: '4px' }}
                                              title="Editar"
                                              onClick={() => handleEditClick(diag)}
                                            >
                                              <Pencil size={14} />
                                            </button>
                                            <button 
                                              className="action-btn-delete muted-delete" 
                                              title="Excluir"
                                              onClick={() => setDiagToDelete(diag)}
                                            >
                                              <Trash2 size={16} />
                                            </button>
                                          </div>
                                        </div>
                                        <h4 className="diag-name text-muted">{diag.diagnosis}</h4>
                                        <div className="diag-dates-group">
                                          <p className="diag-date text-muted">
                                            <Calendar size={14} />
                                            De: {new Date(diag.start_date).toLocaleDateString('pt-BR')}
                                          </p>
                                          <p className="diag-date text-muted">
                                            {isDropoutDiag ? (
                                              <>
                                                <XCircle size={14} style={{ color: '#ef4444' }} />
                                                Desistência: {diag.discharge_date ? new Date(diag.discharge_date).toLocaleDateString('pt-BR') : 'N/A'}
                                              </>
                                            ) : (
                                              <>
                                                <CheckCircle2 size={14} style={{ color: '#10B981' }} />
                                                Alta: {diag.discharge_date ? new Date(diag.discharge_date).toLocaleDateString('pt-BR') : 'N/A'}
                                              </>
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="history-container">
                <h3 className="history-title">
                  <History size={24} style={{ color: '#9d1d1d' }} />
                  Histórico de Avaliações
                </h3>

                <div className="assessment-list">
                  {loading ? (
                    <div className="status-message">Carregando histórico...</div>
                  ) : assessments.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">
                        <ClipboardList size={48} />
                      </div>
                      <p>Este paciente ainda não possui avaliações registradas.</p>
                      <button 
                        className="btn-primary secondary-btn flex-none" 
                        onClick={() => router.push(`/dashboard/assessment/select-segment/${patientId}`)}
                        style={{ margin: '1rem auto 0' }}
                      >
                        Iniciar Primeira Avaliação
                      </button>
                    </div>
                  ) : (
                    assessments.map((item, index) => {
                      const qInfo = questionnairesData[item.assessment_type];
                      const isClinical = !!qInfo?.sections;
                      const score = !isClinical ? item.clinical_data?.percentage : null;
                      const interpretation = !isClinical ? item.clinical_data?.interpretation : null;
                      return (
                        <div key={item.id} className="assessment-item-wrapper">
                          <div 
                            className="assessment-info"
                            onClick={() => router.push(`/dashboard/assessment/${patientId}/${item.assessment_type}?id=${item.id}`)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="assessment-icon">
                              <Activity size={24} />
                            </div>
                            <div className="assessment-text" style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                                <h4 style={{ color: '#9d1d1d', margin: 0 }}>
                                  {qInfo?.title || item.assessment_type}
                                  {item.clinical_data?.activeFlags?.some((f: any) => f.level === 'red') && (
                                    <span className="red-flag-indicator" title="Alerta Crítico: Red Flag detectada">
                                      <AlertTriangle size={14} /> RED FLAG
                                    </span>
                                  )}
                                </h4>
                                <div className="assessment-actions">
                                  <button
                                    className="btn-action-outline edit-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const baseUrl = window.location.origin;
                                      const shareUrl = `${baseUrl}/assessment/public/summary/${item.id}`;
                                      const message = encodeURIComponent(`Olá ${patient?.name}, segue o resumo da sua avaliação (${qInfo?.title}) realizada na KinesisLab: ${shareUrl}`);
                                      window.open(`https://wa.me/?text=${message}`, '_blank');
                                      toast.success("Link gerado e WhatsApp aberto!");
                                    }}
                                    title="Compartilhar resumo (WhatsApp)"
                                    style={{ padding: '0.4rem', color: '#10B981', borderColor: '#6EE7B7' }}
                                  >
                                    <ExternalLink size={16} />
                                  </button>

                                  <button
                                    className="btn-action-outline edit-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/dashboard/assessment/${patientId}/${item.assessment_type}?id=${item.id}`);
                                    }}
                                    title="Editar"
                                    style={{ padding: '0.4rem' }}
                                  >
                                    <ClipboardList size={16} />
                                  </button>

                                  <button 
                                    className="btn-action-outline delete-btn"
                                    onClick={(e) => handleDeleteAssessment(e, item)}
                                    title="Excluir"
                                    style={{ padding: '0.4rem', color: '#EF4444', borderColor: '#fca5a5' }}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                              <div className="assessment-meta">
                                <span>
                                  <Calendar size={14} /> {item.created_at ? (() => {
                                    const d = new Date(item.created_at);
                                    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR');
                                  })() : ''}
                                </span>
                                <span>
                                  <User size={14} /> {item.created_by?.name || "N/A"}
                                </span>
                                {score !== null && score !== undefined && (
                                  <span className="score-badge" style={{ backgroundColor: '#fee2e2', color: '#9d1d1d' }}>
                                    Score: {score}%
                                  </span>
                                )}
                                {interpretation && interpretation !== 'N/A' && interpretation !== 'Nenhuma resposta' && (
                                  <span style={{ fontWeight: '600', color: 'var(--text)' }}>
                                    {interpretation}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {patient && (
                <PatientDocuments 
                  patientId={patientId} 
                  initialDocuments={patient.documents} 
                />
              )}
            </motion.div>
          )}

          {/* TAB 2: DIÁRIOS DE EVOLUÇÃO (VOZ) */}
          {activeTab === 'evolucoes' && (
            <motion.div
              key="evolucoes-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="evolution-container-grid"
            >
              {/* Left Column: Form Editor */}
              <div className="evolution-editor-card">
                <h3 className="section-title">
                  <Sparkles size={20} className="text-primary" style={{ color: '#9d1d1d' }} />
                  {editingEvolutionId ? "Editar Evolução Diária" : "Nova Evolução Diária"}
                </h3>
                
                <form onSubmit={handleSaveEvolution} className="space-y-4">
                  <div className="form-group">
                    <label className="form-label">Data da Evolução (Permite Retroativos)</label>
                    <input 
                      type="date" 
                      className="form-input"
                      value={evolutionDate}
                      onChange={(e) => setEvolutionDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group relative">
                    <div className="textarea-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label className="form-label" style={{ margin: 0 }}>Evolução do Tratamento</label>
                      <button
                        type="button"
                        onClick={toggleRecording}
                        className={`speech-btn ${isRecording ? 'active' : ''}`}
                        title="Transcrever Áudio em Tempo Real"
                      >
                        {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
                        <span>{isRecording ? "Gravando por Voz..." : "Transcrever Voz"}</span>
                      </button>
                    </div>

                    <textarea
                      ref={evolutionTextareaRef}
                      className="form-input text-sm scrollbar"
                      rows={10}
                      placeholder="Descreva o atendimento, melhora clínica do paciente, exercícios realizados e condutas aplicadas. Use o botão acima para ditar..."
                      value={evolutionContent}
                      onChange={(e) => setEvolutionContent(e.target.value)}
                      required
                      style={{ minHeight: '200px', resize: 'vertical' }}
                    ></textarea>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {editingEvolutionId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEvolutionId(null);
                          setEvolutionContent("");
                          setEvolutionDate(new Date().toISOString().split('T')[0]);
                        }}
                        className="btn-primary secondary-btn flex-1 py-3"
                      >
                        Cancelar Edição
                      </button>
                    )}
                    <button
                      type="submit"
                      className="btn-primary flex-1 py-3"
                      style={{ backgroundColor: '#9d1d1d', borderColor: '#9d1d1d' }}
                    >
                      {editingEvolutionId ? "Salvar Alterações" : "Salvar Evolução"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: History List */}
              <div className="evolution-history-card">
                <h3 className="section-title">
                  <History size={20} style={{ color: '#64748b' }} />
                  Histórico de Evolução
                </h3>

                <div className="evolution-list scrollbar">
                  {loadingEvolutions ? (
                    <div className="status-message">Carregando diários de evolução...</div>
                  ) : evolutions.length === 0 ? (
                    <div className="empty-evolution-state">
                      <Clock size={40} className="text-slate-300" />
                      <p>Nenhuma evolução registrada para este paciente.</p>
                    </div>
                  ) : (
                    evolutions.map((evo) => (
                      <div key={evo.id} className="evolution-item-card">
                        <div className="evo-header">
                          <div className="evo-meta">
                            <span className="evo-date">
                              <Calendar size={12} /> {new Date(evo.date).toLocaleDateString('pt-BR')}
                            </span>
                            <span className="evo-author">
                              <User size={12} /> {evo.createdBy?.name || "Terapeuta"}
                            </span>
                          </div>
                          
                          <div className="evo-actions">
                            <button
                              onClick={() => handleEditEvolution(evo)}
                              className="evo-btn edit"
                              title="Editar registro"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteEvolutionClick(evo.id)}
                              className="evo-btn delete"
                              title="Excluir evolução"
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                        
                        <div className="evo-body">
                          <p>{evo.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: INTEGRAÇÃO & WHATSAPP */}
          {activeTab === 'integracao' && (
            <motion.div
              key="integracao-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="integration-container-grid"
            >
              {/* Left Column: Form & History Graph */}
              <div className="integration-form-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Pain Chart */}
                <div className="card-panel">
                  <h4 className="card-panel-title">Histórico de Dor</h4>
                  <p className="card-panel-desc">Acompanhamento diário baseado no preenchimento de diário</p>
                  
                  {isMounted && chartData.length > 1 ? (
                    <div style={{ height: '180px', width: '100%', marginLeft: '-0.75rem' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorPain" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="data" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: 12, fontWeight: 800 }}
                            labelFormatter={(val) => `Data: ${val}`}
                          />
                          <Area type="monotone" dataKey="dor" name="Dor" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorPain)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="empty-state-panel">
                      <CalendarRange size={24} style={{ opacity: 0.4, marginBottom: '0.25rem' }} />
                      <p className="empty-state-panel-title">Sem dados de diário de dor suficientes</p>
                      <p className="empty-state-panel-desc">O paciente precisa preencher o diário no link temporário.</p>
                    </div>
                  )}
                </div>

                {/* Form dispatch card */}
                <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 className="section-title" style={{ margin: 0 }}>Criar Novo Envio</h3>
                  
                  {/* Select Type */}
                  <div className="type-selector-row">
                    <button
                      type="button"
                      onClick={() => setContentType("mensagem")}
                      className={`type-btn ${contentType === 'mensagem' ? 'active' : ''}`}
                    >
                      <MessageCircle size={20} />
                      <span>Mensagem</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setContentType("diario")}
                      className={`type-btn ${contentType === 'diario' ? 'active' : ''}`}
                    >
                      <CalendarRange size={20} />
                      <span>Diário de Dor</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setContentType("arquivos")}
                      className={`type-btn ${contentType === 'arquivos' ? 'active' : ''}`}
                    >
                      <Folder size={20} />
                      <span>Materiais</span>
                    </button>
                  </div>

                  {/* Attachment Box for files */}
                  {contentType === 'arquivos' && (
                    <div className="attachment-box">
                      <h4 className="attachment-title">Arquivos selecionados ({selectedFiles.length})</h4>
                      {selectedFiles.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto' }}>
                          {selectedFiles.map((file) => (
                            <div key={file.id} className="attachment-item">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
                                {file.type === 'video' ? (
                                  <Video className="shrink-0" size={16} style={{ color: '#f43f5e' }} />
                                ) : (
                                  <FileText className="shrink-0" size={16} style={{ color: '#3b82f6' }} />
                                )}
                                <span className="attachment-item-text">{file.title}</span>
                              </div>
                              <button 
                                type="button"
                                onClick={() => handleRemoveSelectedFile(file.id)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.75rem', color: '#065f46', opacity: 0.6, fontStyle: 'italic', textAlign: 'center', margin: '1rem 0' }}>Nenhum arquivo anexado. Escolha materiais na biblioteca ao lado!</p>
                      )}
                    </div>
                  )}

                  {contentType !== 'diario' && (
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Título do Envio</label>
                      <input 
                        type="text"
                        placeholder="Ex: Exercícios Semanais Joelho"
                        className="form-input"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Mensagem de Orientação</label>
                    <textarea
                      rows={3}
                      placeholder="Digite a orientação ou mensagem de suporte para o paciente..."
                      className="form-input text-xs"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    ></textarea>
                  </div>

                  {/* Scheduler block for diary */}
                  {contentType === 'diario' && (
                    <div className="schedule-box">
                      <h4 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: '#64748b', margin: '0 0 0.5rem 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem' }}>Agendamento & Período</h4>
                      
                      <div className="schedule-grid">
                        <div className="schedule-col">
                          <label>Data Início</label>
                          <input 
                            type="date"
                            className="form-input"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                          />
                        </div>
                        <div className="schedule-col">
                          <label>Data Fim</label>
                          <input 
                            type="date"
                            className="form-input"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem' }}>Dias de Envio</label>
                        <div className="week-days-row">
                          {weekDays.map((day) => (
                            <button
                              key={day.id}
                              type="button"
                              onClick={() => toggleDay(day.id)}
                              className={`day-pill ${scheduleDays.includes(day.id) ? 'active' : ''}`}
                            >
                              {day.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem' }}>Horários programados</label>
                        <div className="time-pills-row">
                          {scheduleTimes.map((time, idx) => (
                            <div key={idx} className="time-pill-box">
                              <input 
                                type="time"
                                value={time}
                                onChange={(e) => updateTime(idx, e.target.value)}
                                className="time-pill-input"
                              />
                              {scheduleTimes.length > 1 && (
                                <button 
                                  type="button"
                                  onClick={() => removeTime(idx)}
                                  className="time-pill-delete"
                                >
                                  <Trash2 size={10} />
                                </button>
                              )}
                            </div>
                          ))}
                          
                          <button 
                            type="button"
                            onClick={addTime}
                            className="add-time-btn"
                          >
                            <Plus size={10} /> Horário
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={handleSendPush}
                      className="action-btn-push"
                    >
                      <Send size={16} />
                      <span>Enviar Push no Dispositivo</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleWhatsAppSend}
                      className="action-btn-wa"
                    >
                      <MessageCircle size={16} />
                      <span>Enviar via WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Library Selector (Only active if arquivos, otherwise logs history) */}
              <div className="integration-assets-card">
                {contentType === 'arquivos' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="library-header">
                      <h3>
                        <Folder style={{ color: '#10b981', marginRight: '0.25rem', verticalAlign: 'middle' }} size={20} />
                        Biblioteca de Materiais
                      </h3>
                      <button 
                        onClick={() => setShowAddFolder(!showAddFolder)}
                        style={{ background: 'transparent', border: '1px solid #10b981', borderRadius: '8px', padding: '0.35rem', cursor: 'pointer', color: '#10b981' }}
                        title="Nova Pasta"
                      >
                        <FolderPlus size={16} />
                      </button>
                    </div>

                    {showAddFolder && (
                      <div className="library-add-folder-box">
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem' }}>Nome da Pasta</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input 
                            type="text" 
                            placeholder="Ex: Lombar, Joelho"
                            className="form-input"
                            style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem' }}
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                          />
                          <button 
                            onClick={handleAddFolder}
                            style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', padding: '0 1rem', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
                          >
                            Criar
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="library-list" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                      {libraryFolders.map((folder) => (
                        <div key={folder.id} className="folder-card">
                          <div className="folder-card-header">
                            <span>{folder.name}</span>
                            <button
                              onClick={() => setShowAddFile(showAddFile === folder.id ? null : folder.id)}
                            >
                              + Anexo
                            </button>
                          </div>

                          {showAddFile === folder.id && (
                            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', border: '1px solid #e2e8f0' }}>
                              <input 
                                type="text" 
                                placeholder="Título do Material"
                                className="form-input"
                                style={{ padding: '0.4rem', fontSize: '0.75rem' }}
                                value={newFileTitle}
                                onChange={(e) => setNewFileTitle(e.target.value)}
                              />
                              <input 
                                type="text" 
                                placeholder="URL do arquivo (PDF ou Vídeo)"
                                className="form-input"
                                style={{ padding: '0.4rem', fontSize: '0.75rem' }}
                                value={newFileUrl}
                                onChange={(e) => setNewFileUrl(e.target.value)}
                              />
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.7rem' }}>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700 }}>
                                    <input 
                                      type="radio" 
                                      checked={newFileType === 'pdf'}
                                      onChange={() => setNewFileType('pdf')}
                                    /> PDF
                                  </label>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700 }}>
                                    <input 
                                      type="radio" 
                                      checked={newFileType === 'video'}
                                      onChange={() => setNewFileType('video')}
                                    /> Vídeo
                                  </label>
                                </div>
                                <button
                                  onClick={() => handleAddFileToFolder(folder.id)}
                                  style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '0.25rem 0.75rem', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer' }}
                                >
                                  Salvar
                                </button>
                              </div>
                            </div>
                          )}

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            {(!folder.files || folder.files.length === 0) ? (
                              <p style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>Esta pasta está vazia.</p>
                            ) : (
                              folder.files.map((file: any) => {
                                const isSelected = selectedFiles.some(f => f.id === file.id);
                                return (
                                  <div 
                                    key={file.id} 
                                    onClick={() => handleSelectFile(file)}
                                    className={`file-selector-item ${isSelected ? 'selected' : ''}`}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
                                      {file.type === 'video' ? (
                                        <Video style={{ color: '#f43f5e', flexShrink: 0 }} size={14} />
                                      ) : (
                                        <FileText style={{ color: '#3b82f6', flexShrink: 0 }} size={14} />
                                      )}
                                      <span className="file-selector-item-title">{file.title}</span>
                                    </div>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 900, color: isSelected ? '#10b981' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                      {isSelected ? 'USANDO' : 'USAR'}
                                    </span>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Default Right panel display: Send Communications Logs History
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 className="section-title" style={{ margin: 0, paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                      <History style={{ color: '#64748b', marginRight: '0.25rem', verticalAlign: 'middle' }} size={20} />
                      Envios Realizados
                    </h3>

                    <div className="sent-logs-list" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                      {sentLogs.length === 0 ? (
                        <div className="empty-state-panel">
                          <Clock size={36} style={{ color: '#cbd5e1', marginBottom: '0.25rem' }} />
                          <p className="empty-state-panel-title">Nenhuma comunicação enviada ainda.</p>
                        </div>
                      ) : (
                        sentLogs.map((log) => (
                          <div key={log.id} className="sent-log-card">
                            <div className="sent-log-header">
                              <span className={`sent-log-type-tag ${log.type.includes("WhatsApp") ? 'wa' : 'push'}`}>
                                {log.type}
                              </span>
                              <span className="sent-log-time">
                                {new Date(log.createdAt).toLocaleDateString('pt-BR')} às {new Date(log.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="sent-log-body">{log.details}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style jsx>{`
        .patient-history-page {
          min-height: 100vh;
          background-color: var(--bg);
        }
        .patient-header-section {
          padding: 2rem 1.5rem;
          margin-bottom: 0.5rem;
        }
        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1.5rem;
        }
        .patient-main-info {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        .avatar-wrapper {
          width: 72px;
          height: 72px;
          background-color: var(--primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: var(--shadow-md);
          flex-shrink: 0;
        }
        .text-info h1 {
          font-size: 2rem;
          font-weight: 800;
          margin: 0;
          color: var(--text);
        }
        .text-info p {
          color: var(--text-muted);
          font-size: 1.125rem;
          margin: 0;
        }
        .patient-id-tag {
          font-size: 0.85rem !important;
          color: #94a3b8 !important;
          font-weight: bold;
          margin-top: 0.25rem !important;
        }
        .header-actions {
          display: flex;
          gap: 1rem;
        }
        .secondary-btn {
          width: auto;
          background-color: white;
          color: var(--primary);
          border: 1px solid var(--primary);
        }
        .main-content {
          padding-bottom: 3rem;
        }
        
        /* Tab Navigation Switches */
        .tab-switcher-wrapper {
          display: flex;
          border-bottom: 2px solid #e2e8f0;
          gap: 1.5rem;
          padding: 0 0.5rem;
        }
        .tab-switch-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 0.5rem;
          font-weight: bold;
          color: #64748b;
          background: transparent;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.95rem;
        }
        .tab-switch-btn:hover {
          color: #0f172a;
        }
        .tab-switch-btn.active {
          color: #9d1d1d;
          border-bottom-color: #9d1d1d;
        }

        /* History Tab Styles */
        .history-container {
          background-color: white;
          padding: 2.5rem;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border);
          margin-bottom: 2rem;
        }
        .history-title {
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .assessment-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .status-message {
          text-align: center;
          padding: 3rem;
          color: var(--text-muted);
        }
        .empty-state {
          text-align: center;
          padding: 4rem;
          background-color: #f9fafb;
          border-radius: var(--radius-lg);
          border: 1px dashed var(--border);
        }
        .empty-icon {
          display: flex;
          justify-content: center;
          margin-bottom: 1rem;
          color: var(--border);
        }
        .empty-state p {
          color: var(--text-muted);
          font-size: 1.125rem;
        }
        .flex-none { width: auto !important; }

        .assessment-item-wrapper {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          background-color: white;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          transition: all 0.2s;
          gap: 1rem;
        }
        .assessment-item-wrapper:hover {
          border-color: #9d1d1d;
          box-shadow: var(--shadow-md);
        }
        .assessment-info {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          flex: 1;
        }
        .assessment-icon {
          width: 48px;
          height: 48px;
          background-color: var(--bg);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9d1d1d;
          flex-shrink: 0;
        }
        .assessment-text h4 {
          font-size: 1.125rem;
          font-weight: bold;
          margin: 0 0 0.25rem 0;
        }
        .assessment-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
          color: var(--text-muted);
          font-size: 0.875rem;
          flex-wrap: wrap;
        }
        .assessment-meta span {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .score-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 600;
        }
        .red-flag-indicator {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background-color: #fef2f2;
          color: #dc2626;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 800;
          margin-left: 0.75rem;
          border: 1px solid #fecaca;
          vertical-align: middle;
          animation: pulse-red 2s infinite;
        }
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(220, 38, 38, 0); }
          100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }
        .assessment-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
          margin-left: auto;
        }
        
        /* Grid Layouts for Tabs */
        .evolution-container-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          align-items: start;
        }
        .integration-container-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 1.5rem;
          align-items: start;
        }

        .evolution-editor-card, .evolution-history-card, .integration-form-card, .integration-assets-card {
          background: white;
          padding: 2rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-sm);
        }

        .section-title {
          font-size: 1.25rem;
          font-weight: bold;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #1e293b;
        }

        .evolution-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-height: 550px;
          overflow-y: auto;
          padding-right: 0.5rem;
        }
        .empty-evolution-state {
          text-align: center;
          padding: 4rem 1rem;
          color: #94a3b8;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        .empty-evolution-state p {
          font-weight: bold;
          font-size: 0.9rem;
        }

        .evolution-item-card {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          padding: 1.25rem;
          transition: all 0.15s;
        }
        .evolution-item-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
        .evo-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-b: 1px solid #f1f5f9;
          padding-bottom: 0.5rem;
          margin-bottom: 0.75rem;
        }
        .evo-meta {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .evo-date {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.8rem;
          font-weight: bold;
          color: #334155;
        }
        .evo-author {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: #64748b;
        }
        .evo-actions {
          display: flex;
          gap: 0.5rem;
        }
        .evo-btn {
          font-size: 0.75rem;
          font-weight: bold;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 2px 4px;
        }
        .evo-btn.edit {
          color: #3b82f6;
        }
        .evo-btn.delete {
          color: #ef4444;
        }
        .evo-body p {
          font-size: 0.875rem;
          color: #334155;
          line-height: 1.5;
          margin: 0;
          white-space: pre-wrap;
        }

        .textarea-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        /* Speech-to-Text Button */
        .speech-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.35rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #f1f5f9;
          color: #475569;
        }
        .speech-btn:hover {
          background: #e2e8f0;
          color: #0f172a;
        }
        .speech-btn.active {
          background: #ef4444;
          color: white;
          animation: pulse-recording 1.5s infinite;
        }
        @keyframes pulse-recording {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        /* Integration specific elements */
        .library-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .sent-logs-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        /* Type Selector */
        .type-selector-row {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .type-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          color: #64748b;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .type-btn:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #334155;
        }
        .type-btn.active {
          background: #ecfdf5;
          border-color: #10b981;
          color: #065f46;
        }

        /* Action Buttons */
        .action-btn-push {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.875rem;
          background: #0f172a;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .action-btn-push:hover {
          background: #1e293b;
          transform: translateY(-1px);
        }
        .action-btn-wa {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.875rem;
          background: white;
          color: #047857;
          border: 2px solid #10b981;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .action-btn-wa:hover {
          background: #f0fdf4;
          transform: translateY(-1px);
        }

        /* Integration Panels */
        .card-panel {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.25rem;
          box-shadow: 0 1px 3px 0 rgba(0,0,0,0.05);
        }
        .card-panel-title {
          font-size: 0.75rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #94a3b8;
          margin: 0 0 0.25rem 0;
        }
        .card-panel-desc {
          font-size: 0.7rem;
          font-weight: 700;
          color: #94a3b8;
          margin: 0 0 1rem 0;
        }

        .empty-state-panel {
          height: 120px;
          background: #f8fafc;
          border: 1px dashed #cbd5e1;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          padding: 1rem;
          text-align: center;
        }
        .empty-state-panel-title {
          font-size: 0.8rem;
          font-weight: 700;
          margin: 0;
          color: #64748b;
        }
        .empty-state-panel-desc {
          font-size: 0.7rem;
          color: #94a3b8;
          margin: 0.25rem 0 0 0;
        }

        /* Attachment Box */
        .attachment-box {
          background: #f0fdf4;
          border: 1px dashed #a7f3d0;
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 0.5rem;
        }
        .attachment-title {
          font-size: 0.7rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #065f46;
          margin: 0 0 0.5rem 0;
        }
        .attachment-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          margin-bottom: 0.5rem;
        }
        .attachment-item:last-child {
          margin-bottom: 0;
        }
        .attachment-item-text {
          font-size: 0.75rem;
          font-weight: 700;
          color: #334155;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Scheduler Box */
        .schedule-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .schedule-grid {
          display: flex;
          gap: 0.75rem;
        }
        .schedule-col {
          flex: 1;
        }
        .schedule-col label {
          display: block;
          font-size: 0.7rem;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 0.25rem;
        }
        .week-days-row {
          display: flex;
          gap: 0.25rem;
        }
        .day-pill {
          flex: 1;
          padding: 0.35rem 0;
          text-align: center;
          font-size: 0.7rem;
          font-weight: 900;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .day-pill:hover {
          border-color: #cbd5e1;
        }
        .day-pill.active {
          background: #1e293b;
          border-color: #1e293b;
          color: white;
        }
        .time-pills-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: center;
        }
        .time-pill-box {
          display: flex;
          align-items: center;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }
        .time-pill-input {
          padding: 0.35rem 0.5rem;
          background: transparent;
          border: none;
          font-size: 0.75rem;
          font-weight: 700;
          color: #334155;
          width: 75px;
          outline: none;
        }
        .time-pill-delete {
          padding: 0.35rem;
          background: transparent;
          border: none;
          border-left: 1px solid #f1f5f9;
          color: #94a3b8;
          cursor: pointer;
        }
        .time-pill-delete:hover {
          color: #ef4444;
        }
        .add-time-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.35rem 0.75rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.7rem;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .add-time-btn:hover {
          border-color: #cbd5e1;
          color: #0f172a;
        }

        /* Library Files Section */
        .library-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 0.75rem;
          margin-bottom: 1rem;
        }
        .library-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 800;
          color: #334155;
        }
        .library-add-folder-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 0.75rem;
          border-radius: 12px;
          margin-bottom: 1rem;
        }
        .folder-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 0.75rem;
          margin-bottom: 0.75rem;
          box-shadow: 0 1px 2px 0 rgba(0,0,0,0.02);
        }
        .folder-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .folder-card-header span {
          font-size: 0.85rem;
          font-weight: 800;
          color: #334155;
        }
        .folder-card-header button {
          background: transparent;
          border: none;
          color: #10b981;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
        }
        .file-selector-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0.75rem;
          border: 1px solid #f1f5f9;
          background: #f8fafc;
          border-radius: 8px;
          margin-bottom: 0.35rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .file-selector-item:last-child {
          margin-bottom: 0;
        }
        .file-selector-item:hover {
          background: #f1f5f9;
          border-color: #e2e8f0;
        }
        .file-selector-item.selected {
          background: #ecfdf5;
          border-color: #a7f3d0;
        }
        .file-selector-item-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: #334155;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Sent Logs History Section */
        .sent-log-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 0.75rem 1rem;
          margin-bottom: 0.75rem;
          box-shadow: 0 1px 2px 0 rgba(0,0,0,0.02);
        }
        .sent-log-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        .sent-log-type-tag {
          font-size: 0.65rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.2rem 0.5rem;
          border-radius: 6px;
        }
        .sent-log-type-tag.wa {
          background: #ecfdf5;
          color: #065f46;
        }
        .sent-log-type-tag.push {
          background: #e0e7ff;
          color: #3730a3;
        }
        .sent-log-time {
          font-size: 0.7rem;
          font-weight: 700;
          color: #94a3b8;
        }
        .sent-log-body {
          font-size: 0.75rem;
          font-weight: 600;
          line-height: 1.4;
          color: #475569;
          margin: 0;
          word-break: break-word;
        }

        @media (max-width: 992px) {
          .evolution-container-grid, .integration-container-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 768px) {
          .patient-header-section {
            padding: 1.5rem 1rem;
          }
          .patient-main-info {
            flex-direction: column;
            width: 100%;
            gap: 1rem;
          }
          .header-actions {
            width: 100%;
          }
          .header-actions button {
            flex: 1;
            justify-content: center;
          }
          .history-container {
            padding: 1.5rem;
          }
          .assessment-item-wrapper {
            padding: 1rem;
          }
          .assessment-info {
            gap: 1rem;
          }
          .assessment-icon {
            width: 40px;
            height: 40px;
          }
          .tab-switcher-wrapper {
            overflow-x: auto;
            white-space: nowrap;
            gap: 1rem;
          }
          .tab-switch-btn {
            font-size: 0.85rem;
            padding: 0.75rem 0.25rem;
          }
          .clinical-profile-container {
            margin-bottom: 1.5rem;
          }
          .section-card {
            padding: 1.5rem;
          }
          .form-grid {
            grid-template-columns: 1fr;
          }
          .diagnoses-grid {
            grid-template-columns: 1fr;
          }
          .section-card-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .btn-add-diag {
            width: 100%;
            justify-content: center;
          }
        }

        /* Diagnósticos Styles */
        .clinical-profile-container {
          margin-bottom: 2rem;
        }
        .section-card {
          background-color: white;
          padding: 2.5rem;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border);
        }
        .section-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .header-title-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .header-title-group h3 {
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0;
          color: var(--text);
        }
        .btn-add-diag {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: white;
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: var(--radius-md);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-add-diag:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .add-diag-form {
          background-color: #f9fafb;
          padding: 1.5rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          margin-bottom: 1.5rem;
        }
        .form-title {
          font-size: 1.125rem;
          font-weight: bold;
          margin: 0 0 1rem 0;
        }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.25rem;
          margin-bottom: 1.25rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-group label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text);
        }
        .form-group select,
        .form-group input {
          padding: 0.6rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background-color: white;
          color: var(--text);
          font-size: 0.95rem;
        }
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
        }
        .btn-cancel {
          background-color: white;
          color: var(--text-muted);
          border: 1px solid var(--border);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-cancel:hover {
          background-color: #f3f4f6;
        }
        .btn-submit {
          color: white;
          border: none;
          padding: 0.5rem 1.2rem;
          border-radius: var(--radius-md);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-submit:hover {
          opacity: 0.9;
        }
        .loading-text, .empty-text, .all-discharged-text {
          color: var(--text-muted);
          font-size: 1rem;
          margin: 0;
          text-align: center;
          padding: 1rem 0;
        }
        .diagnoses-lists-wrapper {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .list-subtitle {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text);
          margin: 0 0 1rem 0;
        }
        .diagnoses-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 1.25rem;
        }
        .diagnosis-card {
          padding: 1.25rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          background-color: white;
          position: relative;
          transition: all 0.2s;
        }
        .active-card {
          border-left: 4px solid #9d1d1d;
          background: linear-gradient(to right, #fbfcfd, white);
        }
        .active-card:hover {
          box-shadow: var(--shadow-md);
          border-color: #9d1d1d;
        }
        .discharged-card {
          border-left: 4px solid #9ca3af;
          background-color: #fafafa;
          opacity: 0.85;
        }
        .discharged-card:hover {
          opacity: 1;
        }
        .diag-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }
        .segment-badge {
          font-size: 0.75rem;
          font-weight: bold;
          padding: 2px 8px;
          border-radius: 9999px;
          text-transform: uppercase;
        }
        .discharged-badge {
          color: #4b5563;
          background-color: #e5e7eb;
        }
        .diag-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .action-btn-discharge {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background-color: #ecfdf5;
          color: #059669;
          border: 1px solid #a7f3d0;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
        }
        .action-btn-discharge:hover {
          background-color: #d1fae5;
          border-color: #34d399;
        }
        .action-btn-edit {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background-color: #f3f4f6;
          color: #4b5563;
          border: 1px solid #d1d5db;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
        }
        .action-btn-edit:hover {
          background-color: #e5e7eb;
          border-color: #9ca3af;
        }
        .action-btn-delete {
          color: #9ca3af;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .action-btn-delete:hover {
          color: #ef4444;
          background-color: #fef2f2;
        }
        .muted-delete:hover {
          color: #ef4444;
        }
        .diag-name {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text);
          margin: 0 0 0.75rem 0;
          line-height: 1.3;
        }
        .text-muted {
          color: var(--text-muted) !important;
        }
        .diag-date {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.85rem;
          color: var(--text-muted);
          margin: 0;
        }
        .diag-dates-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .history-diagnoses-section {
          border-top: 1px solid var(--border);
          padding-top: 1.5rem;
          margin-top: 0.5rem;
        }
        .history-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          color: var(--text-muted);
          font-weight: 600;
          cursor: pointer;
          font-size: 0.95rem;
          padding: 0;
          width: 100%;
          text-align: left;
        }
        .history-toggle:hover {
          color: var(--text);
        }
        .history-toggle span {
          flex: 1;
        }
        .history-list {
          margin-top: 1rem;
        }
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(2px);
        }
        .discharge-dialog {
          background-color: white;
          padding: 2rem;
          border-radius: var(--radius-xl);
          width: 90%;
          max-width: 400px;
          box-shadow: var(--shadow-2xl);
          border: 1px solid var(--border);
        }
        .discharge-dialog h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1.25rem;
          font-weight: bold;
          color: var(--text);
        }
        .discharge-subtitle {
          font-size: 0.9rem;
          color: var(--text-muted);
          margin: 0 0 1.5rem 0;
          line-height: 1.4;
        }
        .discharge-confirm-btn {
          background-color: #10b981 !important;
        }
        .discharge-confirm-btn:hover {
          background-color: #059669 !important;
        }
      `}</style>
      <ConfirmModal 
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDeleteAssessment}
        title="Excluir Avaliação"
        message="Tem certeza que deseja excluir esta avaliação? Esta ação não pode ser desfeita e os dados serão removidos permanentemente."
        confirmLabel="Sim, excluir"
        cancelLabel="Cancelar"
      />
      <ConfirmModal 
        isOpen={!!diagToDelete}
        onClose={() => setDiagToDelete(null)}
        onConfirm={handleDeleteDiagConfirm}
        title="Excluir Diagnóstico"
        message="Tem certeza que deseja excluir este diagnóstico? Esta ação não pode ser desfeita e os dados serão removidos permanentemente."
        confirmLabel="Sim, excluir"
        cancelLabel="Cancelar"
      />
    </div>
  );
}
