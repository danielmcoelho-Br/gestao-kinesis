import { getPatientSession, clearPatientSession } from "../lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Home, Dumbbell, ClipboardList, LogOut } from "lucide-react";
import PushManager from "../components/PushManager";

export const dynamic = "force-dynamic";

export default async function IntegracaoProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getPatientSession();

  if (!session) {
    redirect("/acesso");
  }

  return (
    <div className="min-h-screen bg-[#FDF6F0] text-slate-800 flex flex-col" style={{ fontSize: "18px", fontFamily: "var(--font-sans), sans-serif", paddingBottom: "90px" }}>
      {/* Top Header */}
      <header className="bg-[#D8BFD8] text-slate-900 p-6 shadow-sm sticky top-0 z-10 flex justify-between items-center rounded-b-2xl">
        <div>
          <p className="text-xs text-purple-800 font-extrabold uppercase tracking-wider mb-1">Espaço da Paciente • Kinesis</p>
          <h1 className="text-xl font-bold">Olá, {session.name.split(' ')[0]}!</h1>
        </div>
        <form action={async () => {
          "use server";
          await clearPatientSession();
          redirect("/acesso");
        }}>
          <button type="submit" className="bg-white/50 p-2.5 rounded-xl text-purple-900 font-bold hover:bg-white/80 transition-colors flex items-center gap-1.5 text-sm">
            <LogOut size={18} />
            Sair
          </button>
        </form>
      </header>

      {/* Main Content Area */}
      <main className="p-5 flex-1 flex flex-col">
        <PushManager patientId={session.id} />
        {children}
      </main>

      {/* Bottom Navigation (PWA Style) */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] z-20 pb-safe">
        <ul className="flex justify-around items-center p-3 max-w-md mx-auto">
          <li className="flex-1">
            <Link href="/integracao" className="flex flex-col items-center p-2 text-slate-500 hover:text-purple-700 transition-colors">
              <Home size={26} className="mb-1" />
              <span className="text-[11px] font-bold uppercase tracking-wide">Início</span>
            </Link>
          </li>
          <li className="flex-1">
            <Link href="/integracao/exercicios" className="flex flex-col items-center p-2 text-slate-500 hover:text-purple-700 transition-colors">
              <Dumbbell size={26} className="mb-1" />
              <span className="text-[11px] font-bold uppercase tracking-wide">Exercícios</span>
            </Link>
          </li>
          <li className="flex-1">
            <Link href="/integracao/prontuario" className="flex flex-col items-center p-2 text-slate-500 hover:text-purple-700 transition-colors">
              <ClipboardList size={26} className="mb-1" />
              <span className="text-[11px] font-bold uppercase tracking-wide">Prontuário</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
