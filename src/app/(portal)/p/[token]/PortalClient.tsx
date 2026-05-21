"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ClipboardList, 
  Dumbbell, 
  CalendarDays, 
  Sparkles, 
  ChevronRight, 
  Bell,
  AlertCircle,
  Activity
} from "lucide-react";
import PushManager from "../../../(integracao)/components/PushManager";

type Patient = {
  id: string;
  name: string;
  accessToken: string | null;
};

export default function PortalClient({ patient, token }: { patient: Patient; token: string }) {
  const [diaryDays, setDiaryDays] = useState<number>(0);
  const [activeRequest, setActiveRequest] = useState<any>(null);

  useEffect(() => {
    // Simulação local de logs de diário
    const savedLogs = localStorage.getItem("kinesis_diary_logs");
    if (savedLogs) {
      try {
        const logs = JSON.parse(savedLogs);
        setDiaryDays(Array.isArray(logs) ? logs.length : 0);
      } catch (e) {
        setDiaryDays(0);
      }
    }

    // Simulação de leitura dos avisos enviados pelo Gestor
    try {
      const requests = localStorage.getItem("kinesis_integration_diary_requests");
      if (requests) {
        const parsed = JSON.parse(requests);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const active = parsed.find((req: any) => {
          const start = new Date(req.startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(req.endDate);
          end.setHours(23, 59, 59, 999);
          return today >= start && today <= end;
        });

        if (active) {
          setActiveRequest(active);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto w-full px-4 pb-10 pt-6 animate-in fade-in duration-300">
      
      {/* 1. Push Notification Manager Prompt */}
      <PushManager patientId={patient.id} />

      {/* 2. Header Premium Banner (Replacing plain header) */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col gap-1 border border-slate-800">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full"></div>
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400 mb-1">
          <Sparkles size={14} /> Área Exclusiva Kinesis
        </div>
        <h2 className="text-2xl font-black tracking-tight leading-none mt-1">
          Olá, {patient.name.split(' ')[0]}! 👋
        </h2>
        <p className="text-slate-400 text-sm font-medium mt-1">
          Confira a sua jornada e compromissos hoje.
        </p>
      </div>

      {/* 3. Active Portal Tasks Hub */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Ações de Hoje</h3>

        {/* Task A: Pain Diary */}
        <Link 
          href={`/p/${token}/diario`} 
          className={`group flex items-center gap-4 p-5 rounded-3xl border transition-all active:scale-[0.97] hover:shadow-md ${
            activeRequest 
              ? 'bg-amber-50 border-amber-300 shadow-sm' 
              : 'bg-white border-slate-100'
          }`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
            activeRequest ? 'bg-amber-500 text-white' : 'bg-rose-50 text-rose-600'
          }`}>
            <ClipboardList size={24} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="font-black text-slate-800 truncate">Diário de Dor</h4>
              {activeRequest && (
                <span className="text-[8px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded uppercase animate-pulse">
                  Urgente
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate pr-2">
              {activeRequest ? activeRequest.message : "Informe seu nível de dor e disposição hoje."}
            </p>
          </div>

          <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-600 transition-transform group-hover:translate-x-1 shrink-0" />
        </Link>

        {/* Task B: Realizar Exercícios */}
        <Link 
          href={`/p/${token}/exercicios`} 
          className="group flex items-center gap-4 p-5 bg-white border border-slate-100 hover:shadow-md rounded-3xl transition-all active:scale-[0.97]"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
            <Dumbbell size={24} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="font-black text-slate-800 truncate">Vídeos de Exercício</h4>
              <span className="text-[8px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded uppercase">
                Rotina
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate pr-2">
              Veja os vídeos demonstrativos e execute sua rotina.
            </p>
          </div>

          <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-600 transition-transform group-hover:translate-x-1 shrink-0" />
        </Link>

        {/* Task C: Lembretes e Horários (Novo!) */}
        <Link 
          href={`/p/${token}/lembretes`} 
          className="group flex items-center gap-4 p-5 bg-white border border-slate-100 hover:shadow-md rounded-3xl transition-all active:scale-[0.97]"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
            <Activity size={24} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-black text-slate-800 truncate">Meus Lembretes</h4>
            <p className="text-xs text-slate-500 mt-0.5 truncate pr-2">
              Confira os lembretes de saúde prescritos.
            </p>
          </div>

          <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-600 transition-transform group-hover:translate-x-1 shrink-0" />
        </Link>
      </div>

      {/* 4. Notice Feed Area (From the premium prototype) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mt-2">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
            <Bell size={16} />
          </div>
          <h3 className="font-black text-slate-800">Avisos da Clínica</h3>
        </div>

        <div className="flex flex-col gap-4">
          <div className="border-l-4 border-purple-300 pl-3 py-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Kinesis</span>
            <h4 className="text-sm font-bold text-slate-800">Suporte e Contato</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Estamos à disposição via WhatsApp para quaisquer dúvidas sobre seus treinos ou evolução clínica.
            </p>
          </div>

          <div className="border-l-4 border-teal-300 pl-3 py-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Novidade</span>
            <h4 className="text-sm font-bold text-slate-800">Lembretes e Exercícios</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Agora você pode visualizar todos os seus exercícios domiciliares e cronograma diretamente por este link!
            </p>
          </div>
        </div>
      </div>

      {/* 5. Footer */}
      <footer style={{ textAlign: 'center', padding: '10px', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 700 }}>
        Kinesis Fisioterapia &copy; {new Date().getFullYear()}
      </footer>
      
    </div>
  );
}
