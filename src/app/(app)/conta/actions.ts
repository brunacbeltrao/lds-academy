"use server";

import { revalidatePath } from "next/cache";
import { erro, ok, texto, type Estado } from "@/lib/estado";
import { getMembroAtual } from "@/lib/membro";
import { LIMITE_NOME_EXIBICAO, problemaNoNomeDeExibicao } from "@/lib/nome-exibicao";
import { createClient } from "@/lib/supabase/server";

/** Registra a foto já enviada ao Storage pelo navegador e apaga a anterior. */
export async function registrarFoto(caminho: string): Promise<Estado> {
  const membro = await getMembroAtual();
  const valido = new RegExp(`^${membro.id}/[0-9a-f-]{36}\\.jpg$`, "i").test(caminho);
  if (!valido) return erro("Arquivo inválido.");

  const supabase = await createClient();
  const { data: anterior } = await supabase.from("perfis").select("foto").eq("membro_id", membro.id).maybeSingle();
  const { error } = await supabase
    .from("perfis")
    .upsert({ membro_id: membro.id, foto: caminho, atualizado_em: new Date().toISOString() });
  if (error) {
    await supabase.storage.from("fotos").remove([caminho]);
    return erro("Não foi possível salvar a foto.");
  }
  if (anterior?.foto && anterior.foto !== caminho) await supabase.storage.from("fotos").remove([anterior.foto]);
  revalidatePath("/", "layout");
  return ok("Foto atualizada.");
}

export async function removerFoto(): Promise<Estado> {
  const membro = await getMembroAtual();
  const supabase = await createClient();
  const { data: anterior } = await supabase.from("perfis").select("foto").eq("membro_id", membro.id).maybeSingle();
  if (anterior?.foto) await supabase.storage.from("fotos").remove([anterior.foto]);
  await supabase.from("perfis").update({ foto: null }).eq("membro_id", membro.id);
  revalidatePath("/", "layout");
  return ok("Foto removida.");
}

/** Como o nome aparece na plataforma. Em branco, volta ao nome completo da lista oficial. */
export async function salvarNomeDeExibicao(_: Estado, formData: FormData): Promise<Estado> {
  const membro = await getMembroAtual();
  const nome = texto(formData, "nome_exibicao", LIMITE_NOME_EXIBICAO)?.replace(/\s+/g, " ") ?? null;
  const problema = problemaNoNomeDeExibicao(nome);
  if (problema) return erro(problema);

  const supabase = await createClient();
  // A RLS e o gatilho do banco só deixam o membro mudar o nome de exibição da própria linha.
  const { error } = await supabase.from("membros").update({ nome_exibicao: nome }).eq("id", membro.id);
  if (error) return erro("Não foi possível salvar. Tente de novo.");
  revalidatePath("/", "layout");
  return ok(nome ? `Pronto. Seu nome aparece como ${nome}.` : "Pronto. Seu nome aparece como na lista oficial.");
}
