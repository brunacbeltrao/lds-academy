import "server-only";
import { createClient } from "@/lib/supabase/server";

export type TipoItem = "doutrina" | "legislacao" | "jurisprudencia" | "apostila" | "artigo" | "slides" | "outro";
export type ItemBiblioteca = {
  id: string;
  titulo: string;
  autor: string | null;
  tipo: TipoItem;
  tema: string | null;
  url: string;
  descricao: string | null;
  favorito: boolean;
};

export const ROTULO_TIPO: Record<TipoItem, string> = {
  doutrina: "Doutrina",
  legislacao: "Legislação",
  jurisprudencia: "Jurisprudência",
  apostila: "Apostila",
  artigo: "Artigo da liga",
  slides: "Eventos e aulas",
  outro: "Outro",
};

export async function getBiblioteca(membroId: string): Promise<ItemBiblioteca[]> {
  const supabase = await createClient();
  const [{ data, error }, { data: favs }] = await Promise.all([
    supabase.from("biblioteca_itens").select("id, titulo, autor, tipo, tema, url, descricao").order("titulo"),
    supabase.from("favoritos").select("item_id").eq("membro_id", membroId),
  ]);
  if (error) throw new Error(`Falha ao ler a biblioteca: ${error.message}`);
  const favoritos = new Set((favs ?? []).map((f) => f.item_id as string));
  return (data ?? []).map((i) => ({ ...(i as Omit<ItemBiblioteca, "favorito">), favorito: favoritos.has(i.id) }));
}
