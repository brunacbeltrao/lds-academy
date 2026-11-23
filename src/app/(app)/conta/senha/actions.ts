"use server";

import { getMembroAtual } from "@/lib/membro";
import { createClient } from "@/lib/supabase/server";

export type EstadoSenha = { ok: boolean; mensagem: string } | null;

/** Troca a senha do membro logado (também usada ao voltar do link de Esqueci a senha). */
export async function trocarSenha(_: EstadoSenha, formData: FormData): Promise<EstadoSenha> {
  await getMembroAtual();
  const senha = String(formData.get("senha") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "");
  if (senha.length < 8) return { ok: false, mensagem: "A senha precisa ter pelo menos 8 caracteres." };
  if (senha !== confirmacao) return { ok: false, mensagem: "As duas senhas não são iguais." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) {
    if (error.code === "same_password") return { ok: false, mensagem: "A nova senha precisa ser diferente da atual." };
    if (error.code === "weak_password") return { ok: false, mensagem: "Senha fraca. Misture letras e números." };
    return { ok: false, mensagem: "Não foi possível trocar a senha agora. Tente de novo em instantes." };
  }
  return { ok: true, mensagem: "Senha salva. Use a nova senha no próximo acesso." };
}
