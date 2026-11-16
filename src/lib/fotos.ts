import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Fotos = Record<string, string>;

/**
 * Fotos de perfil de todos os membros, como links temporários (1 hora) do bucket privado.
 * Uma só chamada por requisição, compartilhada entre os componentes.
 */
export const getFotos = cache(async (): Promise<Fotos> => {
  const supabase = await createClient();
  const { data } = await supabase.from("perfis").select("membro_id, foto").not("foto", "is", null);
  const perfis = (data ?? []) as { membro_id: string; foto: string }[];
  if (perfis.length === 0) return {};
  const { data: links } = await supabase.storage.from("fotos").createSignedUrls(
    perfis.map((p) => p.foto),
    3600,
  );
  const fotos: Fotos = {};
  perfis.forEach((p, i) => {
    const url = links?.[i]?.signedUrl;
    if (url) fotos[p.membro_id] = url;
  });
  return fotos;
});
