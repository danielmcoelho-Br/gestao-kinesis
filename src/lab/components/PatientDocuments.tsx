"use client";

import { useState } from "react";
import { 
  FileText, 
  Image as ImageIcon, 
  File as FileIcon, 
  Plus, 
  X, 
  Download, 
  Trash2, 
  Loader2,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { addPatientDocument, deletePatientDocument } from "@/app/(lab)/dashboard/actions";
import { toast } from "sonner";

interface Document {
  id: string;
  name: string;
  type: string;
  data: string;
  size: number;
  uploaded_at: string;
}

interface PatientDocumentsProps {
  patientId: string;
  initialDocuments: any;
}

export default function PatientDocuments({ patientId, initialDocuments }: PatientDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>(
    Array.isArray(initialDocuments) ? initialDocuments : []
  );
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const isPDF = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    
    if (!isPDF && !isImage) {
      toast.error("Formatos permitidos: PDF ou Imagens");
      return;
    }

    // Validate size (max 5MB for base64 storage)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Tamanho máximo: 5MB");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    
    reader.onload = async () => {
      const base64Data = reader.result as string;
      const result = await addPatientDocument(patientId, {
        name: file.name,
        type: file.type,
        data: base64Data,
        size: file.size
      });

      if (result.success && result.data) {
        setDocuments(prev => [...prev, result.data as Document]);
        toast.success("Documento anexado!");
      } else {
        toast.error(result.error || "Erro ao fazer upload");
      }
      setIsUploading(false);
    };

    reader.onerror = () => {
      toast.error("Erro ao ler arquivo");
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
    // Reset input
    e.target.value = '';
  };

  const handleDelete = async (docId: string) => {
    const result = await deletePatientDocument(patientId, docId);
    if (result.success) {
      setDocuments(prev => prev.filter(d => d.id !== docId));
      toast.success("Documento removido");
    } else {
      toast.error("Erro ao excluir documento");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="documents-section">
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={20} style={{ color: 'var(--primary)' }} />
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Laudos e Exames</h3>
        </div>
        
        <div className="upload-wrapper">
          <input 
            type="file" 
            accept="application/pdf,image/*" 
            onChange={handleFileUpload}
            id="doc-upload"
            disabled={isUploading}
            hidden
          />
          <label htmlFor="doc-upload" className="btn-upload">
            {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
            <span>{isUploading ? 'Enviando...' : 'Anexar Documento'}</span>
          </label>
        </div>
      </div>

      <div className="documents-grid">
        <AnimatePresence>
          {documents.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="empty-docs"
            >
              <FileIcon size={40} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
              <p>Nenhum laudo ou exame anexado ainda.</p>
            </motion.div>
          ) : (
            documents.map((doc) => (
              <motion.div 
                key={doc.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="doc-card"
              >
                <div className="doc-preview">
                  {doc.type.startsWith('image/') ? (
                    <img src={doc.data} alt={doc.name} className="img-preview" />
                  ) : (
                    <div className="pdf-placeholder">
                      <FileText size={48} />
                      <span>PDF</span>
                    </div>
                  )}
                  
                  <div className="doc-overlay">
                    <button 
                      onClick={() => {
                        const win = window.open();
                        win?.document.write(`<iframe src="${doc.data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                      }}
                      className="overlay-btn"
                      title="Visualizar"
                    >
                      <ExternalLink size={20} />
                    </button>
                    <a 
                      href={doc.data} 
                      download={doc.name}
                      className="overlay-btn"
                      title="Baixar"
                    >
                      <Download size={20} />
                    </a>
                  </div>
                </div>

                <div className="doc-info">
                  <div className="doc-details">
                    <span className="doc-name" title={doc.name}>{doc.name}</span>
                    <span className="doc-meta">
                      {formatSize(doc.size)} • {new Date(doc.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleDelete(doc.id)}
                    className="btn-delete-doc"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        .documents-section {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid var(--border);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .btn-upload {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: var(--primary);
          color: white;
          padding: 0.6rem 1.25rem;
          border-radius: 0.75rem;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 6px -1px rgba(139, 0, 0, 0.2);
        }

        .btn-upload:hover {
          background-color: #720000;
          transform: translateY(-1px);
        }

        .btn-upload:active {
          transform: translateY(0);
        }

        .documents-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1.5rem;
          min-height: 120px;
        }

        .empty-docs {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          background-color: #f8fafc;
          border-radius: 1rem;
          border: 2px dashed #e2e8f0;
          color: #64748b;
          font-size: 0.875rem;
        }

        .doc-card {
          background: white;
          border-radius: 1rem;
          border: 1px solid var(--border);
          overflow: hidden;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
        }

        .doc-card:hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          transform: translateY(-4px);
          border-color: var(--primary);
        }

        .doc-preview {
          position: relative;
          height: 140px;
          background-color: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .img-preview {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .pdf-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          color: #EF4444;
        }

        .pdf-placeholder span {
          font-weight: 900;
          font-size: 0.75rem;
        }

        .doc-overlay {
          position: absolute;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .doc-preview:hover .doc-overlay {
          opacity: 1;
        }

        .overlay-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: white;
          color: var(--secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .overlay-btn:hover {
          transform: scale(1.1);
          color: var(--primary);
        }

        .doc-info {
          padding: 1rem;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }

        .doc-details {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          flex: 1;
        }

        .doc-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .doc-meta {
          font-size: 0.7rem;
          color: #64748b;
          margin-top: 2px;
        }

        .btn-delete-doc {
          color: #94a3b8;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
          border: none;
          background: transparent;
          cursor: pointer;
        }

        .btn-delete-doc:hover {
          color: #EF4444;
          background-color: #fef2f2;
        }

        @media (max-width: 640px) {
          .documents-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          }
          .doc-preview {
            height: 110px;
          }
        }
      `}</style>
    </div>
  );
}
