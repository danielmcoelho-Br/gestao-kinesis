"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Mic, Save, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { saveDiaryEntry, getPatientByToken } from "../../../actions";

export default function DiarioPage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const [patientName, setPatientName] = useState("");
    const [painLevel, setPainLevel] = useState<number>(0);
    const [mood, setMood] = useState<string>("");
    const [disposition, setDisposition] = useState<string>("");
    const [note, setNote] = useState<string>("");
    
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        async function fetchPatient() {
            try {
                const p = await getPatientByToken(token);
                if (p) {
                    setPatientName(p.name.split(' ')[0]);
                }
            } catch (e) {
                console.error("Erro ao carregar dados do paciente no portal:", e);
            }
        }
        fetchPatient();
    }, [token]);

    const moods = [
        { emoji: "😢", label: "Triste" },
        { emoji: "😕", label: "Desanimada" },
        { emoji: "😐", label: "Normal" },
        { emoji: "🙂", label: "Bem" },
        { emoji: "😄", label: "Excelente" },
    ];

    const dispositions = ["Cansada", "Com Preguiça", "Na Média", "Disposta", "Cheia de Energia"];

    const getPainColor = (level: number) => {
        if (level <= 2) return "bg-green-400";
        if (level <= 4) return "bg-green-500";
        if (level <= 6) return "bg-yellow-400";
        if (level <= 8) return "bg-orange-500";
        return "bg-red-600";
    };

    const handleSave = async () => {
        setSaving(true);
        
        const res = await saveDiaryEntry(token, {
            painLevel,
            mood: mood || undefined,
            disposition: disposition || undefined,
            note: note.trim() || undefined
        });

        if (res.success) {
            setSuccess(true);
        } else {
            alert(res.error || "Erro ao salvar.");
            setSaving(false);
        }
    };

    if (success) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center min-h-[90dvh] bg-white">
                <div className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-8 shadow-sm animate-in zoom-in duration-300">
                    <CheckCircle2 size={52} strokeWidth={2.5} />
                </div>
                <h1 className="font-black text-3xl text-slate-800 mb-4">Registro Salvo!</h1>
                <p className="text-slate-500 mb-10 max-w-xs text-lg leading-relaxed font-medium">
                    Suas respostas diárias foram enviadas com sucesso para o seu fisioterapeuta!
                </p>
                <button 
                    onClick={() => router.push(`/p/${token}`)} 
                    className="w-full py-5 rounded-2xl bg-slate-900 text-white font-bold text-xl shadow-lg active:scale-95 transition-transform"
                >
                    Voltar para Home
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/70 pb-10">
            
            {/* Top Header Banner */}
            <div className="bg-purple-200/70 border-b border-purple-200/80 px-6 py-6 relative shadow-sm">
                <Link href={`/p/${token}`} className="absolute left-4 top-6 text-purple-900 bg-white/40 backdrop-blur-sm p-2 rounded-full shadow-sm transition-all active:scale-90">
                    <ArrowLeft size={20} strokeWidth={3} />
                </Link>
                <div className="text-center flex flex-col items-center mt-1">
                    <span className="text-[9px] font-black tracking-widest text-purple-800 uppercase mb-1 opacity-80">Espaço do Paciente • Kinesis</span>
                    <h1 className="text-2xl font-black text-purple-900 tracking-tight">Olá, {patientName || "Paciente"}! 👋</h1>
                </div>
            </div>

            <div className="px-4 py-6 flex flex-col gap-6 flex-1 animate-in fade-in duration-300">
                
                {/* Pain Level Card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 animate-in slide-in-from-bottom-3 duration-300">
                    <h3 className="text-xl font-black text-slate-800 mb-5 tracking-tight">Nível de Dor</h3>
                    <div className="flex flex-col gap-5">
                        <div className="flex justify-between text-xs text-slate-400 font-black uppercase tracking-wider px-1">
                            <span>Sem dor</span>
                            <span>Dor Máxima</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" max="10" 
                            value={painLevel} 
                            onChange={(e) => setPainLevel(parseInt(e.target.value))}
                            className="w-full h-3 bg-slate-100 rounded-xl appearance-none cursor-pointer accent-purple-600 shadow-inner"
                        />
                        <div className="flex items-center justify-center gap-5 mt-2">
                            <span className="text-6xl font-black text-slate-800 tracking-tighter leading-none">{painLevel}</span>
                            <div className={`w-14 h-14 rounded-full transition-all duration-300 shadow-md border-4 border-white scale-105 ${getPainColor(painLevel)}`}></div>
                        </div>
                    </div>
                </div>

                {/* Mood Card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 animate-in slide-in-from-bottom-4 duration-350">
                    <h3 className="text-xl font-black text-slate-800 mb-5 tracking-tight">Humor</h3>
                    <div className="flex justify-between items-center gap-2">
                        {moods.map((m) => (
                            <button 
                                key={m.label}
                                onClick={() => setMood(m.label)}
                                type="button"
                                className={`flex flex-col items-center gap-2 py-3.5 px-1 rounded-2xl transition-all flex-1 border-2
                                    ${mood === m.label ? 'bg-[#D8BFD8]/30 border-purple-400 scale-110 shadow-md' : 'bg-white border-transparent opacity-70 hover:opacity-100'}
                                `}
                            >
                                <span className="text-4xl">{m.emoji}</span>
                                <span className={`text-[10px] font-black uppercase tracking-tight leading-none mt-1 ${mood === m.label ? 'text-purple-900' : 'text-slate-400'}`}>{m.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Disposition Card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 animate-in slide-in-from-bottom-5 duration-400">
                    <h3 className="text-xl font-black text-slate-800 mb-5 tracking-tight">Disposição Física</h3>
                    <div className="flex flex-wrap gap-2.5">
                        {dispositions.map((disp) => (
                            <button
                                key={disp}
                                onClick={() => setDisposition(disp)}
                                type="button"
                                className={`px-5 py-4 rounded-2xl text-sm font-extrabold transition-all flex-grow border-2
                                    ${disposition === disp ? 'bg-[#AFEEEE]/40 text-teal-950 shadow-md border-teal-400 scale-[1.02]' : 'bg-slate-50/70 text-slate-500 border-transparent hover:bg-slate-100'}
                                `}
                            >
                                {disp}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Notes Card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 animate-in slide-in-from-bottom-6 duration-450">
                    <h3 className="text-xl font-black text-slate-800 mb-4 tracking-tight">Anotações Adicionais</h3>
                    <textarea 
                        rows={4}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Escreva como foi o seu dia, onde sentiu dor ou algo relevante para compartilhar..."
                        className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl p-4 text-base text-slate-800 focus:outline-none focus:ring-4 focus:ring-purple-400/20 focus:border-purple-400 resize-none mb-4 placeholder-slate-400"
                    ></textarea>

                    <button 
                        type="button"
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold text-sm transition-all border border-slate-200 active:scale-95"
                        onClick={() => alert("Simulação: O gravador de voz está disponível nativamente no aplicativo.")}
                    >
                        <Mic size={18} className="text-rose-500" />
                        Gravar Nota de Voz
                    </button>
                </div>

                {/* Bottom Action Save Button */}
                <div className="mt-2 sticky bottom-4 bg-slate-50/80 backdrop-blur-sm py-2 rounded-3xl">
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-white font-black text-xl py-6 rounded-2xl shadow-xl active:scale-[0.98] transition-all"
                    >
                        {saving ? (
                            <Loader2 size={28} className="animate-spin" />
                        ) : (
                            <>
                                <Save size={24} />
                                Salvar Registro
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
