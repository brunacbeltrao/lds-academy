import type { MetadataRoute } from "next";

/** Instalação como app (Android e computador). No iPhone vale o apple-icon. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LDS Academy",
    short_name: "LDS Academy",
    description: "Plataforma interna da Liga de Direito Societário e Mercado de Capitais (LDS·FDR).",
    start_url: "/",
    display: "standalone",
    background_color: "#ebece0",
    theme_color: "#a7002e",
    lang: "pt-BR",
    icons: [
      { src: "/icones/app-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icones/app-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
