"use client";

import { useActionState, useEffect, useRef } from "react";
import { editarAviso, publicarAviso, type Resultado } from "./actions";

type Valores = { id: string; titulo: string; corpo: string; fixado: boolean };

/** Publica um aviso novo ou, com `valores`, corrige um existente. */
export function FormularioAviso({ valores }: { valores?: Valores }) {
  const [estado, acao, salvando] = useActionState<Resultado, FormData>(valores ? editarAviso : publicarAviso, null);
  const formulario = useRef<HTMLFormElement>(null);
  const prefixo = valores ? `aviso-${valores.id}` : "aviso-novo";

  // Depois de publicar um aviso novo, o formulário volta em branco.
  useEffect(() => {
    if (estado?.ok && !valores) formulario.current?.reset();
  }, [estado, valores]);

  return (
    <form ref={formulario} action={acao} className="flex flex-col gap-5">
      {valores ? <input type="hidden" name="avisoId" value={valores.id} /> : null}
      <div>
        <label htmlFor={`${prefixo}-titulo`} className="rotulo-campo">
          Título
        </label>
        <input
          id={`${prefixo}-titulo`}
          name="titulo"
          required
          maxLength={160}
          defaultValue={valores?.titulo}
          placeholder="Ex.: Aula desta quarta na sala 3"
          className="campo"
        />
      </div>
      <div>
        <label htmlFor={`${prefixo}-corpo`} className="rotulo-campo">
          Texto
        </label>
        <textarea
          id={`${prefixo}-corpo`}
          name="corpo"
          required
          rows={5}
          maxLength={4000}
          defaultValue={valores?.corpo}
          placeholder="Uma linha em branco separa parágrafos. Links começando com https:// ficam clicáveis."
          className="campo"
        />
      </div>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[0.9375rem] text-tinta">
        <input type="checkbox" name="fixado" defaultChecked={valores?.fixado} className="size-5 shrink-0 accent-vinho" />
        Fixar no topo do Início
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={salvando} className="botao">
          {salvando ? "Salvando…" : valores ? "Salvar aviso" : "Publicar aviso"}
        </button>
        {estado ? (
          <p role="status" className={`aviso ${estado.ok ? "aviso-ok" : "aviso-erro"}`}>
            {estado.mensagem}
          </p>
        ) : null}
      </div>
    </form>
  );
}
