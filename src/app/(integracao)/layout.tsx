import type { Metadata } from "next";
import "../(hub)/hub-globals.css";

export const metadata: Metadata = {
  title: "Integração - Kinesis",
  description: "Acompanhamento contínuo da jornada do paciente",
};

export default function IntegracaoRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
