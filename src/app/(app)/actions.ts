"use server";

import { revalidatePath } from "next/cache";
import { exigirDiretoria } from "@/lib/membro";
import { createClient } from "@/lib/supabase/server";

export type Resultado = { ok: boolean; mensagem: string } | null;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function lerAviso(formData: FormData) {
  const titulo = String(formData.get("titulo") ?? "").trim().slice(0, 160);
  const corpo = String(formData.get("corpo") ?? "").trim().slice(0, 4000);
  const fixado = formData.get("fixado") === "on";
  return { titulo, corpo, fixado };
}

/** Publica um aviso no Início. Só diretoria. */
export async function publicarAviso(_: Resultado, formData: FormData): Promise<Resultado> {
  const membro = await exigirDiretoria();
  const { titulo, corpo, fixado } = lerAviso(formData);
  if (!titulo || !corpo) return { ok: false, mensagem: "Preencha o título e o texto do aviso." };

  const supabase = await createClient();
  const { error } = await supabase.from("avisos").insert({ titulo, corpo, fixado, autor_id: membro.id });
  if (error) return { ok: false, mensagem: "Não foi possível publicar. Tente de novo." };
  revalidatePath("/");
  return { ok: true, mensagem: "Aviso publicado." };
}

/** Corrige título, texto ou fixação de um aviso. Só diretoria. */
export async function editarAviso(_: Resultado, formData: FormData): Promise<Resultado> {
  await exigirDiretoria();
  const id = String(formData.get("avisoId") ?? "");
  const { titulo, corpo, fixado } = lerAviso(formData);
  if (!UUID.test(id)) return { ok: false, mensagem: "Aviso inválido." };
  if (!titulo || !corpo) return { ok: false, mensagem: "Preencha o título e o texto do aviso." };

  const supabase = await createClient();
  const { error } = await supabase.from("avisos").update({ titulo, corpo, fixado }).eq("id", id);
  if (error) return { ok: false, mensagem: "Não foi possível salvar. Tente de novo." };
  revalidatePath("/");
  return { ok: true, mensagem: "Aviso atualizado." };
}

/** Fixa ou desafixa um aviso no topo. Só diretoria. */
export async function alternarFixado(formData: FormData): Promise<void> {
  await exigirDiretoria();
  const id = String(formData.get("avisoId") ?? "");
  if (!UUID.test(id)) return;
  const fixado = formData.get("fixar") === "sim";

  const supabase = await createClient();
  const { error } = await supabase.from("avisos").update({ fixado }).eq("id", id);
  if (!error) revalidatePath("/");
}

/** Remove um aviso. Só diretoria. */
export async function apagarAviso(formData: FormData): Promise<void> {
  await exigirDiretoria();
  const id = String(formData.get("avisoId") ?? "");
  if (!UUID.test(id)) return;

  const supabase = await createClient();
  const { error } = await supabase.from("avisos").delete().eq("id", id);
  if (!error) revalidatePath("/");
}
