import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../(lab)/globals.css"; // KinesisLab theme for login page

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Central Kinesis - Login",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className} style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
