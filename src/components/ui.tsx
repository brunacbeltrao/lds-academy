import type { ReactNode } from "react";

/** Moldura das páginas da área logada. */
export function Pagina({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 sm:py-12">{children}</div>;
}

export function CabecalhoDaPagina({ titulo, descricao, children }: { titulo: string; descricao?: string; children?: ReactNode }) {
  return (
    <header className="mb-8 sm:mb-10">
      <h1 className="h1">{titulo}</h1>
      {descricao ? <p className="prosa mt-3 text-lg text-grafite">{descricao}</p> : null}
      {children}
    </header>
  );
}

export function Secao({ id, titulo, descricao, children }: { id?: string; titulo: string; descricao?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-titulo` : undefined} className="scroll-mt-24 border-t border-linha py-8 first:border-t-0 first:pt-0 sm:py-10">
      <h2 id={id ? `${id}-titulo` : undefined} className="h2">
        {titulo}
      </h2>
      {descricao ? <p className="prosa mt-2 text-grafite">{descricao}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** Lista com marcadores discretos, para regras e orientações. */
export function Lista({ itens }: { itens: ReactNode[] }) {
  return (
    <ul className="prosa flex flex-col gap-2.5">
      {itens.map((item, i) => (
        <li key={i} className="relative pl-5 before:absolute before:top-[0.65em] before:left-0.5 before:size-1.5 before:rounded-full before:bg-vinho/50">
          {item}
        </li>
      ))}
    </ul>
  );
}

/** Atalhos para as seções de uma página longa. */
export function Atalhos({ itens }: { itens: { id: string; rotulo: string }[] }) {
  return (
    <nav aria-label="Seções desta página" className="mt-5">
      <ul className="flex flex-wrap gap-2">
        {itens.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className="inline-flex min-h-9 items-center rounded-full border border-linha bg-superficie px-3.5 text-sm font-medium text-tinta transition-colors hover:border-linha-forte hover:bg-sutil"
            >
              {s.rotulo}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Conteúdo que abre e fecha (orientações longas). */
export function Recolhivel({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <details className="cartao group">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 rounded-[0.875rem] px-4 py-3 font-semibold text-tinta transition-colors hover:bg-sutil sm:px-5 [&::-webkit-details-marker]:hidden">
        {titulo}
        <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5 shrink-0 text-grafite transition-transform duration-200 ease-saida group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </summary>
      <div className="border-t border-linha px-4 py-5 sm:px-5">{children}</div>
    </details>
  );
}
