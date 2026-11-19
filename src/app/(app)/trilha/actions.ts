"use server";

import { revalidatePath } from "next/cache";
import { erro, id, ok, texto, UUID, type Estado } from "@/lib/estado";
import { exigirDiretoria, getMembroAtual } from "@/lib/membro";
import { createClient } from "@/lib/supabase/server";

function atualizar() {
  revalidatePath("/trilha");
  revalidatePath("/trajetoria");
}

function ordem(formData: FormData): number | null {
  const n = Number(formData.get("ordem"));
  return Number.isInteger(n) && n >= 1 && n <= 999 ? n : null;
}

/** Marca ou desmarca um tópico como estudado. Ligantes e diretoria. */
export async function marcarTopico(_: Estado, formData: FormData): Promise<Estado> {
  const membro = await getMembroAtual();
  if (membro.papel === "conselheiro") return erro("O conselho acompanha em modo leitura.");
  const topicoId = id(formData, "topicoId");
  if (!topicoId) return erro("Tópico inválido.");
  const supabase = await createClient();
  const { error } =
    formData.get("feito") === "sim"
      ? await supabase.from("trilha_progresso").upsert({ topico_id: topicoId, membro_id: membro.id }, { onConflict: "topico_id,membro_id", ignoreDuplicates: true })
      : await supabase.from("trilha_progresso").delete().eq("topico_id", topicoId).eq("membro_id", membro.id);
  if (error) return erro("Não foi possível salvar. Tente de novo.");
  atualizar();
  return ok("Progresso salvo.");
}

type MaterialLido = { rotulo: string | null; aula_id: string | null; url: string | null };

/**
 * Materiais em texto, um por linha: "Rótulo | link" ou só o link. O link pode ser o endereço de
 * uma aula da plataforma (/ciclos/aulas/...) ou um link https (pasta do Drive, vídeo).
 */
function lerMateriais(bruto: string): MaterialLido[] | string {
  const linhas = bruto.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 30);
  const materiais: MaterialLido[] = [];
  for (const linha of linhas) {
    const partes = linha.split("|").map((p) => p.trim());
    const link = partes.length > 1 ? partes.slice(1).join("|") : partes[0];
    const rotulo = partes.length > 1 ? partes[0].slice(0, 80) || null : null;
    const aula = link.match(/\/ciclos\/aulas\/([0-9a-f-]{36})/i)?.[1];
    if (aula && UUID.test(aula)) {
      materiais.push({ rotulo, aula_id: aula, url: null });
      continue;
    }
    try {
      const url = new URL(link);
      if (url.protocol !== "https:") return `Link inválido: "${linha}". Use um link https ou o endereço de uma aula.`;
      materiais.push({ rotulo, aula_id: null, url: url.toString() });
    } catch {
      return `Link inválido: "${linha}". Use um link https ou o endereço de uma aula.`;
    }
  }
  return materiais;
}

/** Cria ou edita um tópico, com os materiais. Só diretoria. */
export async function salvarTopico(_: Estado, formData: FormData): Promise<Estado> {
  await exigirDiretoria();
  const topicoId = id(formData, "topicoId");
  const parteId = id(formData, "parteId");
  const titulo = texto(formData, "titulo", 200);
  const posicao = ordem(formData);
  if (!titulo) return erro("Informe o título do tópico.");
  if (!posicao) return erro("Informe a posição do tópico (1, 2, 3...).");
  if (!topicoId && !parteId) return erro("Parte inválida.");
  const materiais = lerMateriais(String(formData.get("materiais") ?? ""));
  if (typeof materiais === "string") return erro(materiais);

  const supabase = await createClient();
  const dados = { titulo, ordem: posicao, leitura: texto(formData, "leitura", 2000), observacao: texto(formData, "observacao", 1000) };
  let alvo = topicoId;
  if (topicoId) {
    const { error } = await supabase.from("trilha_topicos").update(dados).eq("id", topicoId);
    if (error) return erro("Não foi possível salvar o tópico. Tente de novo.");
  } else {
    const { data, error } = await supabase.from("trilha_topicos").insert({ ...dados, parte_id: parteId }).select("id").single();
    if (error || !data) return erro("Não foi possível criar o tópico. Tente de novo.");
    alvo = data.id;
  }

  // Os materiais são regravados inteiros, na ordem em que foram escritos.
  const { error: erroApagar } = await supabase.from("trilha_materiais").delete().eq("topico_id", alvo);
  if (erroApagar) return erro("O tópico foi salvo, mas não os materiais. Tente de novo.");
  if (materiais.length > 0) {
    const { error } = await supabase.from("trilha_materiais").insert(materiais.map((m, i) => ({ ...m, topico_id: alvo, ordem: i + 1 })));
    if (error) return erro("O tópico foi salvo, mas algum material não. Confira se as aulas existem.");
  }
  atualizar();
  return ok(topicoId ? "Tópico atualizado." : "Tópico criado.");
}

/** Remove um tópico (e o progresso dos membros nele). Só diretoria. */
export async function apagarTopico(_: Estado, formData: FormData): Promise<Estado> {
  await exigirDiretoria();
  const topicoId = id(formData, "topicoId");
  if (!topicoId) return erro("Tópico inválido.");
  const supabase = await createClient();
  const { error } = await supabase.from("trilha_topicos").delete().eq("id", topicoId);
  if (error) return erro("Não foi possível remover. Tente de novo.");
  atualizar();
  return ok("Tópico removido.");
}

/** Cria ou edita uma parte da trilha. Só diretoria. */
export async function salvarParte(_: Estado, formData: FormData): Promise<Estado> {
  await exigirDiretoria();
  const parteId = id(formData, "parteId");
  const titulo = texto(formData, "titulo", 120);
  const posicao = ordem(formData);
  if (!titulo) return erro("Informe o título da parte.");
  if (!posicao) return erro("Informe a posição da parte (1, 2, 3...).");
  const supabase = await createClient();
  const dados = { titulo, ordem: posicao, descricao: texto(formData, "descricao", 500) };
  const { error } = parteId
    ? await supabase.from("trilha_partes").update(dados).eq("id", parteId)
    : await supabase.from("trilha_partes").insert(dados);
  if (error) return erro("Não foi possível salvar a parte. Tente de novo.");
  atualizar();
  return ok(parteId ? "Parte atualizada." : "Parte criada.");
}

/** Remove uma parte vazia. Só diretoria. */
export async function apagarParte(_: Estado, formData: FormData): Promise<Estado> {
  await exigirDiretoria();
  const parteId = id(formData, "parteId");
  if (!parteId) return erro("Parte inválida.");
  const supabase = await createClient();
  const { count } = await supabase.from("trilha_topicos").select("id", { count: "exact", head: true }).eq("parte_id", parteId);
  if (count) return erro("Remova os tópicos da parte antes.");
  const { error } = await supabase.from("trilha_partes").delete().eq("id", parteId);
  if (error) return erro("Não foi possível remover. Tente de novo.");
  atualizar();
  return ok("Parte removida.");
}
