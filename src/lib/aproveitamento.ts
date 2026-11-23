import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Leituras feitas e avaliações das aulas.
 * Cada membro lê só as próprias; diretoria e conselho leem todas (RLS).
 */

export type MinhaAvaliacao = { nota: number; comentario: string | null };

export type RetornoDaAula = {
  leituras: number;
  participantes: number;
  avaliacoes: { nota: number; comentario: string | null; quando: string }[];
};

/** Se o membro marcou a leitura da aula e a avaliação que deu, se deu. */
export async function getMeuAproveitamento(aulaId: string, membroId: string): Promise<{ leituraFeita: boolean; avaliacao: MinhaAvaliacao | null }> {
  const supabase = await createClient();
  const [leitura, avaliacao] = await Promise.all([
    supabase.from("leituras_feitas").select("aula_id").eq("aula_id", aulaId).eq("membro_id", membroId).maybeSingle(),
    supabase.from("avaliacoes_aula").select("nota, comentario").eq("aula_id", aulaId).eq("membro_id", membroId).maybeSingle(),
  ]);
  return { leituraFeita: Boolean(leitura.data), avaliacao: avaliacao.data ?? null };
}

/** Aulas cuja leitura o membro marcou e aulas que ele já avaliou. */
export async function getMinhasMarcacoes(membroId: string): Promise<{ leituras: Set<string>; avaliadas: Set<string> }> {
  const supabase = await createClient();
  const [leituras, avaliacoes] = await Promise.all([
    supabase.from("leituras_feitas").select("aula_id").eq("membro_id", membroId),
    supabase.from("avaliacoes_aula").select("aula_id").eq("membro_id", membroId),
  ]);
  return {
    leituras: new Set((leituras.data ?? []).map((l) => l.aula_id as string)),
    avaliadas: new Set((avaliacoes.data ?? []).map((a) => a.aula_id as string)),
  };
}

/**
 * Retorno de uma aula para a diretoria e o conselho: quantos fizeram a leitura e as avaliações,
 * sem o nome de quem avaliou. Participantes são os membros ativos que frequentam o Grupo de Estudos.
 */
export async function getRetornoDaAula(aulaId: string): Promise<RetornoDaAula> {
  const supabase = await createClient();
  const [leituras, avaliacoes, participantes] = await Promise.all([
    supabase.from("leituras_feitas").select("membro_id", { count: "exact", head: true }).eq("aula_id", aulaId),
    supabase.from("avaliacoes_aula").select("nota, comentario, atualizado_em").eq("aula_id", aulaId).order("atualizado_em", { ascending: false }),
    supabase.from("membros").select("id", { count: "exact", head: true }).eq("ativo", true).neq("papel", "conselheiro"),
  ]);
  return {
    leituras: leituras.count ?? 0,
    participantes: participantes.count ?? 0,
    avaliacoes: (avaliacoes.data ?? []).map((a) => ({ nota: a.nota, comentario: a.comentario, quando: a.atualizado_em })),
  };
}
