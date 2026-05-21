"use client";

import { Droplets, Dumbbell, UserCheck, BellRing, Check, Bell, Calendar, Clock } from "lucide-react";
import { useState, useEffect } from "react";

export default function IntegracaoLembretes() {
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
      const dynamicReminders = localStorage.getItem('kinesis_integration_reminders_dynamic');
      if (dynamicReminders) {
        const parsed = JSON.parse(dynamicReminders);
        const newReminders = parsed.map((item: any, idx: number) => {
          let displayTime = new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          let scheduleDesc = "";

          // Parse Complex Recurrence
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
            scheduleDesc: scheduleDesc, // Custom extra schedule field
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
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-sm mb-4">
          <BellRing size={32} className="text-purple-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800">Lembretes do Dia</h2>
        <p className="text-slate-500 mt-2">Pequenas atitudes que fazem grande diferença na sua saúde.</p>
      </div>

      <div className="flex flex-col gap-4">
        {reminders.map((reminder) => (
          <div 
            key={reminder.id} 
            className={`p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden ${reminder.done ? 'bg-slate-100 border-slate-200 opacity-60' : `${reminder.bg} ${reminder.border}`}`}
          >
            {reminder.done && (
              <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/20 rounded-bl-full flex items-center justify-center">
                <Check size={24} className="text-green-600 ml-4 mb-4" />
              </div>
            )}
            
            <div className="flex gap-5">
              <div className={`shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center bg-white shadow-sm ${reminder.done && 'grayscale'}`}>
                {reminder.icon}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`text-xl font-bold ${reminder.done ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                    {reminder.title}
                  </h3>
                  <span className="text-slate-500 font-medium text-sm">{reminder.time}</span>
                </div>
                
                {(reminder as any).scheduleDesc && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 mb-3 uppercase tracking-wide">
                    <Calendar size={14} />
                    {(reminder as any).scheduleDesc}
                  </div>
                )}

                <div className="flex items-start gap-2 mb-4">
                  {(reminder as any).scheduleDesc && <Clock size={18} className="mt-1 shrink-0 text-slate-400" />}
                  <p className={`text-lg ${reminder.done ? 'text-slate-400' : 'text-slate-600'}`}>
                    {reminder.message}
                  </p>
                </div>
                
                {!reminder.done && (
                  <button 
                    onClick={() => markAsDone(reminder.id)}
                    className="px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 font-bold shadow-sm transition-colors w-full sm:w-auto"
                  >
                    Marcar como Feito
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {reminders.every(r => r.done) && (
        <div className="mt-4 p-6 bg-green-50 rounded-3xl text-center border border-green-100">
          <h3 className="text-2xl font-bold text-green-700 mb-2">Excelente! 🎉</h3>
          <p className="text-green-600 text-lg">Você completou todos os seus lembretes de hoje.</p>
        </div>
      )}
    </div>
  );
}
