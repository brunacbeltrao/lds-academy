"use client";

import { useEffect } from "react";

/**
 * Registra o service worker (public/sw.js), que mostra a página "sem conexão" quando a rede cai.
 * Só em produção: no desenvolvimento ele atrapalharia o recarregamento das páginas.
 */
export function RegistroDoApp() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // Sem service worker a plataforma funciona normalmente; só perde a página offline.
    });
  }, []);
  return null;
}
