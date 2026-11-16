import "server-only";
import { createClient } from "@/lib/supabase/server";
import { dia, hoje } from "@/lib/datas";

export type StatusPresenca = "presente" | "falta" | "justificada";
export type StatusJustificativa = "pendente" | "aceita" | "recusada";

export type LinhaDeFrequencia = {
  aulaId: string;
  numero: number | null;
  titulo: string;
  data: string;
  presenca: StatusPresenca | null;
  justificativa: { id: string; motivo: string; status: StatusJustificativa } | null;
};

export const LIMITE_DE_FALTAS = 3;

/** Aulas do ciclo atual até hoje, com a presença e a justificativa do membro. */
export async function getFrequencia(membroId: string): Promise<LinhaDeFrequencia[]> {
  const supabase = await createClient();
  const { data: ciclo } = await supabase.from("ciclos").select("id").eq("status", "atual").limit(1).maybeSingle();
  if (!ciclo) return [];
  const [{ data: aulas }, { data: presencas }, { data: justificativas }] = await Promise.all([
    supabase.from("aulas").select("id, numero, titulo, data").eq("ciclo_id", ciclo.id).not("data", "is", null).order("data"),
    supabase.from("presencas").select("aula_id, status").eq("membro_id", membroId),
    supabase.from("justificativas").select("id, aula_id, motivo, status, criado_em").eq("membro_id", membroId).order("criado_em"),
  ]);
  const p = new Map((presencas ?? []).map((x) => [x.aula_id as string, x.status as StatusPresenca]));
  const j = new Map((justificativas ?? []).map((x) => [x.aula_id as string, { id: x.id, motivo: x.motivo, status: x.status as StatusJustificativa }]));
  const ate = hoje();
  return (aulas ?? [])
    .filter((a) => dia(a.data as string) <= ate)
    .map((a) => ({
      aulaId: a.id,
      numero: a.numero,
      titulo: a.titulo,
      data: a.data as string,
      presenca: p.get(a.id) ?? null,
      justificativa: j.get(a.id) ?? null,
    }));
}

export function resumo(linhas: LinhaDeFrequencia[]) {
  const presencas = linhas.filter((l) => l.presenca === "presente").length;
  const justificadas = linhas.filter((l) => l.presenca === "justificada" || l.justificativa?.status === "aceita").length;
  const faltas = linhas.filter((l) => l.presenca === "falta" && l.justificativa?.status !== "aceita").length;
  const semRegistro = linhas.filter((l) => !l.presenca).length;
  return { presencas, justificadas, faltas, semRegistro, total: linhas.length };
}
