import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { PeriodProvider } from "@/context/PeriodContext";
import { Sidebar } from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gestão Kinesis",
  description: "Sistema automatizado de gestão de clínica de fisioterapia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <PeriodProvider>
          <div className="layout-container">
            <Sidebar />
            <main className="main-content">
              {children}
            </main>
          </div>
        </PeriodProvider>
      </body>
    </html>
  );
}
