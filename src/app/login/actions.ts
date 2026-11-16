"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type EstadoLogin = { ok: boolean; mensagem: string } | null;

export async function enviarLink(_: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, mensagem: "Informe um e-mail válido." };
  }

  const h = await headers();
  const origem = h.get("origin") ?? `https://${h.get("host")}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origem}/auth/callback`, shouldCreateUser: true },
  });

  if (error) {
    // O banco recusa o cadastro de quem não está na lista oficial (trigger em auth.users).
    if (/database error|lista de membros/i.test(error.message)) {
      return {
        ok: false,
        mensagem: "Este e-mail não está na lista de membros da LDS·FDR. Fale com a diretoria.",
      };
    }
    if (error.status === 429) {
      return { ok: false, mensagem: "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo." };
    }
    return { ok: false, mensagem: "Não foi possível enviar o link agora. Tente de novo em instantes." };
  }

  return { ok: true, mensagem: `Enviamos um link de acesso para ${email}. Abra o e-mail neste aparelho.` };
}
