import "server-only";
import { createClient } from "@/lib/supabase/server";

export type Aviso = { id: string; titulo: string; corpo: string; fixado: boolean; publicado_em: string; autor: string | null };

export async function getAvisos(limite = 50): Promise<Aviso[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("avisos")
    .select("id, titulo, corpo, fixado, publicado_em, autor:membros(nome)")
    .order("fixado", { ascending: false })
    .order("publicado_em", { ascending: false })
    .limit(limite);
  if (error) throw new Error(`Falha ao ler os avisos: ${error.message}`);
  return (data ?? []).map((a) => ({
    id: a.id,
    titulo: a.titulo,
    corpo: a.corpo,
    fixado: a.fixado,
    publicado_em: a.publicado_em,
    autor: (Array.isArray(a.autor) ? a.autor[0] : a.autor)?.nome ?? null,
  }));
}
