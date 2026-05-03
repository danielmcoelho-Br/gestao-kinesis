"use client";

import { useState, useEffect } from "react";

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const fileTypes = [
  { id: "SEUFISIO", label: "Estatística de Atendimento (SEUFISIO)", icon: "📊" },
  { id: "COBRANCAS", label: "Relatório de Cobrança Mensal (Excel)", icon: "💰" },
  { id: "BANCO_BB", label: "Extrato Banco do Brasil", icon: "🏛️" },
  { id: "BANCO_INTER", label: "Extrato Banco Inter", icon: "🏦" },
  { id: "PERFIL_PACIENTE", label: "Perfil do Paciente", icon: "👤" },
];

import { usePeriod } from "@/context/PeriodContext";

export default function UploadPage() {
  const { startMonth: selectedMonth, startYear: selectedYear, setStartMonth: setSelectedMonth, setStartYear: setSelectedYear } = usePeriod();
  const [importLogs, setImportLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewingRaw, setViewingRaw] = useState<any>(null);

  const fetchLogs = async () => {
    const res = await fetch("/api/import-logs");
    if (res.ok) setImportLogs(await res.json());
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleUpload = async (type: string, file: File) => {
    console.log("Iniciando upload:", type, file.name);
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    formData.append("month", selectedMonth.toString());
    formData.append("year", selectedYear.toString());

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert(`Sucesso! ${result.message || "Arquivo processado."}`);
        fetchLogs();
      } else {
        alert(`Erro no Servidor: ${result.error || "Erro desconhecido"}`);
      }
    } catch (error: any) {
      console.error("Erro no fetch:", error);
      alert(`Erro de Conexão: Não foi possível contatar o servidor. (${error.message})`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta importação? Todos os dados vinculados a este arquivo (sessões/transações) também serão removidos.")) return;
    
    try {
      const res = await fetch(`/api/import-logs/${id}`, { method: "DELETE" });
      if (res.ok) fetchLogs();
    } catch (error) {
      console.error("Erro ao excluir log:", error);
    }
  };

  const getLogForType = (type: string) => {
    return importLogs.find(log => 
      log.fileType === type && 
      log.month === selectedMonth && 
      log.year === selectedYear
    );
  };

  return (
    <div style={{ paddingBottom: '40px' }}>
      <header className="header" style={{ marginBottom: '40px' }}>
        <div style={{ textAlign: 'center', background: 'var(--surface-color)', padding: '32px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '16px', color: 'var(--primary)' }}>Central de Importação</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Gerencie os dados da clínica selecionando o período abaixo:</p>
          
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'center' }}>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              style={{ padding: '12px 24px', borderRadius: '12px', border: '2px solid var(--primary)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: '600', cursor: 'pointer' }}
            >
              {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={{ padding: '12px 24px', borderRadius: '12px', border: '2px solid var(--primary)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: '600', cursor: 'pointer' }}
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        {fileTypes.map((type) => {
          const log = getLogForType(type.id);
          return (
            <div key={type.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', border: log ? '2px solid var(--success)' : '1px solid var(--border-color)', transform: 'translateY(0)', transition: 'transform 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '32px' }}>{type.icon}</div>
                {log && <span style={{ fontSize: '0.7rem', background: 'var(--success)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>IMPORTADO</span>}
              </div>
              <h3 style={{ fontSize: '1.1rem', minHeight: '3em' }}>{type.label}</h3>
              
              {log ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', fontSize: '0.85rem', marginBottom: '12px' }}>
                    Arquivo: {log.fileName}
                    <br/>
                    <small>Em {new Date(log.createdAt).toLocaleDateString('pt-BR')}</small>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                    <button 
                      onClick={() => setViewingRaw(log)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' }}
                    >
                      Ver Dados Brutos
                    </button>
                    <button 
                      onClick={() => handleDelete(log.id)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' }}
                    >
                      Excluir Importação
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Nenhum arquivo enviado para este mês.</p>
                  <label className="btn" style={{ marginTop: 'auto', textAlign: 'center', cursor: 'pointer' }}>
                    Fazer Upload
                    <input 
                      type="file" 
                      accept=".pdf,.xlsx,.xls,.csv" 
                      onChange={(e) => e.target.files?.[0] && handleUpload(type.id, e.target.files[0])}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              )}
              
              {loading && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', zIndex: 10 }}>
                  Processando...
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Visualizador de Dados Brutos */}
      {viewingRaw && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '40px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '900px', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <button 
              onClick={() => setViewingRaw(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-primary)' }}
            >
              ✕
            </button>
            <h2 style={{ marginBottom: '8px' }}>Dados Brutos: {viewingRaw.fileName}</h2>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <p style={{ color: 'var(--text-secondary)', flex: 1 }}>Conteúdo extraído do PDF original para conferência.</p>
              {viewingRaw.filePath && (
                <button 
                  onClick={() => window.open(`/api/files/${viewingRaw.filePath}`, '_blank')}
                  style={{ padding: '6px 16px', borderRadius: '8px', border: '1px solid var(--primary)', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
                >
                  📄 Abrir Arquivo Original
                </button>
              )}
            </div>
            
            <div style={{ flex: 1, background: '#1e1e1e', color: '#d4d4d4', padding: '24px', borderRadius: '8px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.9rem', whiteSpace: 'pre-wrap', border: '1px solid #333' }}>
              {viewingRaw.rawText || "Nenhum texto bruto disponível para este arquivo."}
            </div>

            <button 
              className="btn" 
              onClick={() => setViewingRaw(null)} 
              style={{ marginTop: '20px', alignSelf: 'center', padding: '12px 40px' }}
            >
              Fechar Visualização
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
