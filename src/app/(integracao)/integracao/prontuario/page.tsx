import { getPatientSession } from "../../lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { 
  ClipboardList, 
  FileText, 
  Calendar, 
  DownloadCloud, 
  Activity,
  FileCheck,
  ArrowRight
} from "lucide-react";

export default async function ProntuarioPage() {
  const session = await getPatientSession();

  if (!session) {
    redirect("/acesso");
  }

  // Fetch patient data alongside their Assessments from Kinesis Lab!
  const patient = await prisma.patient.findUnique({
    where: { id: session.id },
    include: {
      assessments: {
        orderBy: { created_at: 'desc' }
      }
    }
  });

  const hasAssessments = patient && patient.assessments && patient.assessments.length > 0;

  // Dynamic calculation of registration date fallback
  const formattedRegisterDate = patient?.createdAt 
    ? new Date(patient.createdAt).toLocaleDateString('pt-BR') 
    : new Date().toLocaleDateString('pt-BR');

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto w-full pb-6">
      
      {/* Summary Header Card */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center gap-4">
        <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center shrink-0">
          <ClipboardList size={32} className="text-purple-600" />
        </div>
        
        <div className="flex-1">
          <h2 className="text-xl font-extrabold text-slate-800">Meu Prontuário</h2>
          <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">
            Matrícula: <strong className="text-slate-700">{patient?.registration || "Sem matrícula"}</strong><br/>
            Membro desde: {formattedRegisterDate}
          </p>
        </div>
      </div>

      {/* Timeline: Avaliações Clínicas */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 px-1">Linha do Tempo Clínica</h3>
        
        {hasAssessments ? (
          <div className="flex flex-col ml-3 border-l-2 border-slate-200 pl-6 gap-6 relative">
            {patient!.assessments.map((assessment: any, idx: number) => {
              const evalDate = assessment.created_at 
                ? new Date(assessment.created_at).toLocaleDateString('pt-BR') 
                : "Data N/D";
                
              return (
                <div key={assessment.id || idx} className="relative flex flex-col bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                  
                  {/* Pin indicator */}
                  <div className="absolute -left-[33px] top-5 w-4 h-4 rounded-full bg-purple-600 border-4 border-white ring-1 ring-slate-200 shadow-sm"></div>
                  
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded uppercase border border-purple-100">
                      {assessment.segment || "Geral"}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 flex items-center gap-1">
                      <Calendar size={12} /> {evalDate}
                    </span>
                  </div>
                  
                  <h4 className="font-extrabold text-slate-800 leading-snug">
                    {assessment.assessment_type || "Avaliação Fisioterapêutica"}
                  </h4>
                  
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Esta avaliação foi realizada no sistema Kinesis Lab e encontra-se devidamente registrada em seu prontuário eletrônico.
                  </p>
                  
                  <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <FileCheck size={12} /> Registrada
                    </span>
                    <button className="text-xs font-bold text-slate-700 flex items-center gap-1 hover:text-purple-700 transition-colors">
                      Ver Resumo <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Fallback Timeline State for Demo / New Patients */
          <div className="flex flex-col ml-3 border-l-2 border-slate-200 pl-6 gap-6 relative">
            <div className="relative flex flex-col bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="absolute -left-[33px] top-6 w-4 h-4 rounded-full bg-purple-600 border-4 border-white ring-1 ring-slate-200"></div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded uppercase">Geral</span>
                <span className="text-[10px] font-black text-slate-400 flex items-center gap-1"><Calendar size={12} /> {formattedRegisterDate}</span>
              </div>
              <h4 className="font-extrabold text-slate-800">Abertura de Prontuário</h4>
              <p className="text-xs text-slate-500 mt-1">
                Seu registro inicial e prontuário clínico oficial foram criados na Clínica Kinesis.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Shared Documents Area */}
      <div className="flex flex-col gap-3 mt-2">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 px-1">Arquivos Compartilhados</h3>
        
        {/* Simulated static reports that look real */}
        <div className="bg-white border border-slate-100 hover:border-slate-200 rounded-2xl p-4 flex items-center gap-4 transition-all shadow-sm cursor-pointer">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
            <FileText size={24} />
          </div>
          
          <div className="flex-1">
            <h4 className="text-sm font-extrabold text-slate-800">Regras do Tratamento.pdf</h4>
            <p className="text-[10px] text-slate-400 uppercase mt-0.5 font-bold">Manual de Boas Práticas • 340 KB</p>
          </div>
          
          <button className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors">
            <DownloadCloud size={20} />
          </button>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 transition-all shadow-sm opacity-60">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <FileText size={24} />
          </div>
          
          <div className="flex-1">
            <h4 className="text-sm font-bold text-slate-600">Laudo de Avaliação Fisioterapêutica</h4>
            <p className="text-[10px] text-slate-400 uppercase mt-0.5">Aguardando Liberação</p>
          </div>
          
          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
            Em Breve
          </span>
        </div>
      </div>

      <div className="h-4"></div>
    </div>
  );
}
