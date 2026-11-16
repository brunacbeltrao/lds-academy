import "server-only";
import { createClient } from "@/lib/supabase/server";
import { ehStatusPresenca, type LinhaDaChamada, type StatusPresenca } from "@/lib/presenca-formato";

/**
 * A chamada de uma aula: todos os membros ativos que frequentam o Grupo de Estudos
 * (ligantes e diretoria), com o status já registrado. Só diretoria e conselho conseguem ler
 * a lista inteira; a RLS devolve vazio para os demais.
 */
export async function getChamada(aulaId: string): Promise<LinhaDaChamada[]> {
  const supabase = await createClient();
  const [membros, presencas] = await Promise.all([
    supabase.from("membros").select("id, nome, papel").eq("ativo", true).in("papel", ["ligante", "diretoria"]).order("nome"),
    supabase.from("presencas").select("membro_id, status").eq("aula_id", aulaId),
  ]);
  if (membros.error) throw new Error(`Falha ao ler os membros: ${membros.error.message}`);
  if (presencas.error) throw new Error(`Falha ao ler a chamada: ${presencas.error.message}`);

  const status = new Map((presencas.data ?? []).map((p) => [p.membro_id as string, p.status as StatusPresenca]));
  return (membros.data ?? []).map((m) => ({
    membroId: m.id,
    nome: m.nome,
    papel: m.papel as "ligante" | "diretoria",
    status: status.get(m.id) ?? null,
  }));
}

/** A presença do próprio membro numa aula, se já registrada. */
export async function getMinhaPresenca(aulaId: string, membroId: string): Promise<StatusPresenca | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("presencas")
    .select("status")
    .eq("aula_id", aulaId)
    .eq("membro_id", membroId)
    .maybeSingle();
  if (error) throw new Error(`Falha ao ler a presença: ${error.message}`);
  return ehStatusPresenca(data?.status) ? data.status : null;
}
