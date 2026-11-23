"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, Share, SquarePlus } from "lucide-react";
import type { Estado } from "@/lib/estado";
import { VAPID_PUBLICA } from "@/lib/notificacoes-formato";
import { enviarTeste, removerInscricao, salvarInscricao } from "./notificacoes-actions";

type Situacao = "carregando" | "sem-suporte" | "instalar-iphone" | "bloqueado" | "desligado" | "ligado";

function ehIphone() {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

function instalado() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function suportado() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/** "Chrome no Android", "Safari no iPhone": só para a pessoa reconhecer o aparelho na lista. */
function descreverAparelho(): string {
  const ua = navigator.userAgent;
  const sistema = /Android/.test(ua) ? "Android" : ehIphone() ? "iPhone" : /Windows/.test(ua) ? "Windows" : /Mac/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : "aparelho";
  const navegador = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "navegador";
  return `${navegador} no ${sistema}${instalado() ? " (app)" : ""}`;
}

/** A chave pública VAPID vem em base64url; o navegador quer os bytes. */
function paraBytes(base64: string): Uint8Array<ArrayBuffer> {
  const preenchido = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const binario = window.atob(preenchido);
  const bytes = new Uint8Array(new ArrayBuffer(binario.length));
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

async function inscricaoAtual(): Promise<PushSubscription | null> {
  const registro = await navigator.serviceWorker.getRegistration("/");
  return (await registro?.pushManager.getSubscription()) ?? null;
}

/**
 * Liga e desliga as notificações neste aparelho. No iPhone, o Safari só permite notificações
 * no app instalado na tela de início (iOS 16.4 ou mais novo).
 */
export function AtivarNotificacoes() {
  const router = useRouter();
  const [situacao, setSituacao] = useState<Situacao>("carregando");
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState<Estado>(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      let inicial: Situacao;
      if (ehIphone() && !instalado()) inicial = "instalar-iphone";
      else if (!suportado()) inicial = "sem-suporte";
      else if (Notification.permission === "denied") inicial = "bloqueado";
      else inicial = (await inscricaoAtual().catch(() => null)) ? "ligado" : "desligado";
      if (ativo) setSituacao(inicial);
    })();
    return () => {
      ativo = false;
    };
  }, []);

  async function ativar() {
    setOcupado(true);
    setMensagem(null);
    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") {
        setSituacao(permissao === "denied" ? "bloqueado" : "desligado");
        setMensagem({ ok: false, mensagem: "Sem a permissão do navegador, as notificações não chegam." });
        return;
      }
      const registro = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
      await navigator.serviceWorker.ready;
      const inscricao =
        (await registro.pushManager.getSubscription()) ??
        (await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: paraBytes(VAPID_PUBLICA) }));
      const dados = inscricao.toJSON();
      const resultado = await salvarInscricao({
        endpoint: inscricao.endpoint,
        p256dh: dados.keys?.p256dh ?? "",
        auth: dados.keys?.auth ?? "",
        aparelho: descreverAparelho(),
      });
      if (!resultado?.ok) await inscricao.unsubscribe().catch(() => undefined);
      setMensagem(resultado);
      setSituacao(resultado?.ok ? "ligado" : "desligado");
      router.refresh();
    } catch {
      setMensagem({ ok: false, mensagem: "Não foi possível ativar neste aparelho. Tente de novo ou use outro navegador." });
    } finally {
      setOcupado(false);
    }
  }

  async function desativar() {
    setOcupado(true);
    setMensagem(null);
    try {
      const inscricao = await inscricaoAtual();
      if (inscricao) {
        await removerInscricao(inscricao.endpoint);
        await inscricao.unsubscribe();
      }
      setSituacao("desligado");
      setMensagem({ ok: true, mensagem: "Notificações desativadas neste aparelho." });
      router.refresh();
    } catch {
      setMensagem({ ok: false, mensagem: "Não foi possível desativar. Tente de novo." });
    } finally {
      setOcupado(false);
    }
  }

  async function testar() {
    setOcupado(true);
    setMensagem(await enviarTeste());
    setOcupado(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      {situacao === "carregando" ? <p className="text-[0.9375rem] text-grafite">Verificando este aparelho…</p> : null}

      {situacao === "instalar-iphone" ? (
        <div className="prosa text-[0.9375rem] text-tinta">
          <p>No iPhone, as notificações só funcionam no app instalado na tela de início (iOS 16.4 ou mais novo):</p>
          <ol className="mt-2 flex flex-col gap-1.5 text-grafite">
            <li className="flex items-center gap-2">
              1. Toque em <Share aria-label="Compartilhar" className="size-4 text-tinta" /> no Safari.
            </li>
            <li className="flex items-center gap-2">
              2. Escolha <SquarePlus aria-hidden="true" className="size-4 text-tinta" /> Adicionar à Tela de Início.
            </li>
            <li>3. Abra a LDS Academy pelo ícone e volte a esta página.</li>
          </ol>
        </div>
      ) : null}

      {situacao === "sem-suporte" ? (
        <p className="text-[0.9375rem] text-grafite">Este navegador não aceita notificações. No celular, use o Chrome (Android) ou o app instalado (iPhone).</p>
      ) : null}

      {situacao === "bloqueado" ? (
        <p className="prosa text-[0.9375rem] text-grafite">
          As notificações estão bloqueadas para a LDS Academy neste navegador. Libere nas configurações do site (o cadeado ao lado do endereço) ou do
          celular e recarregue a página.
        </p>
      ) : null}

      {situacao === "desligado" ? (
        <button type="button" onClick={ativar} disabled={ocupado} className="botao self-start">
          <Bell aria-hidden="true" className="size-4" strokeWidth={1.75} />
          {ocupado ? "Ativando…" : "Ativar neste aparelho"}
        </button>
      ) : null}

      {situacao === "ligado" ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="selo selo-suave">
            <Bell aria-hidden="true" className="size-3" strokeWidth={2} />
            Ativas neste aparelho
          </span>
          <button type="button" onClick={testar} disabled={ocupado} className="botao botao-secundario">
            Enviar um teste
          </button>
          <button
            type="button"
            onClick={desativar}
            disabled={ocupado}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-grafite transition-colors hover:bg-sutil hover:text-tinta disabled:opacity-60"
          >
            <BellOff aria-hidden="true" className="size-4" strokeWidth={1.75} />
            Desativar
          </button>
        </div>
      ) : null}

      {mensagem ? (
        <p role="status" className={`aviso surgir ${mensagem.ok ? "aviso-ok" : "aviso-erro"}`}>
          {mensagem.mensagem}
        </p>
      ) : null}
    </div>
  );
}
