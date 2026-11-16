import "server-only";
import { createClient } from "@/lib/supabase/server";

export type StatusConvite = "a_convidar" | "convidado" | "confirmado" | "recusou";

export const ROTULO_CONVITE: Record<StatusConvite, string> = {
  a_convidar: "A convidar",
  convidado: "Convite enviado",
  confirmado: "Confirmado",
  recusou: "Recusou",
};

export type CicloPlanejado = {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string | null;
  inicio: string | null;
  fim: string | null;
  pasta_url: string | null;
  status: "planejado" | "atual" | "encerrado";
  cronograma_publicado: boolean;
};

export type EncontroPlanejado = {
  /** id do evento (toda linha do cronograma é um evento; as aulas apontam para a aula). */
  id: string;
  tipo: "aula" | "evento" | "competicao" | "prazo" | "outro";
  titulo: string;
  inicio: string;
  local: string | null;
  descricao: string | null;
  aula: {
    id: string;
    numero: number | null;
    titulo: string;
    professor: string | null;
    professorId: string | null;
    professorBio: string | null;
    convite: StatusConvite;
    notas: string | null;
  } | null;
};

const CAMPOS_CICLO = "id, codigo, titulo, descricao, inicio, fim, pasta_url, status, cronograma_publicado";

function um<T>(valor: unknown): T | null {
  if (Array.isArray(valor)) return (valor[0] as T) ?? null;
  return (valor as T) ?? null;
}

/** Ciclos em planejamento (e o atual, para referência), do mais novo ao mais antigo. */
export async function getCiclosParaPlanejar(): Promise<(CicloPlanejado & { encontros: number })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ciclos")
    .select(`${CAMPOS_CICLO}, eventos(count)`)
    .in("status", ["planejado", "atual"])
    .order("codigo", { ascending: false });
  if (error) throw new Error(`Falha ao ler os ciclos: ${error.message}`);
  return (data ?? []).map(({ eventos, ...c }) => ({ ...(c as CicloPlanejado), encontros: (eventos as { count: number }[])?.[0]?.count ?? 0 }));
}

export async function getCicloParaPlanejar(codigo: string): Promise<{ ciclo: CicloPlanejado; encontros: EncontroPlanejado[] } | null> {
  if (!/^[0-9.\-]{4,12}$/.test(codigo)) return null;
  const supabase = await createClient();
  const { data: ciclo, error } = await supabase.from("ciclos").select(CAMPOS_CICLO).eq("codigo", codigo).maybeSingle();
  if (error) throw new Error(`Falha ao ler o ciclo: ${error.message}`);
  if (!ciclo) return null;

  const { data: eventos, error: erroEventos } = await supabase
    .from("eventos")
    .select(
      "id, tipo, titulo, inicio, local, descricao, aula:aulas(id, numero, titulo, professor, professor_id, professor_bio, aula_planejamento(status_convite, notas))",
    )
    .eq("ciclo_id", ciclo.id)
    .order("inicio");
  if (erroEventos) throw new Error(`Falha ao ler o cronograma: ${erroEventos.message}`);

  type AulaLida = {
    id: string;
    numero: number | null;
    titulo: string;
    professor: string | null;
    professor_id: string | null;
    professor_bio: string | null;
    aula_planejamento: unknown;
  };
  const encontros = (eventos ?? []).map((e): EncontroPlanejado => {
    const aula = um<AulaLida>(e.aula);
    const plano = aula ? um<{ status_convite: StatusConvite; notas: string | null }>(aula.aula_planejamento) : null;
    return {
      id: e.id,
      tipo: e.tipo,
      titulo: e.titulo,
      inicio: e.inicio,
      local: e.local,
      descricao: e.descricao,
      aula: aula
        ? {
            id: aula.id,
            numero: aula.numero,
            titulo: aula.titulo,
            professor: aula.professor,
            professorId: aula.professor_id,
            professorBio: aula.professor_bio,
            convite: plano?.status_convite ?? "a_convidar",
            notas: plano?.notas ?? null,
          }
        : null,
    };
  });
  return { ciclo: ciclo as CicloPlanejado, encontros };
}

/** Resumo do andamento: quantas aulas, quantas com professor confirmado, o que falta. */
export function andamento(encontros: EncontroPlanejado[]) {
  const aulas = encontros.filter((e) => e.aula);
  return {
    aulas: aulas.length,
    eventos: encontros.length - aulas.length,
    confirmadas: aulas.filter((e) => e.aula?.convite === "confirmado").length,
    semProfessor: aulas.filter((e) => !e.aula?.professor).length,
    semTema: aulas.filter((e) => /a definir/i.test(e.titulo)).length,
  };
}

/** "2027-03-03" + "20:00" no fuso de Recife (UTC-3, sem horário de verão). */
export function instante(dia: string, hora: string): string {
  return new Date(`${dia}T${hora}:00-03:00`).toISOString();
}

/** As quartas-feiras entre duas datas (inclusive), como AAAA-MM-DD. */
export function quartasFeiras(inicio: string, fim: string): string[] {
  const dias: string[] = [];
  const atual = new Date(`${inicio}T12:00:00Z`);
  const ultimo = new Date(`${fim}T12:00:00Z`);
  while (atual.getUTCDay() !== 3) atual.setUTCDate(atual.getUTCDate() + 1);
  while (atual <= ultimo && dias.length < 40) {
    dias.push(atual.toISOString().slice(0, 10));
    atual.setUTCDate(atual.getUTCDate() + 7);
  }
  return dias;
}
