"use server";

import { revalidatePath } from "next/cache";
import { erro, id, link, ok, texto, type Estado } from "@/lib/estado";
import { exigirDiretoria } from "@/lib/membro";
import { createClient } from "@/lib/supabase/server";

function atualizar() {
  revalidatePath("/competicoes");
  revalidatePath("/trajetoria");
}

export async function criarCompeticao(_: Estado, formData: FormData): Promise<Estado> {
  await exigirDiretoria();
  const nome = texto(formData, "nome", 200);
  const pasta = link(formData, "pasta_url");
  const edital = link(formData, "edital_url");
  if (!nome) return erro("Informe o nome da competição.");
  if (pasta === "invalido" || edital === "invalido") return erro("Os links precisam começar com https://");
  const inicio = String(formData.get("inicio") ?? "") || null;
  const fim = String(formData.get("fim") ?? "") || null;
  const supabase = await createClient();
  const { error } = await supabase.from("competicoes").insert({
    nome,
    edicao: texto(formData, "edicao", 50),
    descricao: texto(formData, "descricao", 2000),
    pasta_url: pasta,
    edital_url: edital,
    inicio,
    fim,
  });
  if (error) return erro("Não foi possível criar a competição.");
  atualizar();
  return ok("Competição criada.");
}

export async function apagarCompeticao(_: Estado, formData: FormData): Promise<Estado> {
  await exigirDiretoria();
  const competicaoId = id(formData);
  if (!competicaoId) return erro("Competição inválida.");
  const supabase = await createClient();
  const { error } = await supabase.from("competicoes").delete().eq("id", competicaoId);
  if (error) return erro("Não foi possível apagar.");
  atualizar();
  return ok("Apagada.");
}

export async function criarEquipe(_: Estado, formData: FormData): Promise<Estado> {
  await exigirDiretoria();
  const competicaoId = id(formData, "competicao_id");
  const nome = texto(formData, "nome", 100);
  const membros = formData.getAll("membros").map(String).filter((m) => /^[0-9a-f-]{36}$/i.test(m));
  if (!competicaoId || !nome) return erro("Informe o nome da equipe.");
  const supabase = await createClient();
  const { data: equipe, error } = await supabase.from("equipes").insert({ competicao_id: competicaoId, nome }).select("id").single();
  if (error || !equipe) return erro("Não foi possível criar a equipe.");
  if (membros.length > 0) {
    const { error: erroMembros } = await supabase.from("equipe_membros").insert(membros.map((m) => ({ equipe_id: equipe.id, membro_id: m })));
    if (erroMembros) return erro("A equipe foi criada, mas não foi possível incluir os membros.");
  }
  atualizar();
  return ok("Equipe criada.");
}

export async function apagarEquipe(_: Estado, formData: FormData): Promise<Estado> {
  await exigirDiretoria();
  const equipeId = id(formData);
  if (!equipeId) return erro("Equipe inválida.");
  const supabase = await createClient();
  const { error } = await supabase.from("equipes").delete().eq("id", equipeId);
  if (error) return erro("Não foi possível apagar.");
  atualizar();
  return ok("Equipe apagada.");
}
