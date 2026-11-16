"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { erro, id, ok, texto, type Estado } from "@/lib/estado";
import { exigirDiretoria, getMembroAtual } from "@/lib/membro";
import { createClient } from "@/lib/supabase/server";

function atualizar(perguntaId?: string) {
  revalidatePath("/tira-duvidas");
  if (perguntaId) revalidatePath(`/tira-duvidas/${perguntaId}`);
  revalidatePath("/");
  revalidatePath("/gestao");
}

export async function perguntar(_: Estado, formData: FormData): Promise<Estado> {
  const membro = await getMembroAtual();
  if (membro.papel === "conselheiro") return erro("O conselho acompanha em modo leitura.");
  const titulo = texto(formData, "titulo", 200);
  const corpo = texto(formData, "corpo", 5000);
  const visibilidade = formData.get("visibilidade") === "privada" ? "privada" : "publica";
  if (!titulo || titulo.length < 8) return erro("Escreva a pergunta em uma frase de pelo menos 8 caracteres.");
  if (!corpo) return erro("Dê o contexto da dúvida.");

  const supabase = await createClient();
  const { data: ciclo } = await supabase.from("ciclos").select("id").eq("status", "atual").limit(1).maybeSingle();
  const { data, error } = await supabase
    .from("perguntas")
    .insert({ autor_id: membro.id, titulo, corpo, visibilidade, tema: texto(formData, "tema", 100), ciclo_id: ciclo?.id ?? null })
    .select("id")
    .single();
  if (error || !data) return erro("Não foi possível enviar a pergunta.");
  atualizar();
  redirect(`/tira-duvidas/${data.id}`);
}

export async function responder(_: Estado, formData: FormData): Promise<Estado> {
  const membro = await getMembroAtual();
  if (membro.papel === "conselheiro") return erro("O conselho acompanha em modo leitura.");
  const perguntaId = id(formData, "pergunta_id");
  const corpo = texto(formData, "corpo", 8000);
  if (!perguntaId || !corpo || corpo.length < 20) return erro("Escreva uma resposta com pelo menos uma frase completa.");

  const supabase = await createClient();
  const diretoria = membro.papel === "diretoria";
  const { error } = await supabase.from("respostas").insert(
    diretoria
      ? { pergunta_id: perguntaId, autor_id: membro.id, corpo, origem: "diretoria", status: "validada", validada_por: membro.id, validada_em: new Date().toISOString() }
      : { pergunta_id: perguntaId, autor_id: membro.id, corpo, origem: "ligante", status: "pendente" },
  );
  if (error) return erro(diretoria ? "Não foi possível publicar a resposta." : "Só é possível responder perguntas públicas.");
  if (diretoria) await supabase.from("perguntas").update({ status: "respondida" }).eq("id", perguntaId);
  atualizar(perguntaId);
  return ok(diretoria ? "Resposta publicada." : "Resposta enviada. Ela aparece para todos depois que a diretoria validar.");
}

export async function decidirResposta(_: Estado, formData: FormData): Promise<Estado> {
  const membro = await exigirDiretoria();
  const respostaId = id(formData);
  const perguntaId = id(formData, "pergunta_id");
  const decisao = formData.get("decisao") === "validada" ? "validada" : "recusada";
  if (!respostaId || !perguntaId) return erro("Resposta inválida.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("respostas")
    .update({ status: decisao, validada_por: membro.id, validada_em: new Date().toISOString() })
    .eq("id", respostaId);
  if (error) return erro("Não foi possível registrar a decisão.");
  if (decisao === "validada") await supabase.from("perguntas").update({ status: "respondida" }).eq("id", perguntaId);
  atualizar(perguntaId);
  return ok(decisao === "validada" ? "Resposta validada e publicada." : "Resposta recusada.");
}

export async function mudarStatusPergunta(_: Estado, formData: FormData): Promise<Estado> {
  await exigirDiretoria();
  const perguntaId = id(formData);
  const status = String(formData.get("status") ?? "");
  if (!perguntaId || !["aberta", "respondida", "arquivada"].includes(status)) return erro("Pedido inválido.");
  const supabase = await createClient();
  const { error } = await supabase.from("perguntas").update({ status }).eq("id", perguntaId);
  if (error) return erro("Não foi possível atualizar.");
  atualizar(perguntaId);
  return ok("Pergunta atualizada.");
}

export async function apagarPergunta(_: Estado, formData: FormData): Promise<Estado> {
  await exigirDiretoria();
  const perguntaId = id(formData);
  if (!perguntaId) return erro("Pergunta inválida.");
  const supabase = await createClient();
  const { error } = await supabase.from("perguntas").delete().eq("id", perguntaId);
  if (error) return erro("Não foi possível apagar.");
  atualizar();
  redirect("/tira-duvidas");
}
