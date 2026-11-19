import "server-only";
import { createClient } from "@/lib/supabase/server";
import { PREFERENCIAS_PADRAO, type Preferencias } from "@/lib/notificacoes-formato";

export type Aparelho = { id: string; aparelho: string | null; criadoEm: string };
export type NotificacaoRecente = { id: string; titulo: string; corpo: string; url: string; criadaEm: string; enviada: boolean };

/** Preferências, aparelhos inscritos e as últimas notificações do próprio membro (RLS: só as suas). */
export async function getMinhasNotificacoes(membroId: string): Promise<{
  preferencias: Preferencias;
  aparelhos: Aparelho[];
  recentes: NotificacaoRecente[];
}> {
  const supabase = await createClient();
  const [prefs, aparelhos, recentes] = await Promise.all([
    supabase.from("preferencias_notificacao").select("avisos, lembretes, respostas, oportunidades, fila").eq("membro_id", membroId).maybeSingle(),
    supabase.from("inscricoes_push").select("id, aparelho, criado_em").eq("membro_id", membroId).order("criado_em", { ascending: false }),
    supabase
      .from("notificacoes")
      .select("id, titulo, corpo, url, criada_em, enviada_em")
      .eq("membro_id", membroId)
      .order("criada_em", { ascending: false })
      .limit(8),
  ]);
  return {
    preferencias: prefs.data ?? PREFERENCIAS_PADRAO,
    aparelhos: (aparelhos.data ?? []).map((a) => ({ id: a.id, aparelho: a.aparelho, criadoEm: a.criado_em })),
    recentes: (recentes.data ?? []).map((n) => ({
      id: n.id,
      titulo: n.titulo,
      corpo: n.corpo,
      url: n.url,
      criadaEm: n.criada_em,
      enviada: Boolean(n.enviada_em),
    })),
  };
}
