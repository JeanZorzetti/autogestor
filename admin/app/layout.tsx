import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Autogestor Admin",
  description: "Painel de leads da Autogestor.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
