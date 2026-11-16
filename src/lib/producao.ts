import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Entrega, Producao } from "./producao-formato";

type Linha<T> = T | T[] | null;
const um = <T,>(v: Linha<T>): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

export async function getProducoes(): Promise<Producao[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("producoes")
    .select(
      "id, tipo, numero, tema, autores, revisor, inicio_redacao, entrega, fim_revisao, publicacao, status, link_publicado, observacoes, producao_participantes(papel, membro:membros(id, nome)), producao_entregas(id, etapa, link, nota, criado_em, autor:membros(id, nome))",
    )
    .order("publicacao");
  if (error) throw new Error(`Falha ao ler o calendário de produção: ${error.message}`);
  return (data ?? []).map((p) => {
    const { producao_participantes, producao_entregas, ...resto } = p as Record<string, unknown>;
    const participantes = ((producao_participantes as { papel: "autor" | "revisor"; membro: Linha<{ id: string; nome: string }> }[]) ?? [])
      .map((pp) => {
        const m = um(pp.membro);
        return m ? { id: m.id, nome: m.nome, papel: pp.papel } : null;
      })
      .filter((x): x is Producao["participantes"][number] => Boolean(x));
    const entregas = ((producao_entregas as (Omit<Entrega, "autor"> & { autor: Linha<{ id: string; nome: string }> })[]) ?? [])
      .map((e) => ({ ...e, autor: um(e.autor) }))
      .sort((a, b) => b.criado_em.localeCompare(a.criado_em));
    return { ...(resto as Omit<Producao, "participantes" | "entregas">), participantes, entregas };
  });
}
