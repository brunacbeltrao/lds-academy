"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  CalendarDays,
  FileCheck,
  GraduationCap,
  House,
  Landmark,
  Library,
  LogOut,
  Menu as IconeMenu,
  MessagesSquare,
  PanelLeftClose,
  PanelLeftOpen,
  PenLine,
  Settings,
  TrendingUp,
  Trophy,
  X,
  type LucideIcon,
} from "lucide-react";
import type { ItemMenu } from "@/lib/navegacao";
import { Avatar } from "@/components/ui";

type Papel = "ligante" | "diretoria" | "conselheiro";
const ROTULO_PAPEL: Record<Papel, string> = { ligante: "Ligante", diretoria: "Diretoria", conselheiro: "Conselho" };

const ICONES: Record<string, LucideIcon> = {
  "/": House,
  "/calendario": CalendarDays,
  "/ciclos": GraduationCap,
  "/biblioteca": Library,
  "/competicoes": Trophy,
  "/producao": PenLine,
  "/tira-duvidas": MessagesSquare,
  "/trajetoria": TrendingUp,
  "/a-liga": Landmark,
  "/regularizacao": FileCheck,
  "/gestao": Settings,
};

function ativo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}


type Props = { itens: ItemMenu[]; nome: string; papel: Papel; foto: string | null; recolhidoInicial: boolean; children: ReactNode };

/** Moldura da área logada: o menu lateral (recolhível no computador, gaveta no celular) e o conteúdo. */
export function Estrutura({ itens, nome, papel, foto, recolhidoInicial, children }: Props) {
  const [recolhido, setRecolhido] = useState(recolhidoInicial);

  const alternar = useCallback(() => {
    setRecolhido((atual) => {
      const novo = !atual;
      document.cookie = `lds-menu=${novo ? "recolhido" : "aberto"}; path=/; max-age=31536000; samesite=lax`;
      return novo;
    });
  }, []);

  return (
    <>
      <Menu itens={itens} nome={nome} papel={papel} foto={foto} recolhido={recolhido} alternar={alternar} />
      <main
        id="conteudo"
        className={`min-h-screen transition-[padding] duration-300 ease-entra-sai ${recolhido ? "lg:pl-(--menu-recolhido)" : "lg:pl-(--menu-largura)"}`}
      >
        {children}
      </main>
    </>
  );
}

