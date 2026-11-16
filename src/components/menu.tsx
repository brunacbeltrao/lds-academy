"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ItemMenu } from "@/lib/navegacao";

type Papel = "ligante" | "diretoria" | "conselheiro";
const ROTULO_PAPEL: Record<Papel, string> = { ligante: "Ligante", diretoria: "Diretoria", conselheiro: "Conselho" };

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
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          aria-current={atual ? "page" : undefined}
          onClick={() => setAberto(false)}
          className={`block border-l-4 py-2.5 pr-4 pl-5 text-[0.95rem] transition-colors focus-visible:outline-bege ${
            atual
              ? "border-bege bg-vinho-profundo font-semibold text-bege"
              : "border-transparent text-bege/85 hover:bg-vinho-profundo hover:text-bege"
          }`}
        >
          {item.rotulo}
        </Link>
      </li>
    );
  };

  return (
    <>
      {/* Barra do topo, só no celular */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-vinho px-4 py-3 md:hidden">
        <Link href="/" aria-label="LDS Academy, início" className="focus-visible:outline-bege">
          <Image src="/marca/lockup-branco.png" alt="LDS·FDR" width={120} height={48} priority className="h-9 w-auto" />
        </Link>
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          aria-controls="menu-principal"
          className="rotulo border border-filete-vinho px-3 py-2 text-bege focus-visible:outline-bege"
        >
          {aberto ? "Fechar" : "Menu"}
        </button>
      </header>

      {aberto && (
        <button
          type="button"
          aria-label="Fechar menu"
          tabIndex={-1}
          onClick={() => setAberto(false)}
          className="fixed inset-0 z-30 bg-tinta/40 md:hidden"
        />
      )}

      <nav
        id="menu-principal"
        aria-label="Menu principal"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col overflow-y-auto bg-vinho text-bege transition-transform duration-200 motion-reduce:transition-none md:translate-x-0 ${
          aberto ? "translate-x-0" : "invisible -translate-x-full md:visible"
        }`}
      >
        <Link href="/" className="block px-5 pt-8 pb-6 focus-visible:outline-bege" aria-label="LDS Academy, início">
          <Image src="/marca/lockup-branco.png" alt="LDS·FDR" width={180} height={72} priority className="h-auto w-40" />
          <span className="rotulo mt-4 block text-rosa-claro">LDS Academy</span>
        </Link>

        <ul className="flex flex-col border-t border-filete-vinho py-3">{principais.map(link)}</ul>

        {gestao.length > 0 && (
          <>
            <p className="rotulo border-t border-filete-vinho px-5 pt-4 pb-1 text-rosa-claro">Diretoria e conselho</p>
            <ul className="flex flex-col pb-3">{gestao.map(link)}</ul>
          </>
        )}

        <div className="mt-auto border-t border-filete-vinho px-5 py-5">
          <p className="truncate font-semibold text-bege">{nome}</p>
          <p className="rotulo mt-0.5 text-rosa-claro">{ROTULO_PAPEL[papel]}</p>
          <form action="/auth/sair" method="post" className="mt-3">
            <button type="submit" className="text-sm text-bege/85 underline underline-offset-4 hover:text-bege focus-visible:outline-bege">
              Sair
            </button>
          </form>
        </div>
      </nav>
    </>
  );
}
