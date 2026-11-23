"use server";

import { revalidatePath } from "next/cache";
import { exigirDiretoria, getMembroAtual } from "@/lib/membro";
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

  // Professor do banco: só muda quando o formulário traz a escolha (o campo existe só se há banco).
  const professorId = formData.has("professor_id") ? String(formData.get("professor_id") ?? "") : undefined;
  if (professorId && !UUID.test(professorId)) return { ok: false, mensagem: "Professor inválido." };

  const slides = link(formData, "slides_url");
  const apostila = link(formData, "apostila_url");
  if (slides === undefined) return { ok: false, mensagem: "O link dos slides precisa começar com https://" };
  if (apostila === undefined) return { ok: false, mensagem: "O link da apostila precisa começar com https://" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("aulas")
    .update({
      ...(professorId === undefined ? {} : { professor_id: professorId || null }),
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

/** O membro justifica a falta (antes ou depois da aula). A diretoria decide na Gestão. */
export async function justificarFalta(_: Resultado, formData: FormData): Promise<Resultado> {
  const membro = await getMembroAtual();
  if (membro.papel === "conselheiro") return { ok: false, mensagem: "O conselho acompanha em modo leitura." };
  const aulaId = String(formData.get("aulaId") ?? "");
  const motivo = texto(formData, "motivo", 2000);
  if (!UUID.test(aulaId)) return { ok: false, mensagem: "Aula inválida." };
  if (!motivo || motivo.length < 10) return { ok: false, mensagem: "Explique o motivo em pelo menos uma frase." };

  const supabase = await createClient();
  const { data: aula } = await supabase.from("aulas").select("id, ciclo:ciclos(status)").eq("id", aulaId).maybeSingle();
  const ciclo = Array.isArray(aula?.ciclo) ? aula.ciclo[0] : aula?.ciclo;
  if (ciclo?.status !== "atual") return { ok: false, mensagem: "Só é possível justificar faltas de aulas do ciclo em curso." };

  const { error } = await supabase.from("justificativas").insert({ aula_id: aulaId, membro_id: membro.id, motivo });
  if (error) return { ok: false, mensagem: "Não foi possível enviar a justificativa. Tente de novo." };
  revalidatePath(`/ciclos/aulas/${aulaId}`);
  revalidatePath("/trajetoria");
  revalidatePath("/");
  return { ok: true, mensagem: "Justificativa enviada. A diretoria acadêmica vai analisar." };
}
