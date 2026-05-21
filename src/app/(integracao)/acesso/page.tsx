"use client";

import { useState } from "react";
import { Activity, ShieldCheck, ArrowRight } from "lucide-react";
import { loginPatient } from "./actions";

export default function PatientLogin() {
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    
    // Mask: 000.000.000-00
    if (value.length > 9) {
      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else if (value.length > 6) {
      value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
    } else if (value.length > 3) {
      value = value.replace(/(\d{3})(\d{1,3})/, "$1.$2");
    }
    setCpf(value);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 8) value = value.slice(0, 8);
    
    // Mask: DD/MM/YYYY
    if (value.length > 4) {
      value = value.replace(/(\d{2})(\d{2})(\d{1,4})/, "$1/$2/$3");
    } else if (value.length > 2) {
      value = value.replace(/(\d{2})(\d{1,2})/, "$1/$2");
    }
    setBirthDate(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("cpf", cpf);
    formData.append("birthDate", birthDate);

    const result = await loginPatient(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      // Success! Redirect to home
      window.location.href = "/integracao";
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("cpf", "000.000.000-00");
    formData.append("birthDate", "01/01/2000");

    const result = await loginPatient(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      window.location.href = "/integracao";
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF6F0] text-slate-800 flex flex-col items-center justify-center p-6" style={{ fontFamily: "var(--font-sans), sans-serif" }}>
      
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#D8BFD8] p-8 text-center relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-bl-full"></div>
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Activity size={40} className="text-purple-700" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Portal da Paciente</h1>
          <p className="text-slate-700 font-medium">Acesse seu diário de saúde e jornada de recuperação.</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3 mb-8">
            <ShieldCheck size={24} className="text-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800 font-medium">
              Para sua segurança, o acesso é feito apenas com o seu CPF e Data de Nascimento cadastrados na clínica.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <label htmlFor="cpf" className="block text-lg font-bold text-slate-700 mb-2">Seu CPF</label>
              <input 
                id="cpf"
                type="text" 
                value={cpf}
                onChange={handleCpfChange}
                placeholder="000.000.000-00"
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-xl text-center font-bold text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-colors tracking-wider"
                required
              />
            </div>

            <div>
              <label htmlFor="birthDate" className="block text-lg font-bold text-slate-700 mb-2">Data de Nascimento</label>
              <input 
                id="birthDate"
                type="text" 
                value={birthDate}
                onChange={handleDateChange}
                placeholder="DD/MM/AAAA"
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-xl text-center font-bold text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-colors tracking-wider"
                required
              />
            </div>

            {error && (
              <div className="text-red-600 bg-red-50 p-4 rounded-xl text-center font-medium border border-red-100">
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="mt-4 w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold text-xl py-5 rounded-2xl shadow-lg transition-transform active:scale-[0.98]"
            >
              {loading ? (
                "Verificando..."
              ) : (
                <>
                  Acessar meu Diário
                  <ArrowRight size={24} />
                </>
              )}
            </button>

            <button 
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="mt-2 w-full flex items-center justify-center gap-3 bg-purple-50 border-2 border-purple-500 text-purple-700 hover:bg-purple-100 disabled:opacity-50 font-bold text-lg py-4 rounded-2xl transition-all active:scale-[0.98]"
            >
              ⚡ Entrar como Demonstração
            </button>
            
            <p className="text-center text-sm text-slate-400 mt-3">
              Selecione o botão acima para acessar instantaneamente como paciente de teste.
            </p>
          </form>
        </div>
      </div>

    </div>
  );
}
