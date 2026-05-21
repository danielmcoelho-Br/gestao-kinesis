import { getPatientSession } from "../../lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { 
  Dumbbell, 
  PlayCircle, 
  CheckCircle, 
  Clock, 
  Activity, 
  RotateCcw,
  Video
} from "lucide-react";

export default async function ExerciciosPage() {
  const session = await getPatientSession();

  if (!session) {
    redirect("/acesso");
  }

  // Fetch from database
  const patient = await prisma.patient.findUnique({
    where: { id: session.id },
    select: { prescribed_exercises: true }
  });

  // Mock static fallback if database JSON is empty
  const defaultExercises = [
    {
      id: "1",
      title: "Ponte Pélvica Unilateral",
      description: "Deitado de costas com joelhos dobrados. Eleve o quadril mantendo uma perna estendida no ar. Mantenha a pelve alinhada durante o movimento.",
      sets: 3,
      reps: "12 repetições cada lado",
      rest: "45 segundos",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Video link
      category: "Fortalecimento"
    },
    {
      id: "2",
      title: "Gato e Camelo (Mobilidade Coluna)",
      description: "Em quatro apoios. Curve as costas para cima olhando para o umbigo (gato), depois empine o bumbum olhando para frente (camelo). Movimentos lentos.",
      sets: 2,
      reps: "10 ciclos completos",
      rest: "30 segundos",
      videoUrl: null,
      category: "Mobilidade"
    },
    {
      id: "3",
      title: "Prancha Frontal Isométrica",
      description: "Apoie antebraços no chão e a ponta dos pés. Mantenha o corpo alinhado como uma tábua. Contraia bem o abdômen e não deixe o quadril cair.",
      sets: 3,
      reps: "30 segundos de sustentação",
      rest: "60 segundos",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      category: "Estabilização Core"
    }
  ];

  // Parse database exercises or use mock
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
    <div className="flex flex-col gap-6 max-w-md mx-auto w-full pb-6">
      
      {/* Header Routine Card */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full"></div>
        <div className="flex items-center gap-2 bg-emerald-500/30 backdrop-blur-sm w-fit px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
          <Activity size={12} /> Fisioterapia Domiciliar
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight">Rotina Prescrita</h2>
        <p className="text-emerald-100 text-sm font-medium mt-1 leading-relaxed">
          Série de Mobilidade e Fortalecimento Ativo - Fase I
        </p>
        
        <div className="flex gap-5 mt-5 pt-5 border-t border-white/10">
          <div className="flex items-center gap-1.5">
            <Dumbbell size={16} className="text-emerald-200" />
            <span className="text-xs font-bold text-white">{activeExercises.length} Exercícios</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={16} className="text-emerald-200" />
            <span className="text-xs font-bold text-white">15 a 20 min</span>
          </div>
        </div>
      </div>

      {/* Exercise Feed */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 px-1">Lista de Exercícios</h3>
        
        {activeExercises.map((ex: any, idx: number) => (
          <div key={ex.id || idx} className="bg-white border border-slate-100 shadow-sm rounded-3xl overflow-hidden flex flex-col">
            
            {/* Header line */}
            <div className="p-5 flex items-start gap-4 border-b border-slate-50">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
                {idx + 1}
              </div>
              
              <div className="flex-1">
                <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 tracking-wide">
                  {ex.category || "Terapêutico"}
                </span>
                <h4 className="font-extrabold text-slate-800 text-lg mt-1 leading-tight">
                  {ex.title}
                </h4>
              </div>
            </div>

            {/* Info grid */}
            <div className="px-5 py-3.5 bg-slate-50/50 grid grid-cols-3 gap-2 text-center border-b border-slate-50">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400">Séries</span>
                <span className="font-black text-slate-700 text-sm mt-0.5">{ex.sets} x</span>
              </div>
              <div className="flex flex-col border-x border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Repetições</span>
                <span className="font-black text-slate-700 text-sm mt-0.5 truncate px-1">{ex.reps}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400">Descanso</span>
                <span className="font-black text-slate-700 text-sm mt-0.5 flex items-center justify-center gap-1">
                  <Clock size={12} className="text-slate-400" /> {ex.rest}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="p-5 text-slate-600 text-sm leading-relaxed">
              <p>{ex.description}</p>
              
              {ex.videoUrl ? (
                <div className="mt-4 flex gap-2">
                  <a 
                    href={ex.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 rounded-xl font-bold text-xs transition-colors"
                  >
                    <PlayCircle size={16} /> Ver Vídeo Demonstrativo
                  </a>
                  <button className="px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5">
                    <CheckCircle size={14} /> Concluir
                  </button>
                </div>
              ) : (
                <div className="mt-4">
                  <button className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5">
                    <CheckCircle size={16} /> Marcar como Concluído
                  </button>
                </div>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* Empty spacer for footer spacing buffer */}
      <div className="h-4"></div>
    </div>
  );
}