function Menu({
  itens,
  nome,
  papel,
  foto,
  recolhido,
  alternar,
}: {
  itens: ItemMenu[];
  nome: string;
  papel: Papel;
  foto: string | null;
  recolhido: boolean;
  alternar: () => void;
}) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);

  // A gaveta do celular fecha ao escolher um item e com a tecla Esc.
  useEffect(() => {
    if (!aberto) return;
    const fechar = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, [aberto]);

  const principais = itens.filter((i) => !i.gestao);
  const gestao = itens.filter((i) => i.gestao);
  const hrefAtivo = itens.find((i) => ativo(pathname, i.href))?.href ?? null;

  /*
   * Indicador do item ativo (receita "tabs sliding"): uma só pílula que desliza até o item
   * da página atual. Até ser medida, o próprio item ativo pinta o fundo, sem salto visual.
   */
  const lista = useRef<HTMLDivElement>(null);
  const links = useRef(new Map<string, HTMLAnchorElement>());
  const [pilula, setPilula] = useState<{ y: number; altura: number } | null>(null);
  const [animar, setAnimar] = useState(false);

  useLayoutEffect(() => {
    const medir = () => {
      const caixa = lista.current;
      const alvo = hrefAtivo ? links.current.get(hrefAtivo) : null;
      if (!caixa || !alvo) return setPilula(null);
      const base = caixa.getBoundingClientRect().top;
      const r = alvo.getBoundingClientRect();
      setPilula({ y: r.top - base, altura: r.height });
    };
    medir();
    const observador = new ResizeObserver(medir);
    if (lista.current) observador.observe(lista.current);
    return () => observador.disconnect();
  }, [hrefAtivo, recolhido]);

  useEffect(() => {
    if (!pilula || animar) return;
    const id = requestAnimationFrame(() => setAnimar(true));
    return () => cancelAnimationFrame(id);
  }, [pilula, animar]);

  // No celular o menu é sempre a gaveta completa; recolher vale só a partir de lg.
  const r = recolhido;

  const link = (item: ItemMenu) => {
    const atual = item.href === hrefAtivo;
    const Icone = ICONES[item.href] ?? House;
    return (
      <li key={item.href} className="com-dica relative">
        <Link
          href={item.href}
          ref={(el) => {
            if (el) links.current.set(item.href, el);
            else links.current.delete(item.href);
          }}
          aria-current={atual ? "page" : undefined}
          onClick={() => setAberto(false)}
          className={`relative z-10 flex min-h-11 items-center gap-3 overflow-hidden rounded-[0.625rem] px-[0.9375rem] text-[0.9375rem] whitespace-nowrap transition-colors duration-150 ${
            atual
              ? `font-semibold text-vinho ${pilula ? "" : "bg-vinho-suave"}`
              : "font-medium text-tinta hover:bg-tinta/[0.045]"
          }`}
        >
          <Icone aria-hidden="true" className={`size-[1.125rem] shrink-0 ${atual ? "text-vinho" : "text-grafite"}`} strokeWidth={1.75} />
          <span className={`transition-opacity duration-200 ${r ? "lg:opacity-0" : ""}`}>{item.rotulo}</span>
        </Link>
        {r ? (
          <span
            aria-hidden="true"
            className="dica absolute top-1/2 left-[calc(100%+0.75rem)] z-50 -mt-4 hidden h-8 items-center rounded-lg bg-tinta px-2.5 text-[0.8125rem] font-medium whitespace-nowrap text-white lg:flex"
          >
            {item.rotulo}
          </span>
        ) : null}
      </li>
    );
  };

  return (
    <>
      {/* Barra do topo, só em telas pequenas */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-linha bg-superficie/90 px-4 backdrop-blur-md lg:hidden">
        <Link href="/" aria-label="LDS Academy, início" className="rounded-md">
          <Image src="/marca/lockup-vinho.png" alt="LDS·FDR" width={119} height={44} priority className="h-8 w-auto" />
        </Link>
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          aria-controls="menu-principal"
          aria-label={aberto ? "Fechar menu" : "Abrir menu"}
          className="flex size-11 items-center justify-center rounded-lg text-tinta transition-colors hover:bg-sutil"
        >
          {aberto ? <X aria-hidden="true" className="size-5" /> : <IconeMenu aria-hidden="true" className="size-5" />}
        </button>
      </header>

      <button
        type="button"
        aria-label="Fechar menu"
        tabIndex={-1}
        onClick={() => setAberto(false)}
        className={`fixed inset-0 z-30 bg-tinta/30 backdrop-blur-[2px] transition-opacity duration-200 lg:hidden ${
          aberto ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <nav
        id="menu-principal"
        aria-label="Menu principal"
        className={`fixed inset-y-0 left-0 z-40 flex w-(--menu-largura) flex-col border-r border-linha bg-superficie transition-[translate,width] duration-300 ease-entra-sai lg:translate-x-0 ${
          aberto ? "translate-x-0" : "invisible -translate-x-full lg:visible"
        } ${r ? "overflow-y-auto lg:w-(--menu-recolhido) lg:overflow-visible" : "overflow-y-auto"}`}
      >
        {/* Marca e botão de recolher */}
        <div className="relative flex h-[5.5rem] shrink-0 items-center px-3">
          <Link
            href="/"
            onClick={() => setAberto(false)}
            aria-label="LDS Academy, início"
            className={`flex min-w-0 items-center rounded-lg px-3 py-2 transition-opacity duration-200 ${r ? "lg:pointer-events-none lg:opacity-0" : ""}`}
          >
            <Image src="/marca/lockup-vinho.png" alt="" width={122} height={45} priority className="h-10 w-auto" />
          </Link>
          <button
            type="button"
            onClick={alternar}
            aria-label={r ? "Expandir menu" : "Recolher menu"}
            aria-expanded={!r}
            aria-controls="menu-principal"
            title={r ? "Expandir menu" : "Recolher menu"}
            className={`absolute top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-lg text-grafite transition-[background-color,color,right] duration-300 ease-entra-sai hover:bg-sutil hover:text-tinta lg:flex ${
              r ? "right-4" : "right-3"
            }`}
          >
            {r ? (
              <PanelLeftOpen aria-hidden="true" className="size-[1.125rem]" strokeWidth={1.75} />
            ) : (
              <PanelLeftClose aria-hidden="true" className="size-[1.125rem]" strokeWidth={1.75} />
            )}
          </button>
        </div>

        <div ref={lista} className="relative px-3">
          {pilula ? (
            <span
              aria-hidden="true"
              className={`absolute inset-x-3 top-0 rounded-[0.625rem] bg-vinho-suave ${
                animar ? "transition-[translate,height] duration-300 ease-saida" : ""
              }`}
              style={{ translate: `0 ${pilula.y}px`, height: pilula.altura }}
            />
          ) : null}

          <ul className="flex flex-col gap-0.5">{principais.map(link)}</ul>

          {gestao.length > 0 && (
            <div className="mt-4 border-t border-linha pt-3">
              <p
                aria-hidden={r || undefined}
                className={`flex h-7 items-center px-3 text-xs font-semibold whitespace-nowrap text-grafite transition-opacity duration-200 ${r ? "lg:opacity-0" : ""}`}
              >
                Diretoria e conselho
              </p>
              <ul className="flex flex-col gap-0.5">{gestao.map(link)}</ul>
            </div>
          )}
        </div>

        <div
          className={`mt-auto flex shrink-0 items-center border-t border-linha py-4 ${
            r ? "gap-2 px-4 lg:flex-col lg:gap-1 lg:px-0" : "gap-2 px-4"
          }`}
        >
          <Link
            href="/conta"
            onClick={() => setAberto(false)}
            aria-label={`Meu perfil: ${nome}`}
            title={r ? `${nome} · ${ROTULO_PAPEL[papel]}` : "Meu perfil"}
            className={`flex min-w-0 items-center gap-3 rounded-lg p-1 transition-colors hover:bg-sutil ${r ? "flex-1 lg:flex-none" : "flex-1"}`}
          >
            <Avatar nome={nome} foto={foto} />
            <span className={`min-w-0 flex-1 ${r ? "lg:sr-only" : ""}`}>
              <span className="block truncate text-sm font-semibold text-tinta">{nome}</span>
              <span className="block text-xs text-grafite">{ROTULO_PAPEL[papel]}</span>
            </span>
          </Link>
          <form action="/auth/sair" method="post">
            <button
              type="submit"
              aria-label="Sair"
              title="Sair"
              className="flex size-10 items-center justify-center rounded-lg text-grafite transition-colors hover:bg-sutil hover:text-tinta"
            >
              <LogOut aria-hidden="true" className="size-[1.125rem]" strokeWidth={1.75} />
            </button>
          </form>
        </div>
      </nav>
    </>
  );
}
