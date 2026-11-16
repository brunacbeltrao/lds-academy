"use client";

import { useEffect, useState } from "react";
import { Share, Smartphone, SquarePlus, X } from "lucide-react";

/** Evento do Chrome e do Edge que permite abrir o pedido de instalação por um botão. */
type PedidoDeInstalacao = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const CHAVE_DISPENSADO = "lds-instalar-dispensado";

type Situacao = "carregando" | "instalado" | "botao" | "iphone" | "indisponivel";

function jaInstalado() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function ehIphone() {
  const ua = navigator.userAgent;
  // O iPad recente se apresenta como Mac, mas tem tela de toque.
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

function lerDispensado(): boolean {
  try {
    return window.localStorage.getItem(CHAVE_DISPENSADO) === "sim";
  } catch {
    return false;
  }
}

/**
 * Convite para instalar a plataforma como app. No Android e no computador abre o pedido do
 * navegador; no iPhone explica o caminho pelo Compartilhar. Some quando já está instalada.
 * `dispensavel`: no Início, pode ser fechado e não volta; na Conta, fica sempre disponível.
 */
export function InstalarApp({ dispensavel = false }: { dispensavel?: boolean }) {
  const [situacao, setSituacao] = useState<Situacao>("carregando");
  const [pedido, setPedido] = useState<PedidoDeInstalacao | null>(null);
  const [dispensado, setDispensado] = useState(false);

  useEffect(() => {
    // Lê o ambiente do navegador só depois de montar, para não divergir do HTML do servidor.
    const inicial: Situacao = jaInstalado() ? "instalado" : ehIphone() ? "iphone" : "indisponivel";
    const temporizador = window.setTimeout(() => {
      setDispensado(lerDispensado());
      setSituacao((atual) => (atual === "carregando" ? inicial : atual));
    }, 0);

    const aoPedir = (e: Event) => {
      e.preventDefault();
      setPedido(e as PedidoDeInstalacao);
      setSituacao("botao");
    };
    const aoInstalar = () => setSituacao("instalado");
    window.addEventListener("beforeinstallprompt", aoPedir);
    window.addEventListener("appinstalled", aoInstalar);
    return () => {
      window.clearTimeout(temporizador);
      window.removeEventListener("beforeinstallprompt", aoPedir);
      window.removeEventListener("appinstalled", aoInstalar);
    };
  }, []);

  function dispensar() {
    setDispensado(true);
    try {
      window.localStorage.setItem(CHAVE_DISPENSADO, "sim");
    } catch {
      // Sem armazenamento local, o convite só volta na próxima visita.
    }
  }

  async function instalar() {
    if (!pedido) return;
    await pedido.prompt();
    const { outcome } = await pedido.userChoice;
    setPedido(null);
    setSituacao(outcome === "accepted" ? "instalado" : "indisponivel");
  }

  if (dispensavel && dispensado) return null;
  if (situacao === "carregando" || situacao === "instalado") return null;
  // No Início, sem como instalar (navegador sem suporte), não há o que oferecer.
  if (dispensavel && situacao === "indisponivel") return null;

  return (
    <section aria-labelledby="instalar-app" className="cartao surgir flex gap-3 p-4 sm:gap-4 sm:p-5">
      <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-vinho-suave text-vinho">
        <Smartphone className="size-5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <h2 id="instalar-app" className="font-semibold text-tinta">
          Instale a LDS Academy no celular
        </h2>
        {situacao === "botao" ? (
          <>
            <p className="mt-0.5 text-[0.9375rem] text-grafite">Ela ganha um ícone na tela inicial e abre como um app, sem a barra do navegador.</p>
            <button type="button" onClick={instalar} className="botao mt-3">
              Instalar
            </button>
          </>
        ) : situacao === "iphone" ? (
          <ol className="mt-1 flex flex-col gap-1.5 text-[0.9375rem] text-grafite">
            <li className="flex flex-wrap items-center gap-1.5">
              1. No Safari, toque em
              <span className="inline-flex items-center gap-1 font-medium text-tinta">
                <Share aria-hidden="true" className="size-4" strokeWidth={1.75} />
                Compartilhar
              </span>
            </li>
            <li className="flex flex-wrap items-center gap-1.5">
              2. Escolha
              <span className="inline-flex items-center gap-1 font-medium text-tinta">
                <SquarePlus aria-hidden="true" className="size-4" strokeWidth={1.75} />
                Adicionar à Tela de Início
              </span>
            </li>
          </ol>
        ) : (
          <p className="mt-0.5 text-[0.9375rem] text-grafite">
            Abra este endereço no Chrome (Android) ou no Safari (iPhone) e use a opção de instalar ou de adicionar à tela de início.
          </p>
        )}
      </div>
      {dispensavel ? (
        <button
          type="button"
          onClick={dispensar}
          aria-label="Dispensar o convite para instalar"
          className="-mt-1 -mr-1 flex size-10 shrink-0 items-center justify-center rounded-lg text-grafite transition-colors hover:bg-sutil hover:text-tinta"
        >
          <X aria-hidden="true" className="size-[1.125rem]" strokeWidth={1.75} />
        </button>
      ) : null}
    </section>
  );
}
