import "server-only";
import { createClient } from "@/lib/supabase/server";

export type Aviso = { id: string; titulo: string; corpo: string; fixado: boolean; publicadoEm: string };

/** Avisos da diretoria: fixados primeiro, depois do mais novo para o mais antigo. */
export async function getAvisos(limite = 60): Promise<Aviso[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("avisos")
    .select("id, titulo, corpo, fixado, publicado_em")
    .order("fixado", { ascending: false })
    .order("publicado_em", { ascending: false })
    .limit(limite);
  if (error) throw new Error(`Falha ao ler os avisos: ${error.message}`);
  return (data ?? []).map((a) => ({
    id: a.id,
    titulo: a.titulo,
    corpo: a.corpo,
    fixado: a.fixado,
    publicadoEm: a.publicado_em,
  }));
}
