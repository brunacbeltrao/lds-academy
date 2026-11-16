import "server-only";
import { createClient } from "@/lib/supabase/server";

export type Ciclo = {
  id: string;
  codigo: string;
  titulo: string;
  inicio: string | null;
  fim: string | null;
  descricao?: string | null;
  pasta_url?: string | null;
  status?: "planejado" | "atual" | "encerrado";
  cronograma_publicado?: boolean;
};

export type CicloResumo = Required<Ciclo> & { aulas: number };
export type AulaDoAcervo = { id: string; numero: number | null; titulo: string; data: string | null; professor: string | null; pasta_url: string | null };
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
  professorId: string | null;
  professorBio: string | null;
  bibliografia: string | null;
  pastaUrl: string | null;
  ciclo: { id: string; codigo: string; titulo: string; status: "planejado" | "atual" | "encerrado" } | null;
  materiais: Material[];
};

const FUSO = "America/Recife";

/** Ciclo marcado como atual e seus encontros, em ordem de data. */
export async function getCicloAtual(): Promise<{ ciclo: Ciclo; encontros: Encontro[] } | null> {
  const supabase = await createClient();
  const { data: ciclo, error } = await supabase
    .from("ciclos")
    .select("id, codigo, titulo, inicio, fim, descricao, pasta_url, status")
    .eq("status", "atual")
    .order("inicio", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Falha ao ler o ciclo atual: ${error.message}`);
  if (!ciclo) return null;
  return { ciclo: ciclo as Ciclo, encontros: await getEncontrosDoCiclo(ciclo.id) };
}

/** Encontros publicados de um ciclo, em ordem de data (rascunhos do planejamento ficam de fora). */
export async function getEncontrosDoCiclo(cicloId: string): Promise<Encontro[]> {
  const supabase = await createClient();
  const { data: eventos, error: erroEventos } = await supabase
    .from("eventos")
    .select("id, titulo, tipo, inicio, local, descricao, aula:aulas(id, numero, professor, aula_materiais(count))")
    .eq("ciclo_id", cicloId)
    .eq("publicado", true)
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
  return encontros;
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
      "id, numero, titulo, data, local, professor, professor_id, professor_bio, bibliografia, pasta_url, ciclo:ciclos(id, codigo, titulo, status), aula_materiais(id, titulo, tamanho, criado_em)",
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
    professorId: data.professor_id,
    professorBio: data.professor_bio,
    bibliografia: data.bibliografia,
    pastaUrl: data.pasta_url,
    ciclo: um<NonNullable<Aula["ciclo"]>>(data.ciclo),
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

/** "quarta-feira, 18 de novembro"; com o ano quando não é o ano corrente. */
export function formatarDataLonga(iso: string): string {
  const data = new Date(iso);
  const outroAno = diaLocal(data).slice(0, 4) !== diaLocal(new Date()).slice(0, 4);
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(outroAno ? { year: "numeric" } : {}),
  }).format(data);
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

/** Todos os ciclos, do mais recente ao mais antigo, com o número de aulas. */
export async function getCiclos(): Promise<CicloResumo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ciclos")
    .select("id, codigo, titulo, inicio, fim, descricao, pasta_url, status, cronograma_publicado, aulas(count)")
    .order("codigo", { ascending: false });
  if (error) throw new Error(`Falha ao ler os ciclos: ${error.message}`);
  return (data ?? []).map(({ aulas, ...c }) => ({ ...(c as Required<Ciclo>), aulas: (aulas as { count: number }[])?.[0]?.count ?? 0 }));
}

/** Um encontro do cronograma de um ciclo anterior; quando corresponde a uma aula do acervo, aponta para ela. */
export type EncontroDoAcervo = {
  id: string;
  titulo: string;
  tipo: Encontro["tipo"];
  inicio: string;
  aula: { id: string; numero: number | null; titulo: string; pasta_url: string | null } | null;
};

/**
 * Um ciclo para o acervo: o cronograma datado (os encontros, em ordem) e as aulas do Drive
 * que não aparecem em nenhum encontro do cronograma.
 */
export async function getCiclo(
  codigo: string,
): Promise<{ ciclo: Required<Ciclo>; cronograma: EncontroDoAcervo[]; semData: AulaDoAcervo[] } | null> {
  if (!/^[0-9.\-]{4,12}$/.test(codigo)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ciclos")
    .select(
      "id, codigo, titulo, inicio, fim, descricao, pasta_url, status, aulas(id, numero, titulo, data, professor, pasta_url), eventos(id, titulo, tipo, inicio, aula:aulas(id, numero, titulo, pasta_url))",
    )
    .eq("codigo", codigo)
    .maybeSingle();
  if (error) throw new Error(`Falha ao ler o ciclo: ${error.message}`);
  if (!data) return null;
  const { aulas, eventos, ...ciclo } = data;

  const cronograma = ((eventos as unknown as (Omit<EncontroDoAcervo, "aula"> & { aula: unknown })[]) ?? [])
    .map((e) => ({ ...e, aula: um<EncontroDoAcervo["aula"]>(e.aula) }))
    .sort((a, b) => a.inicio.localeCompare(b.inicio));
  const noCronograma = new Set(cronograma.map((e) => e.aula?.id).filter(Boolean));
  const semData = ((aulas as AulaDoAcervo[]) ?? [])
    .filter((a) => !noCronograma.has(a.id))
    .sort((a, b) => (a.data ?? "").localeCompare(b.data ?? "") || (a.numero ?? 99) - (b.numero ?? 99) || a.titulo.localeCompare(b.titulo));

  return { ciclo: ciclo as Required<Ciclo>, cronograma, semData };
}

/** Período de um ciclo por extenso: "abril a julho de 2024", "novembro de 2024 a abril de 2025". */
export function periodoDoCiclo(inicio: string | null, fim: string | null): string | null {
  if (!inicio || !fim) return null;
  const mes = (d: string) => new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, month: "long" }).format(new Date(`${d}T12:00:00-03:00`));
  const [anoInicio, anoFim] = [inicio.slice(0, 4), fim.slice(0, 4)];
  if (anoInicio !== anoFim) return `${mes(inicio)} de ${anoInicio} a ${mes(fim)} de ${anoFim}`;
  return mes(inicio) === mes(fim) ? `${mes(inicio)} de ${anoInicio}` : `${mes(inicio)} a ${mes(fim)} de ${anoInicio}`;
}

/** Código do ciclo para leitura: "2025.1-2" vira "2025.1 e 2025.2". */
export function rotuloDoCiclo(codigo: string): string {
  const [ano, semestres] = codigo.split(".");
  if (!semestres?.includes("-")) return codigo;
  return semestres
    .split("-")
    .map((s) => `${ano}.${s}`)
    .join(" e ");
}

/**
 * Ciclos encerrados agrupados por tema (o título do ciclo). Temas com um só ciclo vão para
 * "Outros temas". Grupos e ciclos do mais recente ao mais antigo.
 */
export function acervoPorTema(ciclos: CicloResumo[]): { tema: string; id: string; ciclos: CicloResumo[] }[] {
  const ordenados = [...ciclos].sort((a, b) => b.codigo.localeCompare(a.codigo));
  const porTitulo = new Map<string, CicloResumo[]>();
  for (const c of ordenados) porTitulo.set(c.titulo, [...(porTitulo.get(c.titulo) ?? []), c]);
  const grupos = [...porTitulo.entries()].filter(([, lista]) => lista.length > 1).map(([tema, lista]) => ({ tema, ciclos: lista }));
  const outros = [...porTitulo.values()].filter((lista) => lista.length === 1).flat();
  if (outros.length > 0) grupos.push({ tema: "Outros temas", ciclos: outros });
  return grupos.map((g) => ({ ...g, id: `tema-${slug(g.tema)}` }));
}

function slug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
