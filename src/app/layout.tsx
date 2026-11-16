import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { RegistroDoApp } from "@/components/registro-do-app";
import "./globals.css";

const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "LDS Academy", template: "%s · LDS Academy" },
  description: "Plataforma interna da Liga de Direito Societário e Mercado de Capitais (LDS·FDR).",
  robots: { index: false, follow: false },
  // Adicionado à tela de início do iPhone, abre como app, com o nome curto da plataforma.
  appleWebApp: { capable: true, title: "LDS Academy", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#ebece0" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${figtree.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <RegistroDoApp />
      </body>
    </html>
  );
}
