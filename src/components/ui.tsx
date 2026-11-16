import type { ReactNode } from "react";

export { Recolhivel } from "./recolhivel";

/** Moldura das páginas da área logada. Os blocos de primeiro nível entram em sequência. */
export function Pagina({ children, larga = false }: { children: ReactNode; larga?: boolean }) {
  return (
    <div className={`entrada mx-auto w-full px-5 pt-8 pb-16 sm:px-8 sm:pt-12 lg:px-12 ${larga ? "max-w-6xl" : "max-w-4xl"}`}>{children}</div>
  );
}

export function CabecalhoDaPagina({
  titulo,
  descricao,
  contexto,
  children,
}: {
  titulo: string;
  descricao?: string;
  /** Linha curta acima do título (ex.: o ciclo em curso). */
  contexto?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="mb-9 sm:mb-12">
      {contexto ? <p className="mb-2.5 text-sm font-medium text-grafite">{contexto}</p> : null}
      <h1 className="h1">{titulo}</h1>
      {descricao ? <p className="prosa mt-3 text-[1.0625rem] leading-relaxed text-grafite sm:text-lg">{descricao}</p> : null}
      {children}
    </header>
  );
}

export function Secao({ id, titulo, descricao, children }: { id?: string; titulo: string; descricao?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-titulo` : undefined} className="scroll-mt-24 border-t border-linha py-9 first:border-t-0 first:pt-0 sm:py-12">
      <h2 id={id ? `${id}-titulo` : undefined} className="h2">
        {titulo}
      </h2>
      {descricao ? <p className="prosa mt-2 text-grafite">{descricao}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** Lista com marcadores discretos, para regras e orientações. */
export function Lista({ itens }: { itens: ReactNode[] }) {
  return (
    <ul className="prosa flex flex-col gap-3">
      {itens.map((item, i) => (
        <li key={i} className="relative pl-6 before:absolute before:top-[0.72em] before:left-1 before:h-px before:w-2.5 before:bg-vinho">
          {item}
        </li>
      ))}
    </ul>
  );
}

/** Atalhos para as seções de uma página longa. */
export function Atalhos({ itens }: { itens: { id: string; rotulo: string }[] }) {
  return (
    <nav aria-label="Seções desta página" className="mt-6">
      <ul className="flex flex-wrap gap-2">
        {itens.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className="inline-flex min-h-9 items-center rounded-full bg-superficie px-3.5 text-sm font-medium text-tinta shadow-cartao ring-1 ring-linha transition-[background-color,box-shadow,transform] duration-150 ease-saida hover:ring-linha-forte active:scale-[0.97]"
            >
              {s.rotulo}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
