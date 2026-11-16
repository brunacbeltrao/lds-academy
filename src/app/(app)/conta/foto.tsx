"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { Avatar } from "@/components/ui";
import type { Estado } from "@/lib/estado";
import { createClient } from "@/lib/supabase/client";
import { registrarFoto, removerFoto } from "./actions";

const LADO = 512;

/** Recorta ao centro em quadrado e reduz para 512 px, em JPEG: a foto sobe leve. */
async function prepararFoto(arquivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo);
  const lado = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = LADO;
  canvas.height = LADO;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, (bitmap.width - lado) / 2, (bitmap.height - lado) / 2, lado, lado, 0, 0, LADO, LADO);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/jpeg", 0.86));
}

export function EnvioDeFoto({ membroId, nome, foto }: { membroId: string; nome: string; foto: string | null }) {
  const entrada = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  async function escolher(arquivo: File | undefined) {
    if (!arquivo) return;
    if (!/^image\/(jpeg|png|webp)$/.test(arquivo.type)) return setEstado({ ok: false, mensagem: "Use uma imagem JPG, PNG ou WebP." });
    if (arquivo.size > 15 * 1024 * 1024) return setEstado({ ok: false, mensagem: "Imagem muito grande. Escolha uma de até 15 MB." });
    iniciar(async () => {
      try {
        const blob = await prepararFoto(arquivo);
        setPrevia(URL.createObjectURL(blob));
        const caminho = `${membroId}/${crypto.randomUUID()}.jpg`;
        const { error } = await createClient().storage.from("fotos").upload(caminho, blob, { contentType: "image/jpeg" });
        if (error) return setEstado({ ok: false, mensagem: "Não foi possível enviar a foto. Tente de novo." });
        setEstado(await registrarFoto(caminho));
        router.refresh();
      } catch {
        setEstado({ ok: false, mensagem: "Não foi possível ler esta imagem. Tente outra." });
      } finally {
        if (entrada.current) entrada.current.value = "";
      }
    });
  }

  function remover() {
    iniciar(async () => {
      setPrevia(null);
      setEstado(await removerFoto());
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <div className="relative self-start">
        <Avatar nome={nome} foto={previa ?? foto} tamanho="lg" />
        <button
          type="button"
          onClick={() => entrada.current?.click()}
          disabled={pendente}
          aria-label="Escolher foto"
          className="absolute -right-1 -bottom-1 flex size-9 items-center justify-center rounded-full bg-vinho text-white ring-4 ring-superficie transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
        >
          <Camera aria-hidden="true" className="size-4" strokeWidth={2} />
        </button>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-[0.9375rem] text-grafite">JPG, PNG ou WebP. A foto é recortada em quadrado e aparece para os membros da liga.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => entrada.current?.click()} disabled={pendente} className="botao">
            {pendente ? "Enviando…" : foto || previa ? "Trocar foto" : "Enviar foto"}
          </button>
          {foto || previa ? (
            <button type="button" onClick={remover} disabled={pendente} className="botao botao-secundario">
              Remover
            </button>
          ) : null}
        </div>
        {estado ? (
          <p role="status" className={`aviso surgir ${estado.ok ? "aviso-ok" : "aviso-erro"}`}>
            {estado.mensagem}
          </p>
        ) : null}
      </div>
      <input ref={entrada} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => escolher(e.target.files?.[0])} />
    </div>
  );
}
