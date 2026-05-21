"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ClipboardList, 
  Dumbbell, 
  CalendarDays, 
  CheckCircle2, 
  Sparkles, 
  ChevronRight, 
  AlertCircle, 
  Bell
} from "lucide-react";

export default function IntegracaoHome() {
  const [diaryDays, setDiaryDays] = useState<number>(0);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const targetDays = 14;

  useEffect(() => {
    const savedLogs = localStorage.getItem("kinesis_diary_logs");
    if (savedLogs) {
      try {
        const logs = JSON.parse(savedLogs);
        setDiaryDays(Array.isArray(logs) ? logs.length : 0);
      } catch (e) {
        setDiaryDays(0);
      }
    }

    // Read clinic push notification history simulation
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
    <div className="flex flex-col gap-6 max-w-md mx-auto w-full">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-lg relative overflow-hidden flex flex-col gap-1">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full"></div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
          <Sparkles size={14} /> Status da Jornada
        </div>
        <h2 className="text-2xl font-bold">Minhas Solicitações</h2>
        <p className="text-slate-400 text-sm">Confira os deveres que sua equipe prescreveu para hoje:</p>
      </div>

      {/* Active Tasks List (The Main Hub) */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Pendente Hoje</h3>

        {/* Task 1: Pain Diary (Urgent if request active) */}
        <Link href="/integracao/diario" className={`group flex items-center gap-4 p-5 rounded-2xl border transition-all active:scale-[0.98] ${
          activeRequest 
            ? 'bg-amber-50 border-amber-300 shadow-sm' 
            : 'bg-white border-slate-100 hover:border-slate-200'
        }`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            activeRequest ? 'bg-amber-500 text-white' : 'bg-indigo-50 text-indigo-600'
          }`}>
            <ClipboardList size={24} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h4 className="font-extrabold text-slate-800">Diário de Dor</h4>
              {activeRequest && (
                <span className="text-[9px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded uppercase animate-pulse">
                  Urgente
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeRequest ? activeRequest.message : "Informe seu nível de dor e disposição hoje."}
            </p>
          </div>

          <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-600" />
        </Link>

        {/* Task 2: Realizar Exercícios */}
        <Link href="/integracao/exercicios" className="group flex items-center gap-4 p-5 bg-white border border-slate-100 hover:border-slate-200 rounded-2xl transition-all active:scale-[0.98]">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Dumbbell size={24} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h4 className="font-extrabold text-slate-800">Série de Exercícios</h4>
              <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded uppercase">
                Diário
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Execute sua rotina terapêutica prescrita em casa.
            </p>
          </div>

          <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-600" />
        </Link>

        {/* Task 3: Agendamento Simulado */}
        <div className="flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-2xl opacity-80">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <CalendarDays size={24} />
          </div>
          
          <div className="flex-1">
            <h4 className="font-bold text-slate-700">Próxima Sessão</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Sexta-feira, 15 de Maio • às 14:00h
            </p>
          </div>

          <span className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1 bg-slate-50 rounded">
            Confirmado
          </span>
        </div>
      </div>

      {/* Notice Feed Area */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mt-2">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
            <Bell size={16} />
          </div>
          <h3 className="font-bold text-slate-800">Avisos Recentes da Clínica</h3>
        </div>

        <div className="flex flex-col gap-4">
          <div className="border-l-4 border-purple-300 pl-3 py-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Hoje</span>
            <h4 className="text-sm font-bold text-slate-800">Horário de Funcionamento</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Atenção: No feriado municipal de amanhã, a clínica Kinesis funcionará em regime especial das 08:00 às 12:00h.
            </p>
          </div>

          <div className="border-l-4 border-teal-300 pl-3 py-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Esta semana</span>
            <h4 className="text-sm font-bold text-slate-800">Novidades na Central</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Acabamos de inaugurar a aba **Exercícios**! Agora você pode ver seus vídeos terapêuticos sem sair do portal!
            </p>
          </div>
        </div>
      </div>
      
    </div>
  );
}
