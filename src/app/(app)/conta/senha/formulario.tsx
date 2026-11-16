"use client";

import { useActionState } from "react";
import { Aviso, CampoSenha } from "@/app/login/formulario";
import { trocarSenha, type EstadoSenha } from "./actions";

export function FormularioSenha() {
  const [estado, acao, enviando] = useActionState<EstadoSenha, FormData>(trocarSenha, null);
  return (
    <form action={acao} className="flex max-w-sm flex-col gap-4">
      <CampoSenha id="senha" rotulo="Nova senha" autoComplete="new-password" ajuda="Pelo menos 8 caracteres." />
      <CampoSenha id="confirmacao" rotulo="Repita a nova senha" autoComplete="new-password" />
      <button type="submit" disabled={enviando} className="botao mt-1 self-start">
        {enviando ? "Salvando…" : "Salvar senha"}
      </button>
      <Aviso estado={estado} />
    </form>
  );
}
