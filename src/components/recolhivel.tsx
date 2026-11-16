"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Conteúdo que abre e fecha (orientações longas). A altura anima por grid-template-rows,
 * de 0fr a 1fr (receita "accordion"), e o conteúdo fechado fica fora do foco (inert).
 */
export function Recolhivel({ titulo, children, abertoInicial = false }: { titulo: string; children: ReactNode; abertoInicial?: boolean }) {
  const [aberto, setAberto] = useState(abertoInicial);
  const id = useId();

  return (
    <div className="cartao">
      <h3>
        <button
          type="button"
          aria-expanded={aberto}
          aria-controls={id}
          onClick={() => setAberto((v) => !v)}
          className="group flex min-h-13 w-full items-center justify-between gap-4 rounded-[0.875rem] px-4 py-3 text-left font-semibold text-tinta transition-colors duration-150 hover:bg-sutil sm:px-5"
        >
          {titulo}
          <span
            aria-hidden="true"
            className={`flex size-7 shrink-0 items-center justify-center rounded-full text-grafite transition-[rotate,background-color,color] duration-300 ease-saida group-hover:text-tinta ${
              aberto ? "rotate-180 bg-sutil" : ""
            }`}
          >
            <ChevronDown className="size-[1.125rem]" strokeWidth={1.75} />
          </span>
        </button>
      </h3>
      <div
        id={id}
        inert={!aberto}
        className={`grid transition-[grid-template-rows] duration-300 ease-saida ${aberto ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div
            className={`border-t border-linha px-4 py-5 transition-[opacity,translate] duration-300 ease-saida sm:px-5 ${
              aberto ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
            }`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
