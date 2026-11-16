"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  GraduationCap,
  House,
  Landmark,
  Library,
  LogOut,
  Menu as IconeMenu,
  MessagesSquare,
  PenLine,
  Settings,
  TrendingUp,
  Trophy,
  X,
  type LucideIcon,
} from "lucide-react";
import type { ItemMenu } from "@/lib/navegacao";

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
  "/gestao": Settings,
};

type Props = { itens: ItemMenu[]; nome: string; papel: Papel };

function ativo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function Menu({ itens, nome, papel }: Props) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);

  // A gaveta fecha ao escolher um item e com a tecla Esc.
  useEffect(() => {
    if (!aberto) return;
    const fechar = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, [aberto]);

  const principais = itens.filter((i) => !i.gestao);
  const gestao = itens.filter((i) => i.gestao);

  const link = (item: ItemMenu) => {
    const atual = ativo(pathname, item.href);
    const Icone = ICONES[item.href] ?? House;
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          aria-current={atual ? "page" : undefined}
          onClick={() => setAberto(false)}
          className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-[0.9375rem] transition-colors duration-150 ${
            atual ? "bg-vinho-suave font-semibold text-vinho" : "font-medium text-tinta hover:bg-sutil"
          }`}
        >
          <Icone aria-hidden="true" className={`size-[1.125rem] shrink-0 ${atual ? "text-vinho" : "text-grafite"}`} strokeWidth={1.75} />
          {item.rotulo}
        </Link>
      </li>
    );
  };

  return (
    <>
      {/* Barra do topo, só em telas pequenas */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-linha bg-superficie px-4 lg:hidden">
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
        className={`fixed inset-0 z-30 bg-tinta/30 transition-opacity duration-200 lg:hidden ${
          aberto ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <nav
        id="menu-principal"
        aria-label="Menu principal"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col overflow-y-auto border-r border-linha bg-superficie transition-transform duration-300 ease-saida lg:translate-x-0 ${
          aberto ? "translate-x-0" : "invisible -translate-x-full lg:visible"
        }`}
      >
        <Link href="/" onClick={() => setAberto(false)} className="mx-3 mt-4 block rounded-lg px-3 py-3" aria-label="LDS Academy, início">
          <Image src="/marca/lockup-vinho.png" alt="LDS·FDR" width={140} height={52} priority className="h-10 w-auto" />
          <span className="mt-2 block text-sm font-medium text-grafite">LDS Academy</span>
        </Link>

        <ul className="mt-3 flex flex-col gap-0.5 px-3">{principais.map(link)}</ul>

        {gestao.length > 0 && (
          <div className="mx-3 mt-4 border-t border-linha pt-4">
            <p className="px-3 pb-1.5 text-xs font-semibold text-grafite">Diretoria e conselho</p>
            <ul className="flex flex-col gap-0.5">{gestao.map(link)}</ul>
          </div>
        )}

        <div className="mt-auto flex items-center gap-3 border-t border-linha px-4 py-4">
          <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-vinho-suave text-sm font-bold text-vinho">
            {nome.trim().charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-tinta">{nome}</p>
            <p className="text-xs text-grafite">{ROTULO_PAPEL[papel]}</p>
          </div>
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
