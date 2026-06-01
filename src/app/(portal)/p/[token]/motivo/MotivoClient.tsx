"use client";

import { useState } from "react";
import { saveReengagementFeedbackAction } from "../../../actions";
import { 
  Sparkles, 
  Send, 
  CheckCircle2, 
  Activity,
  Smile,
  DollarSign,
  Calendar,
  Frown,
  MessageSquare
} from "lucide-react";

type Patient = {
  id: string;
  name: string;
  accessToken: string | null;
};

const reasons = [
  { id: "Melhorou", label: "Já me sinto melhor / Alta", desc: "A dor diminuiu ou sumiu e considero meu tratamento concluído.", icon: <Smile className="text-emerald-500" size={20} /> },
  { id: "Financeiro", label: "Questões financeiras", desc: "Precisei pausar os atendimentos por razões de orçamento.", icon: <DollarSign className="text-blue-500" size={20} /> },
  { id: "Horarios", label: "Falta de horários", desc: "Minha agenda mudou e não tenho horários compatíveis no momento.", icon: <Calendar className="text-amber-500" size={20} /> },
  { id: "Dor", label: "Dor pós-sessão ou insatisfação", desc: "Senti incômodo após as sessões ou o resultado não atendeu minha expectativa.", icon: <Frown className="text-rose-500" size={20} /> },
  { id: "Outros", label: "Outro motivo", desc: "Viajei, precisei pausar ou tenho outro motivo pessoal.", icon: <MessageSquare className="text-indigo-500" size={20} /> }
];

export default function MotivoClient({ patient, token }: { patient: Patient; token: string }) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) {
      setError("Por favor, selecione um motivo.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const selectedLabel = reasons.find(r => r.id === selectedReason)?.label || selectedReason;
      const res = await saveReengagementFeedbackAction(token, selectedLabel, comment);
      
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.error || "Ocorreu um erro ao enviar seu feedback.");
      }
    } catch (e) {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] px-6 text-center animate-in fade-in duration-500">
        <div className="bg-emerald-50 text-emerald-600 p-5 rounded-full shadow-inner mb-6">
          <CheckCircle2 size={56} className="animate-bounce" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Obrigado pelo seu feedback!</h2>
        <p className="text-slate-500 text-sm mt-3 max-w-sm leading-relaxed">
          Suas observações foram enviadas diretamente para a nossa coordenação clínica. Elas nos ajudam a aperfeiçoar nossos tratamentos e a entender melhor a sua jornada.
        </p>
        <p className="text-slate-400 text-xs mt-8">Clínica Kinesis Fisioterapia</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto w-full px-4 pb-12 pt-6 animate-in fade-in duration-300">
      
      {/* Header Premium Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col gap-1 border border-slate-800">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full"></div>
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400 mb-1">
          <Sparkles size={14} /> Espaço de Escuta Ativa
        </div>
        <h2 className="text-xl font-black tracking-tight leading-snug">
          Oi, {patient.name.split(' ')[0]}!
        </h2>
        <p className="text-slate-300 text-xs mt-1 leading-relaxed">
          Sentimos sua falta nas últimas semanas. Para nos ajudar a te dar a melhor experiência, nos conte por que pausou os atendimentos?
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Selecione o motivo principal</label>
          
          <div className="flex flex-col gap-2.5">
            {reasons.map((r) => {
              const isSelected = selectedReason === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedReason(r.id)}
                  className={`flex gap-4 p-4 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                    isSelected
                      ? "bg-indigo-50/70 border-indigo-400 shadow-sm"
                      : "bg-white border-slate-100 shadow-sm hover:border-slate-300"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                    isSelected ? "bg-indigo-100 text-indigo-700" : "bg-slate-50"
                  }`}>
                    {r.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-slate-800">{r.label}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{r.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Text Area for Additional Comments */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Gostaria de comentar algo? (Opcional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Escreva aqui detalhes sobre o seu quadro de dor, viagem, horários livres ou sugestões..."
            className="w-full min-h-[100px] p-4 bg-white border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm text-slate-700"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <>
              <Send size={16} /> Enviar Feedback
            </>
          )}
        </button>
      </form>

      <footer className="text-center text-slate-400 text-[10px] font-semibold mt-4">
        Clínica Kinesis Fisioterapia &copy; {new Date().getFullYear()}
      </footer>

    </div>
  );
}
