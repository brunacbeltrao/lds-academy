import type { ReactNode } from "react";
import { CabecalhoDaPagina, Pagina } from "@/components/ui";

export type Bloco = { titulo: string; descricao: string };

type Props = { titulo: string; descricao: string; contexto?: ReactNode; blocos: Bloco[]; children?: ReactNode };

/**
 * Página de uma área: cabeçalho, o conteúdo já pronto e, discretamente, o que ainda vem.
 * O "em breve" fica num contorno tracejado: é a planta do que vai ser construído, não um cartão.
 */
export function PaginaArea({ titulo, descricao, contexto, blocos, children }: Props) {
  return (
    <Pagina>
      <CabecalhoDaPagina titulo={titulo} descricao={descricao} contexto={contexto} />
      {children}
      {blocos.length > 0 ? (
        <section
          aria-labelledby="em-breve"
          className={`rounded-2xl border border-dashed border-linha-forte px-5 pt-5 pb-2 sm:px-6 sm:pt-6 ${children ? "mt-12" : ""}`}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="em-breve" className="text-[0.9375rem] font-semibold text-tinta">
              Em breve nesta área
            </h2>
            <p className="text-sm text-grafite">
              {blocos.length} {blocos.length === 1 ? "recurso em construção" : "recursos em construção"}
            </p>
          </div>
          <ul className="mt-3">
            {blocos.map((bloco) => (
              <li
                key={bloco.titulo}
                className="grid gap-x-6 gap-y-0.5 border-t border-linha py-3.5 first:border-t-0 sm:grid-cols-[14rem_1fr]"
              >
                <p className="font-medium text-tinta">{bloco.titulo}</p>
                <p className="text-[0.9375rem] text-grafite">{bloco.descricao}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </Pagina>
  );
}
