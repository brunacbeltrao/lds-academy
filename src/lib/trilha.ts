import "server-only";
import { createClient } from "@/lib/supabase/server";

export type MaterialDaTrilha = {
  id: string;
  rotulo: string | null;
  url: string | null;
  aula: { id: string; numero: number | null; titulo: string; ciclo: string | null } | null;
};

export type TopicoDaTrilha = {
  id: string;
  ordem: number;
  titulo: string;
  leitura: string | null;
  observacao: string | null;
  materiais: MaterialDaTrilha[];
  concluido: boolean;
  /** Só para diretoria e conselho: quantos membros marcaram o tópico como estudado. */
  concluidoPor: number | null;
};

export type ParteDaTrilha = { id: string; ordem: number; titulo: string; descricao: string | null; topicos: TopicoDaTrilha[] };

function um<T>(valor: unknown): T | null {
  if (Array.isArray(valor)) return (valor[0] as T) ?? null;
  return (valor as T) ?? null;
}

/** A trilha inteira, em ordem, com o progresso do membro (e, para a gestão, o de todos). */
export async function getTrilha(membroId: string, gestao: boolean): Promise<ParteDaTrilha[]> {
  const supabase = await createClient();
  const [partes, progresso] = await Promise.all([
    supabase
      .from("trilha_partes")
      .select(
        "id, ordem, titulo, descricao, trilha_topicos(id, ordem, titulo, leitura, observacao, trilha_materiais(id, ordem, rotulo, url, aula:aulas(id, numero, titulo, ciclo:ciclos(codigo))))",
      )
      .order("ordem"),
    supabase.from("trilha_progresso").select("topico_id, membro_id"),
  ]);
  if (partes.error) throw new Error(`Falha ao ler a trilha: ${partes.error.message}`);

  const meus = new Set<string>();
  const porTopico = new Map<string, number>();
  for (const p of progresso.data ?? []) {
    if (p.membro_id === membroId) meus.add(p.topico_id);
    porTopico.set(p.topico_id, (porTopico.get(p.topico_id) ?? 0) + 1);
  }

  type MaterialBruto = { id: string; ordem: number; rotulo: string | null; url: string | null; aula: unknown };
  type TopicoBruto = { id: string; ordem: number; titulo: string; leitura: string | null; observacao: string | null; trilha_materiais: MaterialBruto[] | null };

  return (partes.data ?? []).map((p) => ({
    id: p.id,
    ordem: p.ordem,
    titulo: p.titulo,
    descricao: p.descricao,
    topicos: ((p.trilha_topicos ?? []) as TopicoBruto[])
      .sort((a, b) => a.ordem - b.ordem)
      .map((t) => ({
        id: t.id,
        ordem: t.ordem,
        titulo: t.titulo,
        leitura: t.leitura,
        observacao: t.observacao,
        concluido: meus.has(t.id),
        concluidoPor: gestao ? (porTopico.get(t.id) ?? 0) : null,
        materiais: (t.trilha_materiais ?? [])
          .sort((a, b) => a.ordem - b.ordem)
          .map((m) => {
            const aula = um<{ id: string; numero: number | null; titulo: string; ciclo: unknown }>(m.aula);
            return {
              id: m.id,
              rotulo: m.rotulo,
              url: m.url,
              aula: aula ? { id: aula.id, numero: aula.numero, titulo: aula.titulo, ciclo: um<{ codigo: string }>(aula.ciclo)?.codigo ?? null } : null,
            };
          }),
      })),
  }));
}

/** Progresso do membro na trilha: tópicos estudados sobre o total. */
export async function getProgressoNaTrilha(membroId: string): Promise<{ estudados: number; total: number }> {
  const supabase = await createClient();
  const [total, estudados] = await Promise.all([
    supabase.from("trilha_topicos").select("id", { count: "exact", head: true }),
    supabase.from("trilha_progresso").select("topico_id", { count: "exact", head: true }).eq("membro_id", membroId),
  ]);
  return { estudados: estudados.count ?? 0, total: total.count ?? 0 };
}
