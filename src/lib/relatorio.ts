import "server-only";
import { createClient } from "@/lib/supabase/server";
import { dia, hoje } from "@/lib/datas";

export type CicloDoRelatorio = { id: string; codigo: string; titulo: string; inicio: string | null; fim: string | null; status: "atual" | "encerrado" };

export type AulaDoRelatorio = {
  id: string;
  numero: number | null;
  titulo: string;
  data: string | null;
  professor: string | null;
  realizada: boolean;
  presentes: number;
  faltas: number;
  justificadas: number;
  registradas: number;
  leituras: number;
  notas: number[];
  comentarios: { nota: number; texto: string }[];
  temResumo: boolean;
  temSlides: boolean;
};

export type Relatorio = {
  ciclo: CicloDoRelatorio;
  ciclos: CicloDoRelatorio[];
  participantes: number;
  aulas: AulaDoRelatorio[];
  pertoDoLimite: { nome: string; faltas: number }[];
  justificativas: { recebidas: number; aceitas: number; recusadas: number; pendentes: number };
  producao: { tipo: "carrossel" | "artigo"; previstas: number; publicadas: number }[];
  perguntas: { feitas: number; respondidas: number; privadas: number } | null;
  oportunidades: number | null;
};

/**
 * Relatório de um ciclo (o atual, se nenhum for pedido): frequência, leituras, avaliações,
 * material pós-aula, produção, tira-dúvidas e oportunidades. Só diretoria e conselho (a página
 * chama exigirGestao e a RLS limita presenças, leituras, avaliações e justificativas de terceiros).
 */
export async function getRelatorio(codigo: string | null): Promise<Relatorio | null> {
  const supabase = await createClient();
  const { data: ciclosDados, error } = await supabase
    .from("ciclos")
    .select("id, codigo, titulo, inicio, fim, status")
    .in("status", ["atual", "encerrado"])
    .order("inicio", { ascending: false, nullsFirst: false });
  if (error) throw new Error(`Falha ao ler os ciclos: ${error.message}`);
  const ciclos = (ciclosDados ?? []) as CicloDoRelatorio[];
  const ciclo = ciclos.find((c) => c.codigo === codigo) ?? ciclos.find((c) => c.status === "atual") ?? ciclos[0];
  if (!ciclo) return null;

  const { data: aulasDados } = await supabase
    .from("aulas")
    .select("id, numero, titulo, data, professor, resumo, slides_url")
    .eq("ciclo_id", ciclo.id)
    .order("data", { ascending: true, nullsFirst: false });
  const aulas = aulasDados ?? [];
  const ids = aulas.map((a) => a.id);
  const vazio = { data: [] as never[] };

  const periodo = ciclo.inicio && ciclo.fim ? { de: `${ciclo.inicio}T00:00:00-03:00`, ate: `${ciclo.fim}T23:59:59-03:00` } : null;

  const [presencas, leituras, avaliacoes, justificativas, membros, producoes, perguntas, oportunidades] = await Promise.all([
    ids.length ? supabase.from("presencas").select("aula_id, membro_id, status").in("aula_id", ids) : vazio,
    ids.length ? supabase.from("leituras_feitas").select("aula_id").in("aula_id", ids) : vazio,
    ids.length ? supabase.from("avaliacoes_aula").select("aula_id, nota, comentario").in("aula_id", ids) : vazio,
    ids.length ? supabase.from("justificativas").select("aula_id, status").in("aula_id", ids) : vazio,
    supabase.from("membros").select("id, nome").eq("ativo", true).neq("papel", "conselheiro"),
    supabase.from("producoes").select("tipo, status").eq("ciclo_id", ciclo.id),
    periodo
      ? supabase.from("perguntas").select("visibilidade, status").gte("criado_em", periodo.de).lte("criado_em", periodo.ate)
      : null,
    periodo
      ? supabase.from("oportunidades").select("id", { count: "exact", head: true }).gte("criado_em", periodo.de).lte("criado_em", periodo.ate)
      : null,
  ]);

  const ate = hoje();
  const linhas: AulaDoRelatorio[] = aulas.map((a) => {
    const p = (presencas.data ?? []).filter((x) => x.aula_id === a.id);
    const av = (avaliacoes.data ?? []).filter((x) => x.aula_id === a.id);
    return {
      id: a.id,
      numero: a.numero,
      titulo: a.titulo,
      data: a.data,
      professor: a.professor,
      realizada: Boolean(a.data) && dia(a.data as string) <= ate,
      presentes: p.filter((x) => x.status === "presente").length,
      faltas: p.filter((x) => x.status === "falta").length,
      justificadas: p.filter((x) => x.status === "justificada").length,
      registradas: p.length,
      leituras: (leituras.data ?? []).filter((x) => x.aula_id === a.id).length,
      notas: av.map((x) => x.nota as number),
      comentarios: av.filter((x) => x.comentario).map((x) => ({ nota: x.nota as number, texto: x.comentario as string })),
      temResumo: Boolean(a.resumo),
      temSlides: Boolean(a.slides_url),
    };
  });

  // Faltas sem justificativa por membro (a justificativa aceita vira "justificada" na presença).
  const faltas = new Map<string, number>();
  for (const p of presencas.data ?? []) if (p.status === "falta") faltas.set(p.membro_id, (faltas.get(p.membro_id) ?? 0) + 1);
  const nomes = new Map((membros.data ?? []).map((m) => [m.id as string, m.nome as string]));
  const pertoDoLimite = [...faltas.entries()]
    .filter(([id, n]) => n >= 2 && nomes.has(id))
    .map(([id, n]) => ({ nome: nomes.get(id) as string, faltas: n }))
    .sort((a, b) => b.faltas - a.faltas || a.nome.localeCompare(b.nome));

  const just = justificativas.data ?? [];
  const prod = producoes.data ?? [];

  return {
    ciclo,
    ciclos,
    participantes: membros.data?.length ?? 0,
    aulas: linhas,
    pertoDoLimite,
    justificativas: {
      recebidas: just.length,
      aceitas: just.filter((j) => j.status === "aceita").length,
      recusadas: just.filter((j) => j.status === "recusada").length,
      pendentes: just.filter((j) => j.status === "pendente").length,
    },
    producao: (["artigo", "carrossel"] as const).map((tipo) => ({
      tipo,
      previstas: prod.filter((p) => p.tipo === tipo).length,
      publicadas: prod.filter((p) => p.tipo === tipo && p.status === "publicado").length,
    })),
    perguntas: perguntas
      ? {
          feitas: perguntas.data?.length ?? 0,
          respondidas: (perguntas.data ?? []).filter((p) => p.status === "respondida").length,
          privadas: (perguntas.data ?? []).filter((p) => p.visibilidade === "privada").length,
        }
      : null,
    oportunidades: oportunidades ? (oportunidades.count ?? 0) : null,
  };
}
