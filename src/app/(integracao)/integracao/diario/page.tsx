"use client";

import { useState } from "react";
import { Mic, Save, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { saveDiaryLog } from "./actions";

export default function IntegracaoDiario() {
  const [painLevel, setPainLevel] = useState<number>(0);
  const [mood, setMood] = useState<string>("");
  const [disposition, setDisposition] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const moods = [
    { emoji: "😢", label: "Triste" },
    { emoji: "😕", label: "Desanimada" },
    { emoji: "😐", label: "Normal" },
    { emoji: "🙂", label: "Bem" },
    { emoji: "😄", label: "Excelente" },
  ];

  const dispositions = ["Cansada", "Com Preguiça", "Na Média", "Disposta", "Cheia de Energia"];

  const handleSave = async () => {
    setLoading(true);
    
    const result = await saveDiaryLog({
      painLevel,
      mood,
      disposition,
      note,
    });

    if (result.success) {
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setPainLevel(0);
        setMood("");
        setDisposition("");
        setNote("");
      }, 3000);
    } else {
      alert(result.error || "Ocorreu um erro ao salvar.");
    }
    setLoading(false);
  };

  const getPainColor = (level: number) => {
    if (level <= 2) return "bg-green-400";
    if (level <= 4) return "bg-green-500";
    if (level <= 6) return "bg-yellow-400";
    if (level <= 8) return "bg-orange-500";
    return "bg-red-600";
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="text-center mb-4">
        <h2 className="text-3xl font-bold text-slate-800">Diário de Saúde</h2>
        <p className="text-slate-500 mt-2">Registre como você está se sentindo hoje.</p>
      </div>

      {saved && (
        <div className="bg-green-100 border border-green-200 text-green-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm transition-all">
          <CheckCircle2 size={28} className="text-green-600 shrink-0" />
          <p className="font-medium text-lg">Diário salvo com sucesso! Acompanhe na sua jornada.</p>
        </div>
      )}

      {/* Pain Level */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold text-slate-800 mb-6">Nível de Dor</h3>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between text-slate-500 font-medium px-2">
            <span>Sem dor</span>
            <span>Dor Máxima</span>
          </div>
          <input 
            type="range" 
            min="0" max="10" 
            value={painLevel} 
            onChange={(e) => setPainLevel(parseInt(e.target.value))}
            className="w-full h-4 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
          <div className="flex items-center justify-center gap-4 mt-2">
            <span className="text-5xl font-black text-slate-800">{painLevel}</span>
            <div className={`w-12 h-12 rounded-full transition-colors duration-300 shadow-inner ${getPainColor(painLevel)}`}></div>
          </div>
        </div>
      </div>

      {/* Mood */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold text-slate-800 mb-6">Humor</h3>
        <div className="flex justify-between items-center gap-2">
          {moods.map((m) => (
            <button 
              key={m.label}
              onClick={() => setMood(m.label)}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all flex-1
                ${mood === m.label ? 'bg-[#D8BFD8] scale-110 shadow-md' : 'hover:bg-slate-50 opacity-70 hover:opacity-100'}
              `}
            >
              <span className="text-4xl md:text-5xl">{m.emoji}</span>
              <span className={`text-xs md:text-sm font-medium ${mood === m.label ? 'text-slate-900' : 'text-slate-500'}`}>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Disposition */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold text-slate-800 mb-6">Disposição Física</h3>
        <div className="flex flex-wrap gap-3">
          {dispositions.map((disp) => (
            <button
              key={disp}
              onClick={() => setDisposition(disp)}
              className={`px-6 py-4 rounded-xl text-lg font-medium transition-all flex-grow
                ${disposition === disp ? 'bg-[#AFEEEE] text-slate-900 shadow-md border-2 border-teal-400' : 'bg-slate-50 text-slate-600 border-2 border-transparent hover:bg-slate-100'}
              `}
            >
              {disp}
            </button>
          ))}
        </div>
      </div>

      {/* Notes & Voice */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Anotações Adicionais</h3>
        <textarea 
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Escreva aqui como foi o seu dia ou algo que queira compartilhar..."
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none mb-6"
        ></textarea>

        <button 
          type="button"
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg transition-colors"
          onClick={() => alert("Simulação: Gravando nota de voz...")}
        >
          <Mic size={24} className="text-red-500" />
          Gravar Nota de Voz
        </button>
      </div>

      {/* Save Button */}
      <button 
        onClick={handleSave}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-white font-bold text-2xl py-6 rounded-3xl shadow-lg transition-transform active:scale-95 mt-4"
      >
        {loading ? (
          "Salvando..."
        ) : (
          <>
            <Save size={28} />
            Salvar Registro
          </>
        )}
      </button>

    </div>
  );
}
