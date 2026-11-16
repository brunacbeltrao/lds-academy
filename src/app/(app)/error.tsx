"use client";

import { Pagina } from "@/components/ui";

export default function Erro({ reset }: { error: Error; reset: () => void }) {
  return (
    <Pagina>
      <h1 className="h1">Não foi possível carregar esta página</h1>
      <p className="mt-3 text-lg text-grafite">Tente de novo. Se o erro continuar, avise a diretoria.</p>
      <button type="button" onClick={reset} className="botao mt-8">
        Tentar de novo
      </button>
    </Pagina>
  );
}
