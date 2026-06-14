import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/(gestao)/globals.css";
import { PeriodProvider } from "@/gestao/context/PeriodContext";
import MarketingHeader from "./MarketingHeader";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kinesis Marketing IA",
  description: "Central de Inteligência Artificial de Marketing da Clínica Kinesis",
};

export const dynamic = "force-dynamic";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <PeriodProvider>
          <div className="min-h-screen bg-slate-50 flex flex-col">
            <MarketingHeader />
            <main className="flex-1 w-full max-w-7xl mx-auto p-6">
              {children}
            </main>
          </div>
          <Toaster position="top-right" richColors closeButton />
        </PeriodProvider>
      </body>
    </html>
  );
}
