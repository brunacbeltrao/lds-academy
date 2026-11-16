"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { erro, id, link, ok, texto, type Estado } from "@/lib/estado";
import { exigirDiretoria } from "@/lib/membro";
import { createClient } from "@/lib/supabase/server";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Lido = { falha: string } | { dados: Record<string, string | boolean | null> };

function dadosDoFormulario(formData: FormData): Lido {
  const nome = texto(formData, "nome", 200);
  const email = texto(formData, "email", 200)?.toLowerCase() ?? null;
  const linkedin = link(formData, "linkedin");
  if (!nome) return { falha: "Informe o nome do professor." };
  if (email && !EMAIL.test(email)) return { falha: "E-mail inválido." };
  if (linkedin === "invalido") return { falha: "O LinkedIn precisa ser um link que comece com https://." };
  return {
    dados: {
      nome,
      apresentacao: texto(formData, "apresentacao", 4000),
      instituicao: texto(formData, "instituicao", 200),
      temas: texto(formData, "temas", 1000),
      email,
      telefone: texto(formData, "telefone", 40),
      linkedin,
      observacoes: texto(formData, "observacoes", 4000),
      disponivel: formData.get("disponivel") === "sim",
    },
  };
}

/** Cadastra um professor e abre a ficha dele. Só diretoria. */
export async function cadastrarProfessor(_: Estado, formData: FormData): Promise<Estado> {
  await exigirDiretoria();
  const lido = dadosDoFormulario(formData);
  if ("falha" in lido) return erro(lido.falha);

  const supabase = await createClient();
  const { data: repetido } = await supabase.from("professores").select("id").ilike("nome", String(lido.dados.nome).replace(/[%_\\]/g, "\\$&")).limit(1).maybeSingle();
  if (repetido) return erro("Já existe um professor com este nome no banco.");

  const { data, error } = await supabase.from("professores").insert(lido.dados).select("id").single();
  if (error || !data) return erro("Não foi possível cadastrar. Tente de novo.");
  revalidatePath("/professores");
  redirect(`/professores/${data.id}`);
}

/** Atualiza a ficha. Só diretoria. */
export async function salvarProfessor(_: Estado, formData: FormData): Promise<Estado> {
  await exigirDiretoria();
  const professorId = id(formData);
  if (!professorId) return erro("Professor inválido.");
  const lido = dadosDoFormulario(formData);
  if ("falha" in lido) return erro(lido.falha);

  const supabase = await createClient();
  const { error } = await supabase
    .from("professores")
    .update({ ...lido.dados, atualizado_em: new Date().toISOString() })
    .eq("id", professorId);
  if (error) return erro("Não foi possível salvar. Tente de novo.");
  revalidatePath("/professores");
  revalidatePath(`/professores/${professorId}`);
  return ok("Ficha atualizada.");
}

/** Remove do banco. As aulas que ele deu continuam com o nome; só perdem a ligação. Só diretoria. */
export async function removerProfessor(_: Estado, formData: FormData): Promise<Estado> {
  await exigirDiretoria();
  const professorId = id(formData);
  if (!professorId) return erro("Professor inválido.");
  const supabase = await createClient();
  const { error } = await supabase.from("professores").delete().eq("id", professorId);
  if (error) return erro("Não foi possível remover.");
  revalidatePath("/professores");
  redirect("/professores");
}
