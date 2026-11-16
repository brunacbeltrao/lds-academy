"use server";

import { revalidatePath } from "next/cache";
import { CATEGORIAS, type CategoriaDocumento } from "@/lib/documentos";
import { exigirDiretoria } from "@/lib/membro";
import { createClient } from "@/lib/supabase/server";

export type Resultado = { ok: boolean; mensagem: string } | null;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Registra um PDF já enviado ao Storage pelo navegador. Só diretoria. */
export async function registrarDocumento(dados: {
  titulo: string;
  categoria: string;
  descricao: string;
  dataDocumento: string;
  arquivo: string;
  tamanho: number;
}): Promise<Resultado> {
  await exigirDiretoria();
  const titulo = dados.titulo.trim().slice(0, 200);
  const categoria = CATEGORIAS.find((c) => c.id === dados.categoria)?.id as CategoriaDocumento | undefined;
  const arquivoValido = /^[0-9a-f-]{36}\.pdf$/i.test(dados.arquivo);
  const dataValida = dados.dataDocumento === "" || /^\d{4}-\d{2}-\d{2}$/.test(dados.dataDocumento);
  if (!titulo || !categoria || !arquivoValido || !dataValida) return { ok: false, mensagem: "Documento inválido." };

  const supabase = await createClient();
  const { error } = await supabase.from("documentos").insert({
    titulo,
    categoria,
    descricao: dados.descricao.trim().slice(0, 1000) || null,
    data_documento: dados.dataDocumento || null,
    arquivo: dados.arquivo,
    tamanho: Math.max(0, Math.round(dados.tamanho)),
  });

  if (error) {
    await supabase.storage.from("documentos").remove([dados.arquivo]);
    return { ok: false, mensagem: "O arquivo subiu, mas não foi possível registrá-lo. Tente de novo." };
  }
  revalidatePath("/regularizacao");
  return { ok: true, mensagem: "Documento adicionado." };
}

/** Apaga o documento (registro e arquivo). Só diretoria. */
export async function apagarDocumento(formData: FormData): Promise<void> {
  await exigirDiretoria();
  const id = String(formData.get("documentoId") ?? "");
  if (!UUID.test(id)) return;

  const supabase = await createClient();
  const { data: documento } = await supabase.from("documentos").select("id, arquivo").eq("id", id).maybeSingle();
  if (!documento) return;

  const { error } = await supabase.from("documentos").delete().eq("id", id);
  if (error) return;
  await supabase.storage.from("documentos").remove([documento.arquivo]);
  revalidatePath("/regularizacao");
}
