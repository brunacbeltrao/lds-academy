import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Andamento } from "./artigo";
import type { Entrega, Producao } from "./producao-formato";

type Linha<T> = T | T[] | null;
const um = <T,>(v: Linha<T>): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);
type Pessoa = { id: string; nome: string };

/** Carrosséis e mini-artigos, por data de publicação (os artigos de reserva, sem data, no fim). */
export async function getProducoes(): Promise<Producao[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("producoes")
    .select(
      "id, tipo, numero, tema, autores, revisor, inicio_redacao, entrega, fim_revisao, publicacao, status, link_publicado, observacoes, fase, tema_registrado_em, tema_recusado, tema_recusa_motivo, publicado_em, producao_participantes(papel, membro:membros(id, nome)), producao_entregas(id, etapa, link, nota, criado_em, autor:membros(id, nome)), artigo_andamento(rascunho_link, rascunho_em, parecer_conclusao, parecer_texto, parecer_em, ajustes_pedidos, ajustes_em, liberado_em, parecer_por:membros!artigo_andamento_parecer_por_fkey(id, nome), liberado_por:membros!artigo_andamento_liberado_por_fkey(id, nome))",
    )
    .order("publicacao", { nullsFirst: false })
    .order("numero");
  if (error) throw new Error(`Falha ao ler o calendário de produção: ${error.message}`);
  return (data ?? []).map((p) => {
    const { producao_participantes, producao_entregas, artigo_andamento, ...resto } = p as Record<string, unknown>;
    const participantes = ((producao_participantes as { papel: "autor" | "revisor"; membro: Linha<Pessoa> }[]) ?? [])
      .map((pp) => {
        const m = um(pp.membro);
        return m ? { id: m.id, nome: m.nome, papel: pp.papel } : null;
      })
      .filter((x): x is Producao["participantes"][number] => Boolean(x));
    const entregas = ((producao_entregas as (Omit<Entrega, "autor"> & { autor: Linha<Pessoa> })[]) ?? [])
      .map((e) => ({ ...e, autor: um(e.autor) }))
      .sort((a, b) => b.criado_em.localeCompare(a.criado_em));
    const linha = um(artigo_andamento as Linha<Omit<Andamento, "parecer_por" | "liberado_por"> & { parecer_por: Linha<Pessoa>; liberado_por: Linha<Pessoa> }>);
    const andamento: Andamento | null = linha ? { ...linha, parecer_por: um(linha.parecer_por), liberado_por: um(linha.liberado_por) } : null;
    return { ...(resto as Omit<Producao, "participantes" | "entregas" | "andamento">), participantes, entregas, andamento };
  });
}

/** Revisões por membro no ciclo, para ajudar a alternar os revisores. */
export function revisoesPorMembro(producoes: Producao[]): Map<string, number> {
  const contagem = new Map<string, number>();
  for (const p of producoes) {
    if (p.tipo !== "artigo") continue;
    for (const x of p.participantes) if (x.papel === "revisor") contagem.set(x.id, (contagem.get(x.id) ?? 0) + 1);
  }
  return contagem;
}
