"use server";

import { revalidatePath } from "next/cache";
import { erro, id, link, ok, texto, type Estado } from "@/lib/estado";
import { exigirDiretoria, getMembroAtual } from "@/lib/membro";
import { createClient } from "@/lib/supabase/server";

const TIPOS = ["doutrina", "legislacao", "jurisprudencia", "apostila", "artigo", "slides", "outro"];

export async function alternarFavorito(_: Estado, formData: FormData): Promise<Estado> {
  const membro = await getMembroAtual();
  if (membro.papel === "conselheiro") return erro("O conselho acompanha em modo leitura.");
  const itemId = id(formData);
  if (!itemId) return erro("Item inválido.");
  const supabase = await createClient();
  const favorito = formData.get("favorito") === "sim";
  const { error } = favorito
    ? await supabase.from("favoritos").delete().eq("membro_id", membro.id).eq("item_id", itemId)
    : await supabase.from("favoritos").insert({ membro_id: membro.id, item_id: itemId });
  if (error) return erro("Não foi possível atualizar.");
  revalidatePath("/biblioteca");
  return ok(favorito ? "Removido dos favoritos." : "Salvo nos favoritos.");
}

export async function adicionarItem(_: Estado, formData: FormData): Promise<Estado> {
  const membro = await exigirDiretoria();
  const titulo = texto(formData, "titulo", 300);
  const url = link(formData, "url");
  const tipo = String(formData.get("tipo") ?? "outro");
  if (!titulo) return erro("Informe o título.");
  if (!url || url === "invalido") return erro("Informe um link que comece com https://");
  if (!TIPOS.includes(tipo)) return erro("Tipo inválido.");
  const supabase = await createClient();
  const { error } = await supabase.from("biblioteca_itens").insert({
    titulo,
    url,
    tipo,
    autor: texto(formData, "autor", 200),
    tema: texto(formData, "tema", 100),
    descricao: texto(formData, "descricao", 1000),
    criado_por: membro.id,
  });
  if (error) return erro("Não foi possível adicionar.");
  revalidatePath("/biblioteca");
  return ok("Adicionado à biblioteca.");
}

export async function removerItem(_: Estado, formData: FormData): Promise<Estado> {
  await exigirDiretoria();
  const itemId = id(formData);
  if (!itemId) return erro("Item inválido.");
  const supabase = await createClient();
  const { error } = await supabase.from("biblioteca_itens").delete().eq("id", itemId);
  if (error) return erro("Não foi possível remover.");
  revalidatePath("/biblioteca");
  return ok("Removido.");
}
