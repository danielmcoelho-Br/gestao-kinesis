import { Inter } from "next/font/google";
import "../(hub)/hub-globals.css";
import "./portal.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Portal do Paciente | Kinesis",
  description: "Seu canal direto com a Kinesis Fisioterapia",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className} style={{ margin: 0, backgroundColor: "#F8FAFC" }}>
        <div className="portal-container">
          {children}
        </div>
      </body>
    </html>
  );
}
