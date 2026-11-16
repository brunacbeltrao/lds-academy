"use server";

import { revalidatePath } from "next/cache";
import { erro, id, ok, type Estado } from "@/lib/estado";
import { exigirDiretoria, getMembroAtual } from "@/lib/membro";
import { ROTULO_TIPO } from "@/lib/oportunidades-formato";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CARTAZ = /^[0-9a-f-]{36}\.(jpg|png|webp)$/i;
const DIA = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^\d{2}:\d{2}$/;

export type DadosDaOportunidade = {
  id?: string;
  tipo: string;
  titulo: string;
  organizacao: string;
  descricao: string;
  link: string;
  contato: string;
  local: string;
  dia: string;
  hora: string;
  prazo: string;
  pedeLista: boolean;
  vagas: string;
  fixada: boolean;
  /** Caminho de um cartaz recém-enviado ao Storage; "" mantém o atual. */
  cartazNovo: string;
  tirarCartaz: boolean;
};

export type ResultadoDaOportunidade = { ok: boolean; mensagem: string; id?: string };

function limpo(valor: string, limite: number): string | null {
  const v = valor.trim();
  return v ? v.slice(0, limite) : null;
}

function atualizar(oportunidadeId?: string) {
  revalidatePath("/oportunidades");
  if (oportunidadeId) revalidatePath(`/oportunidades/${oportunidadeId}`);
  revalidatePath("/");
}

/** Publica ou edita uma oportunidade. O cartaz já foi enviado ao Storage pelo navegador. Só diretoria. */
export async function salvarOportunidade(dados: DadosDaOportunidade): Promise<ResultadoDaOportunidade> {
  await exigirDiretoria();
  const supabase = await createClient();
  const descartar = async () => {
    if (dados.cartazNovo && CARTAZ.test(dados.cartazNovo)) await supabase.storage.from("mural").remove([dados.cartazNovo]);
  };

  const titulo = limpo(dados.titulo, 200);
  const descricao = limpo(dados.descricao, 6000);
  const tipo = dados.tipo in ROTULO_TIPO ? dados.tipo : null;
  const link = limpo(dados.link, 1000);
  const vagas = dados.vagas.trim() ? Number(dados.vagas) : null;
  const falha =
    !titulo ? "Informe o título." :
    !descricao ? "Escreva a descrição (pode colar o texto da divulgação)." :
    !tipo ? "Escolha o tipo." :
    link && !/^https:\/\/\S+$/.test(link) ? "O link precisa começar com https://." :
    dados.dia && !DIA.test(dados.dia) ? "Data inválida." :
    dados.hora && (!HORA.test(dados.hora) || !dados.dia) ? "Para informar o horário, informe também a data." :
    dados.prazo && !DIA.test(dados.prazo) ? "Prazo inválido." :
    vagas !== null && (!Number.isInteger(vagas) || vagas < 1 || vagas > 10000) ? "O número de vagas precisa ser um inteiro positivo." :
    dados.cartazNovo && !CARTAZ.test(dados.cartazNovo) ? "Cartaz inválido." :
    dados.id && !UUID.test(dados.id) ? "Oportunidade inválida." :
    null;
  if (falha) {
    await descartar();
    return { ok: false, mensagem: falha };
  }

  const registro = {
    tipo,
    titulo,
    descricao,
    organizacao: limpo(dados.organizacao, 200),
    link,
    contato: limpo(dados.contato, 300),
    local: limpo(dados.local, 300),
    quando: dados.dia ? new Date(`${dados.dia}T${dados.hora || "12:00"}:00-03:00`).toISOString() : null,
    prazo: dados.prazo || null,
    pede_lista: dados.pedeLista,
    vagas: dados.pedeLista ? vagas : null,
    fixada: dados.fixada,
  };

  if (!dados.id) {
    const { data, error } = await supabase
      .from("oportunidades")
      .insert({ ...registro, cartaz: dados.cartazNovo || null })
      .select("id")
      .single();
    if (error || !data) {
      await descartar();
      return { ok: false, mensagem: "Não foi possível publicar. Tente de novo." };
    }
    atualizar(data.id);
    return { ok: true, mensagem: "Oportunidade publicada no mural.", id: data.id };
  }

  const { data: atual } = await supabase.from("oportunidades").select("id, cartaz").eq("id", dados.id).maybeSingle();
  if (!atual) {
    await descartar();
    return { ok: false, mensagem: "Oportunidade não encontrada." };
  }
  const cartaz = dados.cartazNovo ? dados.cartazNovo : dados.tirarCartaz ? null : atual.cartaz;
  const { error } = await supabase.from("oportunidades").update({ ...registro, cartaz }).eq("id", dados.id);
  if (error) {
    await descartar();
    return { ok: false, mensagem: "Não foi possível salvar. Tente de novo." };
  }
  if (atual.cartaz && atual.cartaz !== cartaz) await supabase.storage.from("mural").remove([atual.cartaz]);
  atualizar(dados.id);
  return { ok: true, mensagem: "Oportunidade atualizada.", id: dados.id };
}

/** Remove do mural (registro, lista e cartaz). Só diretoria. */
export async function removerOportunidade(_: Estado, formData: FormData): Promise<Estado> {
  await exigirDiretoria();
  const oportunidadeId = id(formData);
  if (!oportunidadeId) return erro("Oportunidade inválida.");
  const supabase = await createClient();
  const { data: atual } = await supabase.from("oportunidades").select("cartaz").eq("id", oportunidadeId).maybeSingle();
  const { error } = await supabase.from("oportunidades").delete().eq("id", oportunidadeId);
  if (error) return erro("Não foi possível remover.");
  if (atual?.cartaz) await supabase.storage.from("mural").remove([atual.cartaz]);
  atualizar();
  return ok("Removida do mural.");
}

/** Entra ou sai da lista de quem vai. Ligantes e diretoria (o conselho só lê). */
export async function alternarPresenca(_: Estado, formData: FormData): Promise<Estado> {
  const membro = await getMembroAtual();
  if (membro.papel === "conselheiro") return erro("O conselho acompanha em modo leitura.");
  const oportunidadeId = id(formData);
  if (!oportunidadeId) return erro("Oportunidade inválida.");
  const supabase = await createClient();

  if (formData.get("acao") === "sair") {
    const { error } = await supabase.from("oportunidade_interessados").delete().eq("oportunidade_id", oportunidadeId).eq("membro_id", membro.id);
    if (error) return erro("Não foi possível tirar o seu nome.");
    atualizar(oportunidadeId);
    return ok("Seu nome saiu da lista.");
  }

  const { error } = await supabase.from("oportunidade_interessados").insert({ oportunidade_id: oportunidadeId, membro_id: membro.id });
  if (error) return erro(error.code === "23505" ? "Seu nome já está na lista." : "As vagas acabaram ou a lista foi fechada.");
  atualizar(oportunidadeId);
  return ok("Seu nome está na lista. Se não puder ir, tire o nome para liberar a vaga.");
}

/** A diretoria tira alguém da lista. */
export async function tirarDaLista(_: Estado, formData: FormData): Promise<Estado> {
  await exigirDiretoria();
  const oportunidadeId = id(formData);
  const membroId = id(formData, "membro_id");
  if (!oportunidadeId || !membroId) return erro("Dados inválidos.");
  const supabase = await createClient();
  const { error } = await supabase.from("oportunidade_interessados").delete().eq("oportunidade_id", oportunidadeId).eq("membro_id", membroId);
  if (error) return erro("Não foi possível tirar da lista.");
  atualizar(oportunidadeId);
  return ok("Retirado da lista.");
}
