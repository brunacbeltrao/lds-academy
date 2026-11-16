import type { ReactNode } from "react";
import { CabecalhoDaPagina, Pagina } from "@/components/ui";

export type Bloco = { titulo: string; descricao: string };

type Props = { titulo: string; descricao: string; blocos: Bloco[]; children?: ReactNode };

/** Página de uma área: cabeçalho, o conteúdo já pronto e, discretamente, o que ainda vem. */
export function PaginaArea({ titulo, descricao, blocos, children }: Props) {
  return (
    <Pagina>
      <CabecalhoDaPagina titulo={titulo} descricao={descricao} />
      {children}
      {blocos.length > 0 ? (
        <section aria-labelledby="em-breve" className={children ? "mt-12" : undefined}>
          <h2 id="em-breve" className="text-sm font-semibold text-grafite">
            Em breve nesta área
          </h2>
          <ul className="mt-3 border-t border-linha">
            {blocos.map((bloco) => (
              <li key={bloco.titulo} className="grid gap-x-6 gap-y-0.5 border-b border-linha py-3.5 sm:grid-cols-[15rem_1fr]">
                <p className="font-medium text-tinta">{bloco.titulo}</p>
                <p className="text-grafite">{bloco.descricao}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </Pagina>
  );
}
