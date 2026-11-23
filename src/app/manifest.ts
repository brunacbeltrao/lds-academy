import type { MetadataRoute } from "next";

/** Instalação como app (Android e computador). No iPhone vale o apple-icon. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "LDS Academy",
    short_name: "LDS Academy",
    description: "Plataforma interna da Liga de Direito Societário e Mercado de Capitais (LDS·FDR).",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ebece0",
    theme_color: "#a7002e",
    lang: "pt-BR",
    categories: ["education"],
    icons: [
      { src: "/icones/app-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icones/app-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Versão com margem para os formatos de ícone do Android (círculo, gota etc.).
      { src: "/icones/app-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Atalhos ao segurar o ícone, no Android e no computador.
    shortcuts: [
      { name: "Ciclos e aulas", url: "/ciclos" },
      { name: "Calendário", url: "/calendario" },
      { name: "Oportunidades", url: "/oportunidades" },
    ],
  };
}
