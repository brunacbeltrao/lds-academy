import "server-only";
import { createClient } from "@/lib/supabase/server";

export type TipoEvento = "aula" | "evento" | "competicao" | "prazo" | "outro";
export type Evento = {
  id: string;
  titulo: string;
  tipo: TipoEvento;
  inicio: string;
  fim: string | null;
  local: string | null;
  descricao: string | null;
  aulaId: string | null;
  origem: "evento" | "producao";
};

export const ROTULO_TIPO_EVENTO: Record<TipoEvento, string> = {
  aula: "Aula",
  evento: "Evento",
  competicao: "Competição",
  prazo: "Prazo",
  outro: "Outro",
};

/** Eventos do intervalo (inclusive), mais as publicações e entregas da Produção como prazos. */
export async function getEventos(de: string, ate: string): Promise<Evento[]> {
  const supabase = await createClient();
  const inicio = `${de}T00:00:00-03:00`;
  const fim = `${ate}T23:59:59-03:00`;
  const [{ data, error }, { data: producoes }] = await Promise.all([
    supabase.from("eventos").select("id, titulo, tipo, inicio, fim, local, descricao, aula_id").eq("publicado", true).gte("inicio", inicio).lte("inicio", fim).order("inicio"),
    supabase.from("producoes").select("id, tipo, numero, tema, publicacao").gte("publicacao", de).lte("publicacao", ate),
  ]);
  if (error) throw new Error(`Falha ao ler o calendário: ${error.message}`);
  const eventos: Evento[] = (data ?? []).map((e) => ({
    id: e.id,
    titulo: e.titulo,
    tipo: e.tipo as TipoEvento,
    inicio: e.inicio,
    fim: e.fim,
    local: e.local,
    descricao: e.descricao,
    aulaId: e.aula_id,
    origem: "evento",
  }));
  for (const p of producoes ?? []) {
    eventos.push({
      id: `producao-${p.id}`,
      titulo: `${p.tipo === "artigo" ? "Artigo" : "Carrossel"} ${String(p.numero ?? "").padStart(2, "0")} publicado${p.tema ? `: ${p.tema}` : ""}`,
      tipo: "prazo",
      inicio: `${p.publicacao}T12:00:00-03:00`,
      fim: null,
      local: p.tipo === "artigo" ? "LinkedIn" : "Instagram",
      descricao: null,
      aulaId: null,
      origem: "producao",
    });
  }
  return eventos.sort((a, b) => a.inicio.localeCompare(b.inicio));
}
