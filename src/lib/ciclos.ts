import "server-only";
import { createClient } from "@/lib/supabase/server";

export type Ciclo = { id: string; codigo: string; titulo: string; inicio: string | null; fim: string | null };
export type Encontro = {
  id: string;
  titulo: string;
  tipo: "aula" | "evento" | "competicao" | "prazo" | "outro";
  inicio: string;
  local: string | null;
  descricao: string | null;
  numero: number | null;
  aulaId: string | null;
  professor: string | null;
  materiais: number;
};

export type Material = { id: string; titulo: string; tamanho: number | null };
export type Aula = {
  id: string;
  numero: number | null;
  titulo: string;
  data: string | null;
  local: string | null;
  professor: string | null;
  professorBio: string | null;
  bibliografia: string | null;
  ciclo: { codigo: string; titulo: string } | null;
  materiais: Material[];
};

const FUSO = "America/Recife";

/** Ciclo marcado como atual e seus encontros, em ordem de data. */
export async function getCicloAtual(): Promise<{ ciclo: Ciclo; encontros: Encontro[] } | null> {
  const supabase = await createClient();
  const { data: ciclo, error } = await supabase
    .from("ciclos")
    .select("id, codigo, titulo, inicio, fim")
    .eq("status", "atual")
    .order("inicio", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Falha ao ler o ciclo atual: ${error.message}`);
  if (!ciclo) return null;

  const { data: eventos, error: erroEventos } = await supabase
    .from("eventos")
    .select("id, titulo, tipo, inicio, local, descricao, aula:aulas(id, numero, professor, aula_materiais(count))")
    .eq("ciclo_id", ciclo.id)
    .order("inicio");
  if (erroEventos) throw new Error(`Falha ao ler os encontros: ${erroEventos.message}`);

  type AulaEmbutida = { id: string; numero: number | null; professor: string | null; aula_materiais: { count: number }[] };
  const encontros = (eventos ?? []).map((e): Encontro => {
    const aula = um<AulaEmbutida>(e.aula);
    return {
      id: e.id,
      titulo: e.titulo,
      tipo: e.tipo,
      inicio: e.inicio,
      local: e.local,
      descricao: e.descricao,
      numero: aula?.numero ?? null,
      aulaId: aula?.id ?? null,
      professor: aula?.professor ?? null,
      materiais: aula?.aula_materiais?.[0]?.count ?? 0,
    };
  });

  return { ciclo: ciclo as Ciclo, encontros };
}

/** O PostgREST devolve relações "para um" como objeto ou lista de um item; isto normaliza. */
function um<T>(valor: unknown): T | null {
  if (Array.isArray(valor)) return (valor[0] as T) ?? null;
  return (valor as T) ?? null;
}

/** Uma aula com professor, bibliografia e anexos. Null se não existe ou o membro não pode vê-la. */
export async function getAula(id: string): Promise<Aula | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("aulas")
    .select(
      "id, numero, titulo, data, local, professor, professor_bio, bibliografia, ciclo:ciclos(codigo, titulo), aula_materiais(id, titulo, tamanho, criado_em)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Falha ao ler a aula: ${error.message}`);
  if (!data) return null;
  const materiais = [...((data.aula_materiais as (Material & { criado_em: string })[]) ?? [])].sort((a, b) =>
    a.criado_em.localeCompare(b.criado_em),
  );
  return {
    id: data.id,
    numero: data.numero,
    titulo: data.titulo,
    data: data.data,
    local: data.local,
    professor: data.professor,
    professorBio: data.professor_bio,
    bibliografia: data.bibliografia,
    ciclo: um<{ codigo: string; titulo: string }>(data.ciclo),
    materiais: materiais.map(({ id, titulo, tamanho }) => ({ id, titulo, tamanho })),
  };
}

/** O encontro de hoje (até o fim do dia) ou o próximo; null se o ciclo terminou. */
export function proximoEncontro(encontros: Encontro[], agora = new Date()): Encontro | null {
  const hoje = diaLocal(agora);
  return encontros.find((e) => diaLocal(new Date(e.inicio)) >= hoje) ?? null;
}

export function jaPassou(encontro: Encontro, agora = new Date()): boolean {
  return diaLocal(new Date(encontro.inicio)) < diaLocal(agora);
}

export function ehHoje(encontro: Encontro, agora = new Date()): boolean {
  return diaLocal(new Date(encontro.inicio)) === diaLocal(agora);
}

/** Data no fuso de Recife como AAAA-MM-DD, para comparar dias. */
function diaLocal(data: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(data);
}

export function formatarDia(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, day: "2-digit", month: "2-digit" }).format(new Date(iso));
}

/** Dia e mês curtos, para a "folha de calendário" (ex.: { dia: "18", mes: "nov" }). */
export function partesDaData(iso: string): { dia: string; mes: string } {
  const d = new Date(iso);
  const dia = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, day: "2-digit" }).format(d);
  const mes = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, month: "short" }).format(d).replace(".", "");
  return { dia, mes };
}

export function formatarDiaDaSemana(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, weekday: "long" }).format(new Date(iso));
}

export function formatarDataLonga(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, weekday: "long", day: "numeric", month: "long" }).format(
    new Date(iso),
  );
}

export function formatarHora(iso: string): string {
  const [h, m] = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, hour: "2-digit", minute: "2-digit", hour12: false })
    .format(new Date(iso))
    .split(":");
  return m === "00" ? `${Number(h)}h` : `${Number(h)}h${m}`;
}

export function rotuloAula(numero: number | null): string {
  return numero ? `Aula ${String(numero).padStart(2, "0")}` : "Aula extra";
}

export function formatarTamanho(bytes: number | null): string {
  if (!bytes) return "";
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

export function rotuloEncontro(e: Encontro): string {
  if (e.tipo === "aula") return rotuloAula(e.numero);
  return "Evento";
}
