import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../(gestao)/globals.css";
import { AdminHeader } from "./admin-header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Administração Kinesis",
  description: "Painel administrativo de controle de usuários e comissões",
};

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className} style={{ backgroundColor: "#f8fafc" }}>
        <AdminHeader />
        <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
