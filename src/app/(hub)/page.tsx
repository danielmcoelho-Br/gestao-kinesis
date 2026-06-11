import { getSession } from "@/gestao/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Activity, LayoutDashboard, LogOut, Shield, Megaphone } from "lucide-react";

export default async function HubPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Se for fisioterapeuta, vai direto para o KinesisLab (Módulo Clínico)
  if (String(session.role || '').toUpperCase() === "FISIOTERAPEUTA") {
    redirect("/dashboard");
  }

  const isAdmin = ['ADMIN', 'ADMINISTRADOR', 'ADMINISTRATOR'].includes(String(session.role || '').toUpperCase());

  // Admins e Secretárias veem a tela de Hub
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6" style={{ fontFamily: "var(--font-sans), sans-serif" }}>
      <div className="max-w-5xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 text-center bg-slate-900 text-white relative">
          <h1 className="text-3xl font-bold mb-2">Central Kinesis</h1>
          <p className="text-slate-300">Selecione o módulo de trabalho</p>
          
          <form action="/api/auth/logout" method="POST" className="absolute top-6 right-6">
            <button type="submit" className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
              <LogOut size={18} />
              <span className="text-sm font-medium">Sair</span>
            </button>
          </form>
        </div>
        
        <div className={`p-10 grid grid-cols-1 ${isAdmin ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2'} gap-6 max-w-6xl mx-auto`}>
          {/* Card Módulo Clínico (KinesisLab) */}
          <Link href="/dashboard" className="group block h-full">
            <div className="border-2 border-slate-100 rounded-xl p-8 h-full flex flex-col items-center justify-center transition-all duration-300 hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 bg-white cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
                <Activity size={40} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3">Módulo Clínico</h2>
              <p className="text-slate-500 text-center leading-relaxed">
                Avaliações, prontuários, testes de sensibilidade e evolução dos pacientes.
              </p>
            </div>
          </Link>

          {/* Card Módulo Gestão */}
          <Link href="/gestao" className="group block h-full">
            <div className="border-2 border-slate-100 rounded-xl p-8 h-full flex flex-col items-center justify-center transition-all duration-300 hover:border-red-600 hover:shadow-lg hover:-translate-y-1 bg-white cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6 group-hover:bg-red-100 transition-colors">
                <LayoutDashboard size={40} className="text-red-700" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3">Módulo Gestão</h2>
              <p className="text-slate-500 text-center leading-relaxed">
                Painel financeiro, faturamento, gestão de profissionais e relatórios de métricas.
              </p>
            </div>
          </Link>

          {/* Card Módulo Administrativo */}
          {isAdmin && (
            <Link href="/admin" className="group block h-full">
              <div className="border-2 border-slate-100 rounded-xl p-8 h-full flex flex-col items-center justify-center transition-all duration-300 hover:border-violet-600 hover:shadow-lg hover:-translate-y-1 bg-white cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-violet-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                <div className="w-20 h-20 rounded-full bg-violet-50 flex items-center justify-center mb-6 group-hover:bg-violet-100 transition-colors">
                  <Shield size={40} className="text-violet-700" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-3">Módulo Adm</h2>
                <p className="text-slate-500 text-center leading-relaxed">
                  Gerenciamento de usuários, controle de permissões de acesso e comissões dos profissionais.
                </p>
              </div>
            </Link>
          )}

          {/* Card Módulo Marketing (Marketing IA) */}
          {isAdmin && (
            <Link href="/marketing" className="group block h-full">
              <div className="border-2 border-slate-100 rounded-xl p-8 h-full flex flex-col items-center justify-center transition-all duration-300 hover:border-pink-500 hover:shadow-lg hover:-translate-y-1 bg-white cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-pink-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                <div className="w-20 h-20 rounded-full bg-pink-50 flex items-center justify-center mb-6 group-hover:bg-pink-100 transition-colors">
                  <Megaphone size={40} className="text-pink-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-3">Marketing IA</h2>
                <p className="text-slate-500 text-center leading-relaxed">
                  Planejamento semanal de posts, redação com inteligência artificial e prompts para redes sociais.
                </p>
              </div>
            </Link>
          )}
        </div>
        
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
          <p className="text-xs text-slate-400">
            Logado como <strong className="text-slate-600">{session.name}</strong> ({session.role})
          </p>
        </div>
      </div>
    </div>
  );
}
