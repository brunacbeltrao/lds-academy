import "server-only";
import { createClient } from "@/lib/supabase/server";

export type Ciclo = { id: string; codigo: string; titulo: string; inicio: string | null; fim: string | null };
export type Encontro = {
  id: string;
  titulo: string;
  tipo: "aula" | "evento" | "competicao" | "prazo" | "outro";
  inicio: string;
  numero: number | null;
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
    .select("id, titulo, tipo, inicio, aula:aulas(numero)")
    .eq("ciclo_id", ciclo.id)
    .order("inicio");
  if (erroEventos) throw new Error(`Falha ao ler os encontros: ${erroEventos.message}`);

  const encontros = (eventos ?? []).map((e) => {
    const aula = e.aula as { numero: number | null } | { numero: number | null }[] | null;
    const numero = Array.isArray(aula) ? (aula[0]?.numero ?? null) : (aula?.numero ?? null);
    return { id: e.id, titulo: e.titulo, tipo: e.tipo, inicio: e.inicio, numero } as Encontro;
  });

  return { ciclo: ciclo as Ciclo, encontros };
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

export function rotuloEncontro(e: Encontro): string {
  if (e.tipo === "aula") return e.numero ? `Aula ${String(e.numero).padStart(2, "0")}` : "Aula";
  return "Evento";
}
