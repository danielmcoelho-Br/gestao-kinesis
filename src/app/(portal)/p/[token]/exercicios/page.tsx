import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  Dumbbell, 
  PlayCircle, 
  CheckCircle, 
  Clock, 
  Activity, 
  ArrowLeft
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ExerciciosPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Resgata o paciente e seus exercícios via Token da URL (Sem login de senha)
  const patient = await prisma.patient.findUnique({
    where: { accessToken: token },
    select: { name: true, prescribed_exercises: true }
  });

  if (!patient) {
    return notFound();
  }

  // Mock estático de segurança se a biblioteca de exercícios do banco estiver vazia
  const defaultExercises = [
    {
      id: "1",
      title: "Ponte Pélvica Unilateral",
      description: "Deitado de costas com joelhos dobrados. Eleve o quadril mantendo uma perna estendida no ar. Mantenha a pelve alinhada durante o movimento.",
      sets: 3,
      reps: "12 repetições",
      rest: "45 segundos",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      category: "Fortalecimento"
    },
    {
      id: "2",
      title: "Mobilidade de Quadril e Coluna",
      description: "Em quatro apoios. Curve as costas para cima olhando para o umbigo (gato), depois empine o bumbum olhando para frente (camelo). Movimentos lentos.",
      sets: 2,
      reps: "10 ciclos",
      rest: "30 segundos",
      videoUrl: null,
      category: "Mobilidade"
    }
  ];

  let activeExercises = defaultExercises;
  if (patient?.prescribed_exercises) {
    try {
      const dbData = patient.prescribed_exercises;
      if (Array.isArray(dbData) && dbData.length > 0) {
        activeExercises = dbData as any;
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto w-full px-4 pb-10 pt-6 animate-in fade-in duration-300">
      
      {/* Botão Voltar */}
      <div className="flex items-center gap-3">
        <Link 
          href={`/p/${token}`} 
          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl shadow-sm transition-all active:scale-90 flex items-center justify-center"
        >
          <ArrowLeft size={20} strokeWidth={3} />
        </Link>
        <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Voltar para o Hub</span>
      </div>

      {/* Header Routine Card */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden border border-emerald-500/20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full"></div>
        <div className="flex items-center gap-2 bg-emerald-500/30 backdrop-blur-sm w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
          <Activity size={12} /> Fisioterapia Domiciliar
        </div>
        <h2 className="text-2xl font-black tracking-tight">Rotina Prescrita</h2>
        <p className="text-emerald-100 text-sm font-medium mt-1 leading-relaxed opacity-90">
          Treinos sob medida para a evolução de {patient.name.split(' ')[0]}.
        </p>
        
        <div className="flex gap-5 mt-5 pt-5 border-t border-white/10">
          <div className="flex items-center gap-1.5">
            <Dumbbell size={16} className="text-emerald-200" />
            <span className="text-xs font-black text-white">{activeExercises.length} Exercícios</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={16} className="text-emerald-200" />
            <span className="text-xs font-black text-white">15 a 20 min</span>
          </div>
        </div>
      </div>

      {/* Exercise Feed */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Lista de Exercícios</h3>
        
        {activeExercises.map((ex: any, idx: number) => (
          <div key={ex.id || idx} className="bg-white border border-slate-100 shadow-sm rounded-3xl overflow-hidden flex flex-col transition-all hover:shadow-md">
            
            {/* Header line */}
            <div className="p-5 flex items-start gap-4 border-b border-slate-50">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm shrink-0 mt-0.5 shadow-sm">
                {idx + 1}
              </div>
              
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 tracking-wide inline-block">
                  {ex.category || "Terapêutico"}
                </span>
                <h4 className="font-black text-slate-800 text-lg mt-1 leading-tight truncate pr-2">
                  {ex.title}
                </h4>
              </div>
            </div>

            {/* Info grid */}
            <div className="px-5 py-3.5 bg-slate-50/30 grid grid-cols-3 gap-2 text-center border-b border-slate-50">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Séries</span>
                <span className="font-black text-slate-700 text-sm mt-0.5">{ex.sets} x</span>
              </div>
              <div className="flex flex-col border-x border-slate-100">
                <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Repetições</span>
                <span className="font-black text-slate-700 text-sm mt-0.5 truncate px-1">{ex.reps}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Descanso</span>
                <span className="font-black text-slate-700 text-sm mt-0.5 flex items-center justify-center gap-1">
                  <Clock size={12} className="text-slate-400" /> {ex.rest || '30s'}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="p-5 text-slate-600 text-sm font-medium leading-relaxed">
              <p className="text-slate-500">{ex.description}</p>
              
              {ex.videoUrl ? (
                <div className="mt-5 flex flex-col gap-2">
                  <a 
                    href={ex.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 rounded-2xl font-black text-xs transition-all shadow-sm active:scale-[0.98]"
                  >
                    <PlayCircle size={16} /> Ver Vídeo Demonstrativo
                  </a>
                  <button className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] shadow-md">
                    <CheckCircle size={14} /> Concluir Exercício
                  </button>
                </div>
              ) : (
                <div className="mt-5">
                  <button className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] shadow-md">
                    <CheckCircle size={16} /> Marcar como Concluído
                  </button>
                </div>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* Empty spacer */}
      <div className="h-4"></div>
    </div>
  );
}
