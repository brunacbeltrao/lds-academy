"use client";

import { useActionState } from "react";
import { enviarLink, type EstadoLogin } from "./actions";

export function FormularioLogin({ erroInicial }: { erroInicial?: string }) {
  const [estado, acao, enviando] = useActionState<EstadoLogin, FormData>(
    enviarLink,
    erroInicial ? { ok: false, mensagem: erroInicial } : null,
  );

  return (
    <form action={acao} className="flex flex-col gap-4">
      <label htmlFor="email" className="rotulo text-grafite">
        E-mail cadastrado na liga
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="nome@exemplo.com"
        className="border border-filete-forte bg-papel px-4 py-3 text-base text-tinta placeholder:text-grafite/70 focus:border-vinho focus:outline-none"
      />
      <button
        type="submit"
        disabled={enviando}
        className="rotulo bg-vinho px-4 py-3 text-bege transition-colors hover:bg-vinho-profundo active:bg-vinho-press disabled:opacity-60"
      >
        {enviando ? "Enviando…" : "Receber link de acesso"}
      </button>
      {estado && (
        <p
          role="status"
          className={
            estado.ok
              ? "border-l-4 border-vinho bg-rosa px-4 py-3 text-sm text-tinta"
              : "border-l-4 border-vinho-press bg-papel px-4 py-3 text-sm text-vinho-press"
          }
        >
          {estado.mensagem}
        </p>
      )}
    </form>
  );
}
