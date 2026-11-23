import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, ChevronRight } from "lucide-react";

export { Recolhivel } from "./recolhivel";

/** Moldura das páginas da área logada. */
export function Pagina({ children, larga = false }: { children: ReactNode; larga?: boolean }) {
  return (
    <div className={`entrada mx-auto w-full px-5 pt-7 pb-16 sm:px-8 sm:pt-10 lg:px-10 ${larga ? "max-w-6xl" : "max-w-4xl"}`}>
      {children}
    </div>
  );
}

/** Título da página, descrição curta e, à direita, ações (no celular, abaixo). */
export function CabecalhoDaPagina({
  titulo,
  descricao,
  contexto,
  acoes,
  children,
}: {
  titulo: string;
  descricao?: string;
  contexto?: ReactNode;
  acoes?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="mb-7 sm:mb-9">
      {contexto ? <div className="mb-2 text-sm font-medium text-grafite">{contexto}</div> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="h1">{titulo}</h1>
          {descricao ? <p className="prosa mt-2 text-[1.0625rem] text-grafite">{descricao}</p> : null}
        </div>
        {acoes ? <div className="flex shrink-0 flex-wrap gap-2">{acoes}</div> : null}
      </div>
      {children}
    </header>
  );
}

export type Aba = { id: string; rotulo: string; contagem?: number };

/**
 * Abas de uma página. Cada aba é um endereço (?aba=...), então funciona com o botão voltar,
 * pode ser compartilhada e não depende de JavaScript.
 */
export function Abas({ base, atual, itens, extra }: { base: string; atual: string; itens: Aba[]; extra?: Record<string, string> }) {
  return (
    <nav aria-label="Seções desta página" className="-mx-5 mb-7 border-b border-linha px-5 sm:mx-0 sm:px-0">
      <ul className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {itens.map((aba, i) => {
          const ativo = aba.id === atual;
          const params = new URLSearchParams(extra);
          if (i > 0) params.set("aba", aba.id);
          const href = params.size ? `${base}?${params}` : base;
          return (
            <li key={aba.id} className="shrink-0">
              <Link
                href={href}
                scroll={false}
                aria-current={ativo ? "page" : undefined}
                className={`relative flex min-h-11 items-center gap-2 px-3 text-[0.9375rem] font-medium whitespace-nowrap transition-colors duration-150 after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:transition-colors ${
                  ativo ? "text-tinta after:bg-vinho" : "text-grafite after:bg-transparent hover:text-tinta"
                }`}
              >
                {aba.rotulo}
                {aba.contagem !== undefined ? (
                  <span className={`numeral rounded-full px-1.5 text-xs font-semibold ${ativo ? "bg-vinho-suave text-vinho" : "bg-sutil text-grafite"}`}>
                    {aba.contagem}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Lê a aba pedida na URL, aceitando só as que existem. */
export function abaAtual(valor: string | string[] | undefined, itens: Aba[]): string {
  const pedido = typeof valor === "string" ? valor : undefined;
  return itens.some((a) => a.id === pedido) ? (pedido as string) : itens[0].id;
}

/** Cartões lado a lado. */
export function Grade({ children, colunas = 3 }: { children: ReactNode; colunas?: 2 | 3 | 4 }) {
  // No celular, uma coluna com minmax(0, 1fr): sem isso, um texto cortado com reticências
  // estica a coluna até o tamanho da frase inteira e a página passa da largura da tela.
  const cols = { 2: "grid-cols-1 sm:grid-cols-2", 3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", 4: "grid-cols-2 lg:grid-cols-4" }[colunas];
  return <div className={`grid gap-3 ${cols}`}>{children}</div>;
}

/** Cartão. Com href, o cartão inteiro é o link. */
export function Cartao({
  href,
  externo = false,
  children,
  className = "",
  destaque = false,
}: {
  href?: string;
  externo?: boolean;
  children: ReactNode;
  className?: string;
  destaque?: boolean;
}) {
  const base = `cartao flex flex-col p-4 sm:p-5 ${destaque ? "border-vinho-borda bg-vinho-suave" : ""} ${className}`;
  if (!href) return <div className={base}>{children}</div>;
  if (externo) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={`group cartao-link ${base}`}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={`group cartao-link ${base}`}>
      {children}
    </Link>
  );
}

/** Rodapé de um cartão clicável: diz para onde o clique leva. */
export function DestinoDoCartao({ rotulo, externo = false }: { rotulo: string; externo?: boolean }) {
  const Icone = externo ? ArrowUpRight : ChevronRight;
  return (
    <span className="mt-auto flex items-center gap-1 pt-4 text-sm font-semibold text-vinho">
      {rotulo}
      <Icone aria-hidden="true" className="seta size-4" strokeWidth={2} />
    </span>
  );
}

/** Estado vazio: diz o que falta e, quando houver, o que fazer. */
export function Vazio({ titulo, texto, children }: { titulo: string; texto?: string; children?: ReactNode }) {
  return (
    <div className="rounded-[0.875rem] border border-dashed border-linha-forte px-5 py-8 text-center sm:py-10">
      <p className="font-semibold text-tinta">{titulo}</p>
      {texto ? <p className="mx-auto mt-1 max-w-md text-[0.9375rem] text-grafite">{texto}</p> : null}
      {children ? <div className="mt-4 flex justify-center">{children}</div> : null}
    </div>
  );
}

/** Número em destaque com rótulo (frequência, contagens). */
export function Numero({ valor, rotulo, detalhe, alerta = false }: { valor: ReactNode; rotulo: string; detalhe?: string; alerta?: boolean }) {
  return (
    <div className="cartao p-4 sm:p-5">
      <p className="text-sm font-medium text-grafite">{rotulo}</p>
      <p className={`numeral mt-1 text-[2rem] leading-none font-bold tracking-[-0.03em] ${alerta ? "text-vinho" : "text-tinta"}`}>{valor}</p>
      {detalhe ? <p className="mt-2 text-sm text-grafite">{detalhe}</p> : null}
    </div>
  );
}

export function Secao({
  id,
  titulo,
  descricao,
  acao,
  children,
}: {
  id?: string;
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-titulo` : undefined} className="scroll-mt-24 border-t border-linha py-8 first:border-t-0 first:pt-0 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <h2 id={id ? `${id}-titulo` : undefined} className="h2">
            {titulo}
          </h2>
          {descricao ? <p className="prosa mt-1.5 text-grafite">{descricao}</p> : null}
        </div>
        {acao}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** Bloco de painel (Início, Trajetória): título pequeno, link opcional e conteúdo. */
export function Painel({
  titulo,
  link,
  children,
  className = "",
}: {
  titulo: string;
  link?: { href: string; rotulo: string };
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`cartao flex flex-col p-4 sm:p-5 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[0.9375rem] font-semibold text-tinta">{titulo}</h2>
        {link ? (
          <Link href={link.href} className="group inline-flex items-center gap-0.5 text-sm font-medium text-grafite hover:text-vinho">
            {link.rotulo}
            <ChevronRight aria-hidden="true" className="seta size-4" />
          </Link>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
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

/** Iniciais de um nome, para avatares. */
export function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}

/** Nome curto (primeiro e último), para listas. */
export function nomeCurto(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return partes.length > 2 ? `${partes[0]} ${partes[partes.length - 1]}` : nome;
}

/** Foto de perfil ou, sem foto, as iniciais. */
export function Avatar({ nome, foto, tamanho = "md" }: { nome: string; foto?: string | null; tamanho?: "sm" | "md" | "lg" }) {
  const medida = { sm: "size-7 text-[0.6875rem]", md: "size-9 text-[0.8125rem]", lg: "size-24 text-2xl" }[tamanho];
  if (foto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- link temporário do Storage, já no tamanho certo
      <img src={foto} alt="" aria-hidden="true" className={`${medida} shrink-0 rounded-full object-cover ring-1 ring-linha`} />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-vinho-suave font-bold text-vinho ring-1 ring-vinho-borda ${medida}`}
    >
      {iniciais(nome)}
    </span>
  );
}
