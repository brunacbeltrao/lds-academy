import type { NextConfig } from "next";

// Plataforma toda autenticada: as páginas são renderizadas por requisição,
// então Cache Components e Partial Prefetching ficam desligados nesta etapa.
const nextConfig: NextConfig = {
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
