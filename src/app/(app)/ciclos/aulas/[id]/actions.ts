"use server";

import { revalidatePath } from "next/cache";
import { aulaJaComecou } from "@/lib/ciclos";
import { exigirDiretoria } from "@/lib/membro";
import { ehStatusPresenca } from "@/lib/presenca-formato";
import { createClient } from "@/lib/supabase/server";

export type Resultado = { ok: boolean; mensagem: string } | null;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function texto(formData: FormData, campo: string, limite: number): string | null {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor ? valor.slice(0, limite) : null;
}

/** Link opcional: vazio vira null; precisa ser http(s). Devolve undefined se for inválido. */
function link(formData: FormData, campo: string): string | null | undefined {
  const valor = String(formData.get(campo) ?? "").trim();
  if (!valor) return null;
  try {
    const url = new URL(valor);
    if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;
    return url.toString().slice(0, 1000);
  } catch {
    return undefined;
  }
}

function atualizar(aulaId: string) {
  revalidatePath(`/ciclos/aulas/${aulaId}`);
  revalidatePath("/ciclos");
}

/** Professor, apresentação, local, bibliografia e o material de depois da aula. Só diretoria. */
export async function salvarAula(_: Resultado, formData: FormData): Promise<Resultado> {
  await exigirDiretoria();
  const aulaId = String(formData.get("aulaId") ?? "");
  if (!UUID.test(aulaId)) return { ok: false, mensagem: "Aula inválida." };

  const slides = link(formData, "slides_url");
  const apostila = link(formData, "apostila_url");
  if (slides === undefined) return { ok: false, mensagem: "O link dos slides precisa começar com https://" };
  if (apostila === undefined) return { ok: false, mensagem: "O link da apostila precisa começar com https://" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("aulas")
    .update({
      professor: texto(formData, "professor", 200),
      professor_bio: texto(formData, "professor_bio", 4000),
      local: texto(formData, "local", 200),
      bibliografia: texto(formData, "bibliografia", 8000),
      resumo: texto(formData, "resumo", 8000),
      slides_url: slides,
      apostila_url: apostila,
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

/**
 * Salva a chamada da aula. Grava só o que mudou, para que a data de registro de cada
 * presença continue sendo a da última alteração. Só diretoria, a partir do dia da aula.
 */
export async function salvarChamada(_: Resultado, formData: FormData): Promise<Resultado> {
  await exigirDiretoria();
  const aulaId = String(formData.get("aulaId") ?? "");
  if (!UUID.test(aulaId)) return { ok: false, mensagem: "Aula inválida." };

  const supabase = await createClient();
  const { data: aula } = await supabase.from("aulas").select("id, data").eq("id", aulaId).maybeSingle();
  if (!aula) return { ok: false, mensagem: "Aula não encontrada." };
  if (!aulaJaComecou(aula.data)) return { ok: false, mensagem: "A chamada abre no dia da aula." };

  const [membros, atuais] = await Promise.all([
    supabase.from("membros").select("id").eq("ativo", true).in("papel", ["ligante", "diretoria"]),
    supabase.from("presencas").select("membro_id, status").eq("aula_id", aulaId),
  ]);
  if (membros.error || atuais.error) return { ok: false, mensagem: "Não foi possível ler a chamada. Tente de novo." };

  const anteriores = new Map((atuais.data ?? []).map((p) => [p.membro_id as string, p.status as string]));
  const agora = new Date().toISOString();
  const mudancas = (membros.data ?? []).flatMap((m) => {
    const status = formData.get(`presenca:${m.id}`);
    if (!ehStatusPresenca(status) || anteriores.get(m.id) === status) return [];
    return [{ aula_id: aulaId, membro_id: m.id, status, registrada_em: agora }];
  });

  if (mudancas.length === 0) return { ok: true, mensagem: "Nada mudou desde o último registro." };

  const { error } = await supabase.from("presencas").upsert(mudancas, { onConflict: "aula_id,membro_id" });
  if (error) return { ok: false, mensagem: "Não foi possível salvar a chamada. Tente de novo." };
  atualizar(aulaId);
  return {
    ok: true,
    mensagem: mudancas.length === 1 ? "Chamada salva: 1 registro atualizado." : `Chamada salva: ${mudancas.length} registros atualizados.`,
  };
}
