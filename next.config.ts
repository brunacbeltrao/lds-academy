import type { NextConfig } from "next";

// Plataforma toda autenticada: as páginas são renderizadas por requisição,
// então Cache Components e Partial Prefetching ficam desligados nesta etapa.
const nextConfig: NextConfig = {
  // O service worker nunca fica em cache, para que uma versão nova chegue logo aos aparelhos.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
