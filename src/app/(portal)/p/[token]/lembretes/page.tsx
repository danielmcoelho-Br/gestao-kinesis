"use client";

import { Droplets, Dumbbell, UserCheck, BellRing, Check, Bell, Calendar, Clock, ArrowLeft } from "lucide-react";
import { useState, useEffect, use } from "react";
import Link from "next/link";

export default function PortalLembretesPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params); // Resolves the params Promise inside the client component safely

  const [reminders, setReminders] = useState([
    {
      id: 1,
      title: "Hidratação",
      message: "Beba um copo de água agora mesmo! A hidratação ajuda na recuperação muscular.",
      time: "10:00",
      icon: <Droplets size={28} className="text-blue-500" />,
      bg: "bg-blue-50",
      border: "border-blue-200",
      done: false
    },
    {
      id: 2,
      title: "Ajuste de Postura",
      message: "Que tal alinhar a coluna? Relaxe os ombros e respire fundo 3 vezes.",
      time: "14:30",
      icon: <UserCheck size={28} className="text-purple-500" />,
      bg: "bg-[#D8BFD8]/30",
      border: "border-[#D8BFD8]",
      done: false
    },
    {
      id: 3,
      title: "Hora do Exercício",
      message: "Faça seus 15 minutos de alongamento prescritos pela fisioterapeuta.",
      time: "18:00",
      icon: <Dumbbell size={28} className="text-teal-600" />,
      bg: "bg-[#AFEEEE]/40",
      border: "border-[#AFEEEE]",
      done: false
    }
  ]);

  useEffect(() => {
    const weekDayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    
    try {
      // Resgata lembretes simulados enviados pela clínica via localStorage no dispositivo do paciente
      const dynamicReminders = localStorage.getItem('kinesis_integration_reminders_dynamic');
      if (dynamicReminders) {
        const parsed = JSON.parse(dynamicReminders);
        const newReminders = parsed.map((item: any, idx: number) => {
          let displayTime = new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          let scheduleDesc = "";

          if (item.scheduleTimes && item.scheduleTimes.length > 0) {
            displayTime = item.scheduleTimes.join(", ");
          }

          if (item.scheduleDays && item.scheduleDays.length > 0) {
            const days = item.scheduleDays.map((d: number) => weekDayNames[d]).join(", ");
            scheduleDesc = `(${days})`;
          }

          if (item.startDate && item.endDate) {
            const start = new Date(item.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            const end = new Date(item.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            scheduleDesc = scheduleDesc ? `${scheduleDesc} • ${start} até ${end}` : `Período: ${start} até ${end}`;
          }

          return {
            id: 100 + idx,
            title: item.title,
            message: item.message,
            time: displayTime,
            scheduleDesc: scheduleDesc,
            icon: <Bell size={28} className="text-emerald-500" />,
            bg: "bg-emerald-50",
            border: "border-emerald-200",
            done: false
          };
        });
        
        setReminders(prev => [...prev, ...newReminders]);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const markAsDone = (id: number) => {
    setReminders(reminders.map(r => r.id === id ? { ...r, done: true } : r));
  };

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto w-full px-4 pb-10 pt-6 animate-in fade-in duration-300">
      
      {/* Botão Voltar */}
      <div className="flex items-center gap-3 mb-2">
        <Link 
          href={`/p/${token}`} 
          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl shadow-sm transition-all active:scale-90 flex items-center justify-center"
        >
          <ArrowLeft size={20} strokeWidth={3} />
        </Link>
        <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Voltar para o Hub</span>
      </div>

      {/* Header Banner */}
      <div className="text-center mb-2">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-3xl border border-slate-100 shadow-md mb-4">
          <BellRing size={32} className="text-indigo-600" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none">Lembretes do Dia</h2>
        <p className="text-slate-500 font-medium text-sm mt-2">
          Pequenas atitudes diárias que aceleram sua recuperação.
        </p>
      </div>

      {/* List of Reminders */}
      <div className="flex flex-col gap-4">
        {reminders.map((reminder) => (
          <div 
            key={reminder.id} 
            className={`p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden shadow-sm hover:shadow-md ${
              reminder.done 
                ? 'bg-slate-50 border-slate-200 opacity-60 shadow-none' 
                : `${reminder.bg} ${reminder.border}`
            }`}
          >
            {reminder.done && (
              <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-bl-full flex items-center justify-center">
                <Check size={20} className="text-green-600 ml-4 mb-4" strokeWidth={3} />
              </div>
            )}
            
            <div className="flex gap-4">
              {/* Icon Block */}
              <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center bg-white shadow-sm ${reminder.done && 'grayscale'}`}>
                {reminder.icon}
              </div>
              
              {/* Texts and Actions */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1 gap-2">
                  <h3 className={`font-black text-lg leading-tight text-slate-800 ${reminder.done ? 'line-through text-slate-400' : ''}`}>
                    {reminder.title}
                  </h3>
                  <span className="text-slate-500 font-black text-xs shrink-0 bg-white/50 px-2 py-0.5 rounded-md shadow-xs">{reminder.time}</span>
                </div>
                
                {(reminder as any).scheduleDesc && (
                  <div className="flex items-center gap-1 text-[10px] font-black text-emerald-700 mb-2 uppercase tracking-wider leading-none">
                    <Calendar size={12} />
                    {(reminder as any).scheduleDesc}
                  </div>
                )}

                <p className={`text-sm leading-relaxed font-medium mb-4 ${reminder.done ? 'text-slate-400' : 'text-slate-600'}`}>
                  {reminder.message}
                </p>
                
                {!reminder.done && (
                  <button 
                    onClick={() => markAsDone(reminder.id)}
                    className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 font-black text-xs shadow-sm transition-all active:scale-[0.98]"
                  >
                    Marcar como Feito
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Perfect state indicator */}
      {reminders.every(r => r.done) && (
        <div className="mt-2 p-6 bg-green-50 rounded-3xl text-center border border-green-100 animate-in zoom-in duration-300">
          <h3 className="text-xl font-black text-green-700 mb-1">Excelente! 🎉</h3>
          <p className="text-green-600 text-sm font-medium">Você completou todos os lembretes recomendados hoje.</p>
        </div>
      )}

    </div>
  );
}
