"use client";

import { Printer } from "lucide-react";

/** Abre a impressão do navegador (dá para salvar em PDF). O menu some na impressão. */
export function BotaoImprimir() {
  return (
    <button type="button" onClick={() => window.print()} className="botao botao-secundario">
      <Printer aria-hidden="true" className="size-4" strokeWidth={1.75} />
      Imprimir ou salvar em PDF
    </button>
  );
}
