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
      <div>
        <label htmlFor="email" className="rotulo-campo">
          E-mail cadastrado na liga
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" placeholder="nome@exemplo.com" className="campo" />
      </div>
      <button type="submit" disabled={enviando} className="botao w-full">
        {enviando ? "Enviando…" : "Receber link de acesso"}
      </button>
      {estado && (
        <p role="status" className={`aviso surgir ${estado.ok ? "aviso-ok" : "aviso-erro"}`}>
          {estado.mensagem}
        </p>
      )}
    </form>
  );
}
