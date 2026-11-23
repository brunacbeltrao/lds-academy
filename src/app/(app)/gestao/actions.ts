"use server";

import { revalidatePath } from "next/cache";
import { erro, id, ok, texto, type Estado } from "@/lib/estado";
import { exigirDiretoria } from "@/lib/membro";
import { ehCargoDiretoria, ROTULO_CARGO } from "@/lib/cargos";
import { LIMITE_NOME_EXIBICAO, problemaNoNomeDeExibicao } from "@/lib/nome-exibicao";
import { createClient } from "@/lib/supabase/server";

const PAPEIS = ["ligante", "diretoria", "conselheiro"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ───────────── Membros ─────────────

export async function adicionarMembro(_: Estado, formData: FormData): Promise<Estado> {
  await exigirDiretoria();
  const nome = texto(formData, "nome", 200);
  const exibicao = texto(formData, "nome_exibicao", LIMITE_NOME_EXIBICAO);
  const email = texto(formData, "email", 200)?.toLowerCase() ?? null;
  const papel = String(formData.get("papel") ?? "ligante");
  if (!nome) return erro("Informe o nome completo.");
  const problema = problemaNoNomeDeExibicao(exibicao);
  if (problema) return erro(problema);
  if (email && !EMAIL.test(email)) return erro("E-mail inválido.");
  if (!PAPEIS.includes(papel)) return erro("Papel inválido.");

  const supabase = await createClient();
  const { data, error } = await supabase.from("membros").insert({ nome_completo: nome, nome_exibicao: exibicao, papel }).select("id").single();
  if (error || !data) return erro("Não foi possível adicionar.");
  if (email) {
    const { error: erroEmail } = await supabase.from("membros_acesso").insert({ membro_id: data.id, email });
    if (erroEmail) return erro("Membro adicionado, mas este e-mail já está em uso por outra pessoa.");
  }
  revalidatePath("/gestao");
  return ok(`${(exibicao ?? nome).split(" ")[0]} entrou na lista.${email ? " Já pode criar a conta em Primeiro acesso." : ""}`);
}

export async function salvarMembro(_: Estado, formData: FormData): Promise<Estado> {
  const eu = await exigirDiretoria();
  const membroId = id(formData);
  const nome = texto(formData, "nome", 200);
  const exibicao = texto(formData, "nome_exibicao", LIMITE_NOME_EXIBICAO);
  const email = texto(formData, "email", 200)?.toLowerCase() ?? null;
  const papel = String(formData.get("papel") ?? "");
  const ativo = formData.get("ativo") === "sim";
  if (!membroId || !nome || !PAPEIS.includes(papel)) return erro("Dados inválidos.");
  const problema = problemaNoNomeDeExibicao(exibicao);
  if (problema) return erro(problema);
  if (email && !EMAIL.test(email)) return erro("E-mail inválido.");
  if (membroId === eu.id && (!ativo || papel !== "diretoria")) return erro("Você não pode tirar o seu próprio acesso de diretoria.");
  const valorCargo = String(formData.get("cargo_diretoria") ?? "");
  if (valorCargo && !ehCargoDiretoria(valorCargo)) return erro("Cargo inválido.");
  const cargo = ehCargoDiretoria(valorCargo) ? valorCargo : null;
  if (cargo && papel !== "diretoria") return erro("Cargo na diretoria é só para quem tem o papel Diretoria.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("membros")
    .update({ nome_completo: nome, nome_exibicao: exibicao, papel, ativo, cargo_diretoria: cargo })
    .eq("id", membroId);
  // 23505: o índice único do banco aceita um só ocupante ativo por cargo.
  if (error?.code === "23505" && cargo) return erro(`${ROTULO_CARGO[cargo]} já está com outra pessoa. Tire o cargo dela antes.`);
  if (error) return erro("Não foi possível salvar.");
  const { error: erroEmail } = email
    ? await supabase.from("membros_acesso").upsert({ membro_id: membroId, email })
    : await supabase.from("membros_acesso").delete().eq("membro_id", membroId);
  if (erroEmail) return erro("Dados salvos, mas este e-mail já está em uso por outra pessoa.");
  revalidatePath("/", "layout");
  return ok("Salvo.");
}

// ───────────── Frequência ─────────────

export async function registrarPresencas(_: Estado, formData: FormData): Promise<Estado> {
  await exigirDiretoria();
  const aulaId = id(formData, "aula_id");
  if (!aulaId) return erro("Aula inválida.");
  const linhas: { aula_id: string; membro_id: string; status: string }[] = [];
  const limpar: string[] = [];
  for (const [chave, valor] of formData.entries()) {
    if (!chave.startsWith("p_")) continue;
    const membroId = chave.slice(2);
    if (!/^[0-9a-f-]{36}$/i.test(membroId)) continue;
    if (valor === "presente" || valor === "falta" || valor === "justificada") linhas.push({ aula_id: aulaId, membro_id: membroId, status: valor });
    else limpar.push(membroId);
  }
  const supabase = await createClient();
  if (linhas.length > 0) {
    const { error } = await supabase.from("presencas").upsert(linhas, { onConflict: "aula_id,membro_id" });
    if (error) return erro("Não foi possível salvar a frequência.");
  }
  if (limpar.length > 0) await supabase.from("presencas").delete().eq("aula_id", aulaId).in("membro_id", limpar);
  revalidatePath("/gestao");
  revalidatePath("/trajetoria");
  revalidatePath("/");
  return ok(`Frequência salva: ${linhas.filter((l) => l.status === "presente").length} presentes, ${linhas.filter((l) => l.status === "falta").length} faltas.`);
}

export async function decidirJustificativa(_: Estado, formData: FormData): Promise<Estado> {
  const eu = await exigirDiretoria();
  const justificativaId = id(formData);
  const decisao = formData.get("decisao") === "aceita" ? "aceita" : "recusada";
  if (!justificativaId) return erro("Justificativa inválida.");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("justificativas")
    .update({ status: decisao, decidida_por: eu.id, decidida_em: new Date().toISOString() })
    .eq("id", justificativaId)
    .select("aula_id, membro_id")
    .single();
  if (error || !data) return erro("Não foi possível registrar a decisão.");
  if (decisao === "aceita") {
    await supabase.from("presencas").upsert({ aula_id: data.aula_id, membro_id: data.membro_id, status: "justificada" }, { onConflict: "aula_id,membro_id" });
  } else {
    await supabase.from("presencas").upsert({ aula_id: data.aula_id, membro_id: data.membro_id, status: "falta" }, { onConflict: "aula_id,membro_id" });
  }
  revalidatePath("/gestao");
  revalidatePath("/trajetoria");
  revalidatePath("/");
  return ok(decisao === "aceita" ? "Justificativa aceita." : "Justificativa recusada.");
}

// ───────────── Avisos ─────────────

export async function publicarAviso(_: Estado, formData: FormData): Promise<Estado> {
  const eu = await exigirDiretoria();
  const titulo = texto(formData, "titulo", 200);
  const corpo = texto(formData, "corpo", 5000);
  if (!titulo || !corpo) return erro("Preencha o título e o texto do aviso.");
  const supabase = await createClient();
  const { error } = await supabase.from("avisos").insert({ titulo, corpo, fixado: formData.get("fixado") === "sim", autor_id: eu.id });
  if (error) return erro("Não foi possível publicar.");
  revalidatePath("/gestao");
  revalidatePath("/");
  return ok("Aviso publicado no Início.");
}

export async function alterarAviso(_: Estado, formData: FormData): Promise<Estado> {
  await exigirDiretoria();
  const avisoId = id(formData);
  const acao = String(formData.get("acao") ?? "");
  if (!avisoId) return erro("Aviso inválido.");
  const supabase = await createClient();
  const { error } =
    acao === "apagar"
      ? await supabase.from("avisos").delete().eq("id", avisoId)
      : await supabase.from("avisos").update({ fixado: acao === "fixar" }).eq("id", avisoId);
  if (error) return erro("Não foi possível atualizar.");
  revalidatePath("/gestao");
  revalidatePath("/");
  return ok("Atualizado.");
}
