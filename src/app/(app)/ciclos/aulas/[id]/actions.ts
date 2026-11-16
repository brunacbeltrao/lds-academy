"use server";

import { revalidatePath } from "next/cache";
import { exigirDiretoria } from "@/lib/membro";
import { createClient } from "@/lib/supabase/server";

export type Resultado = { ok: boolean; mensagem: string } | null;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function texto(formData: FormData, campo: string, limite: number): string | null {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor ? valor.slice(0, limite) : null;
}

function atualizar(aulaId: string) {
  revalidatePath(`/ciclos/aulas/${aulaId}`);
  revalidatePath("/ciclos");
}

/** Professor, apresentação, local e bibliografia da aula. Só diretoria. */
export async function salvarAula(_: Resultado, formData: FormData): Promise<Resultado> {
  await exigirDiretoria();
  const aulaId = String(formData.get("aulaId") ?? "");
  if (!UUID.test(aulaId)) return { ok: false, mensagem: "Aula inválida." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("aulas")
    .update({
      professor: texto(formData, "professor", 200),
      professor_bio: texto(formData, "professor_bio", 4000),
      local: texto(formData, "local", 200),
      bibliografia: texto(formData, "bibliografia", 8000),
    })
    .eq("id", aulaId);

  if (error) return { ok: false, mensagem: "Não foi possível salvar. Tente de novo." };
  atualizar(aulaId);
  return { ok: true, mensagem: "Aula atualizada." };
}

/** Registra um PDF já enviado ao Storage pelo navegador. Só diretoria. */
export async function registrarMaterial(dados: {
  aulaId: string;
  titulo: string;
  arquivo: string;
  tamanho: number;
}): Promise<Resultado> {
  await exigirDiretoria();
  const { aulaId, arquivo } = dados;
  const titulo = dados.titulo.trim().slice(0, 200);
  const [pasta, aulaNoCaminho, nome, ...resto] = arquivo.split("/");
  const caminhoValido =
    pasta === "aulas" && aulaNoCaminho === aulaId && resto.length === 0 && /^[0-9a-f-]{36}\.pdf$/i.test(nome ?? "");
  if (!UUID.test(aulaId) || !caminhoValido || !titulo) return { ok: false, mensagem: "Anexo inválido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("aula_materiais")
    .insert({ aula_id: aulaId, titulo, arquivo, tamanho: Math.max(0, Math.round(dados.tamanho)) });

  if (error) {
    await supabase.storage.from("materiais").remove([arquivo]);
    return { ok: false, mensagem: "O arquivo subiu, mas não foi possível registrá-lo. Tente de novo." };
  }
  atualizar(aulaId);
  return { ok: true, mensagem: "Anexo adicionado." };
}

/** Apaga o anexo (registro e arquivo). Só diretoria. */
export async function apagarMaterial(formData: FormData): Promise<void> {
  await exigirDiretoria();
  const id = String(formData.get("materialId") ?? "");
  if (!UUID.test(id)) return;

  const supabase = await createClient();
  const { data: material } = await supabase
    .from("aula_materiais")
    .select("id, aula_id, arquivo")
    .eq("id", id)
    .maybeSingle();
  if (!material) return;

  const { error } = await supabase.from("aula_materiais").delete().eq("id", id);
  if (error) return;
  await supabase.storage.from("materiais").remove([material.arquivo]);
  atualizar(material.aula_id);
}
