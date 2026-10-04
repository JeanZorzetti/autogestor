import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

// A display da home do hub (Costura): Archivo variável com o eixo de largura,
// para número, título e cabeçalho de coluna em toda rota.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--fonte-display", display: "swap" });

export const metadata: Metadata = {
  title: "Autogestor Admin",
  description: "Painel de leads da Autogestor.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={archivo.variable}>
      <body>{children}</body>
    </html>
  );
}
