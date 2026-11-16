"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EstadoLogin = { ok: boolean; mensagem: string } | null;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENHA_MINIMA = 8;

const MUITAS_TENTATIVAS = "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.";
const FORA_DA_LISTA =
  "Este e-mail não está na lista de membros da LDS·FDR. Confira se é o e-mail que você informou à diretoria.";

async function origem() {
  const h = await headers();
  return h.get("origin") ?? `https://${h.get("host")}`;
}

function lerEmail(formData: FormData) {
  return String(formData.get("email") ?? "").trim().toLowerCase();
}

/** Entrar com e-mail e senha. */
export async function entrar(_: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const email = lerEmail(formData);
  const senha = String(formData.get("senha") ?? "");
  if (!EMAIL.test(email) || !senha) return { ok: false, mensagem: "Informe o e-mail e a senha." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) {
    if (error.status === 429) return { ok: false, mensagem: MUITAS_TENTATIVAS };
    if (error.code === "email_not_confirmed") {
      return { ok: false, mensagem: "Sua conta ainda não foi confirmada. Abra o link que enviamos para o seu e-mail." };
    }
    return {
      ok: false,
      mensagem: "E-mail ou senha incorretos. Se é seu primeiro acesso, crie a senha na aba Primeiro acesso.",
    };
  }

  redirect("/");
}

/**
 * Primeiro acesso: cria a conta com a senha escolhida. O banco só aceita e-mails da lista
 * oficial (gatilho em auth.users) e vincula a conta ao nome do membro.
 */
export async function criarConta(_: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const email = lerEmail(formData);
  const senha = String(formData.get("senha") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "");

  if (!EMAIL.test(email)) return { ok: false, mensagem: "Informe um e-mail válido." };
  if (senha.length < SENHA_MINIMA) return { ok: false, mensagem: `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.` };
  if (senha !== confirmacao) return { ok: false, mensagem: "As duas senhas não são iguais." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { emailRedirectTo: `${await origem()}/auth/callback` },
  });

  if (error) {
    if (/database error|lista de membros/i.test(error.message)) return { ok: false, mensagem: FORA_DA_LISTA };
    if (error.code === "user_already_exists") {
      return { ok: false, mensagem: "Já existe uma conta com este e-mail. Entre com a sua senha ou use Esqueci a senha." };
    }
    if (error.code === "weak_password") {
      return { ok: false, mensagem: "Senha fraca. Use pelo menos 8 caracteres, misturando letras e números." };
    }
    if (error.status === 429) return { ok: false, mensagem: MUITAS_TENTATIVAS };
    return { ok: false, mensagem: "Não foi possível criar a conta agora. Tente de novo em instantes." };
  }

  // Com a confirmação de e-mail desligada no Supabase, a conta já nasce com sessão.
  if (data.session) redirect("/");
  return { ok: true, mensagem: `Conta criada. Abra o link que enviamos para ${email} para confirmar e depois entre com a sua senha.` };
}

/** Esqueci a senha: envia um link que leva à tela de nova senha. */
export async function recuperarSenha(_: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const email = lerEmail(formData);
  if (!EMAIL.test(email)) return { ok: false, mensagem: "Informe um e-mail válido." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await origem()}/auth/callback?proximo=/conta/senha`,
  });

  if (error?.status === 429) return { ok: false, mensagem: MUITAS_TENTATIVAS };
  // Mesma resposta exista ou não a conta, para não revelar quem é membro.
  return {
    ok: true,
    mensagem: `Se houver uma conta para ${email}, enviamos um link para criar uma nova senha. Abra o e-mail neste aparelho.`,
  };
}
