import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Producao } from "./producao-formato";

export async function getProducoes(): Promise<Producao[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("producoes")
    .select("id, tipo, numero, tema, autores, revisor, inicio_redacao, entrega, fim_revisao, publicacao, status")
    .order("publicacao");
  if (error) throw new Error(`Falha ao ler o calendário de produção: ${error.message}`);
  return (data ?? []) as Producao[];
}
