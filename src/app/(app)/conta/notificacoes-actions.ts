"use server";

import { revalidatePath } from "next/cache";
import { erro, id, ok, type Estado } from "@/lib/estado";
import { getMembroAtual } from "@/lib/membro";
import { CATEGORIAS_NOTIFICACAO } from "@/lib/notificacoes-formato";
import { createClient } from "@/lib/supabase/server";

const SO_CONSELHO = "O conselho acompanha em modo leitura e não recebe notificações.";

/** Grava a inscrição do aparelho (feita no navegador). Ligantes e diretoria. */
export async function salvarInscricao(dados: { endpoint: string; p256dh: string; auth: string; aparelho: string }): Promise<Estado> {
  const membro = await getMembroAtual();
  if (membro.papel === "conselheiro") return erro(SO_CONSELHO);
  const endpoint = String(dados.endpoint ?? "");
  const p256dh = String(dados.p256dh ?? "");
  const auth = String(dados.auth ?? "");
  if (!/^https:\/\/\S{10,2000}$/.test(endpoint) || !/^[\w-]{20,200}$/.test(p256dh) || !/^[\w-]{10,100}$/.test(auth)) {
    return erro("Inscrição inválida.");
  }

  const supabase = await createClient();
  // O mesmo aparelho pode estar inscrito de novo (permissão renovada): troca a inscrição antiga.
  await supabase.from("inscricoes_push").delete().eq("endpoint", endpoint).eq("membro_id", membro.id);
  const { error } = await supabase
    .from("inscricoes_push")
    .insert({ membro_id: membro.id, endpoint, p256dh, auth, aparelho: String(dados.aparelho ?? "").slice(0, 120) || null });
  if (error) {
    return erro(error.code === "23505" ? "Este aparelho já está ligado à conta de outro membro." : "Não foi possível ativar. Tente de novo.");
  }
  revalidatePath("/conta");
  return ok("Notificações ativadas neste aparelho.");
}

/** Desfaz a inscrição do aparelho. */
export async function removerInscricao(endpoint: string): Promise<Estado> {
  const membro = await getMembroAtual();
  const supabase = await createClient();
  const { error } = await supabase.from("inscricoes_push").delete().eq("endpoint", String(endpoint ?? "")).eq("membro_id", membro.id);
  if (error) return erro("Não foi possível desativar. Tente de novo.");
  revalidatePath("/conta");
  return ok("Notificações desativadas neste aparelho.");
}

/** Remove um aparelho da lista (por exemplo, um celular antigo). */
export async function removerAparelho(_: Estado, formData: FormData): Promise<Estado> {
  const membro = await getMembroAtual();
  const aparelhoId = id(formData, "aparelhoId");
  if (!aparelhoId) return erro("Aparelho inválido.");
  const supabase = await createClient();
  const { error } = await supabase.from("inscricoes_push").delete().eq("id", aparelhoId).eq("membro_id", membro.id);
  if (error) return erro("Não foi possível remover. Tente de novo.");
  revalidatePath("/conta");
  return ok("Aparelho removido.");
}

/** Liga e desliga as categorias de notificação. */
export async function salvarPreferencias(_: Estado, formData: FormData): Promise<Estado> {
  const membro = await getMembroAtual();
  if (membro.papel === "conselheiro") return erro(SO_CONSELHO);
  const valores = Object.fromEntries(CATEGORIAS_NOTIFICACAO.map((c) => [c.id, formData.get(c.id) === "sim"]));
  const supabase = await createClient();
  const { error } = await supabase
    .from("preferencias_notificacao")
    .upsert({ membro_id: membro.id, ...valores, atualizado_em: new Date().toISOString() }, { onConflict: "membro_id" });
  if (error) return erro("Não foi possível salvar. Tente de novo.");
  revalidatePath("/conta");
  return ok("Preferências salvas.");
}

/** Manda uma notificação de teste para os aparelhos do próprio membro. */
export async function enviarTeste(): Promise<Estado> {
  const membro = await getMembroAtual();
  if (membro.papel === "conselheiro") return erro(SO_CONSELHO);
  const supabase = await createClient();
  const { count } = await supabase.from("inscricoes_push").select("id", { count: "exact", head: true }).eq("membro_id", membro.id);
  if (!count) return erro("Ative as notificações neste aparelho primeiro.");
  const { error } = await supabase.from("notificacoes").insert({
    membro_id: membro.id,
    categoria: "teste",
    titulo: "Notificações ligadas",
    corpo: "É assim que os avisos da LDS Academy vão chegar.",
    url: "/conta",
  });
  if (error) return erro("Não foi possível enviar o teste. Tente de novo.");
  revalidatePath("/conta");
  return ok("Teste enviado. Deve chegar em alguns segundos.");
}
