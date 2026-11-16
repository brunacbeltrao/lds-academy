"use server";

import { revalidatePath } from "next/cache";
import { erro, id, link, ok, texto, type Estado } from "@/lib/estado";
import { exigirDiretoria, getMembroAtual } from "@/lib/membro";
import { createClient } from "@/lib/supabase/server";

const STATUS = ["a_definir", "em_redacao", "em_revisao", "pronto", "publicado", "atrasado"];
const ETAPAS = ["rascunho", "revisao", "final"];

function atualizar(producaoId: string) {
  revalidatePath("/producao");
  revalidatePath(`/producao/${producaoId}`);
  revalidatePath("/");
}

/** Carrosséis: a dupla envia o link da arte ou da versão final. (Mini-artigos seguem o fluxo de fluxo.ts.) */
export async function enviarEntrega(_: Estado, formData: FormData): Promise<Estado> {
  const membro = await getMembroAtual();
  if (membro.papel === "conselheiro") return erro("O conselho acompanha em modo leitura.");
  const producaoId = id(formData, "producao_id");
  const etapa = String(formData.get("etapa") ?? "");
  const url = link(formData, "link");
  if (!producaoId || !ETAPAS.includes(etapa)) return erro("Entrega inválida.");
  if (!url || url === "invalido") return erro("Cole o link do documento (Google Docs, Drive ou Canva), começando com https://");

  const supabase = await createClient();
  const { data: producao } = await supabase.from("producoes").select("tipo").eq("id", producaoId).maybeSingle();
  if (producao?.tipo !== "carrossel") return erro("Os mini-artigos seguem as etapas da página do artigo.");
  const { error } = await supabase
    .from("producao_entregas")
    .insert({ producao_id: producaoId, membro_id: membro.id, etapa, link: url, nota: texto(formData, "nota", 1000) });
  if (error) return erro("Só os autores, o revisor e a diretoria podem enviar entregas desta publicação.");

  // O status acompanha a entrega: rascunho vai para revisão; versão final fica pronta.
  if (membro.papel === "diretoria" || etapa !== "revisao") {
    const novo = etapa === "rascunho" ? "em_revisao" : etapa === "final" ? "pronto" : null;
    if (novo) await supabase.from("producoes").update({ status: novo }).eq("id", producaoId);
  }
  atualizar(producaoId);
  return ok("Entrega registrada. A diretoria acadêmica foi avisada pelo painel.");
}

export async function apagarEntrega(_: Estado, formData: FormData): Promise<Estado> {
  await getMembroAtual();
  const entregaId = id(formData);
  const producaoId = id(formData, "producao_id");
  if (!entregaId || !producaoId) return erro("Entrega inválida.");
  const supabase = await createClient();
  const { error } = await supabase.from("producao_entregas").delete().eq("id", entregaId);
  if (error) return erro("Não foi possível apagar.");
  atualizar(producaoId);
  return ok("Entrega apagada.");
}

/**
 * Diretoria: correções de tema, datas, link publicado e participantes.
 * Nos artigos, a fase e o status vêm do fluxo, e o revisor é designado pelo diretor acadêmico (fluxo.ts).
 */
export async function salvarProducao(_: Estado, formData: FormData): Promise<Estado> {
  await exigirDiretoria();
  const producaoId = id(formData, "producao_id");
  const status = String(formData.get("status") ?? "");
  const publicado = link(formData, "link_publicado");
  if (!producaoId || !STATUS.includes(status)) return erro("Dados inválidos.");
  if (publicado === "invalido") return erro("O link da publicação precisa começar com https://");
  const data = (campo: string) => {
    const v = String(formData.get(campo) ?? "");
    return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
  };

  const supabase = await createClient();
  const { data: atual } = await supabase.from("producoes").select("tipo").eq("id", producaoId).maybeSingle();
  if (!atual) return erro("Publicação não encontrada.");
  const artigo = atual.tipo === "artigo";
  const publicacao = data("publicacao");
  if (!publicacao && !artigo) return erro("Informe a data de publicação.");

  const comum = {
    tema: texto(formData, "tema", 300),
    link_publicado: publicado,
    observacoes: texto(formData, "observacoes", 2000),
    entrega: data("entrega"),
    fim_revisao: data("fim_revisao"),
    publicacao,
  };
  const { error } = await supabase
    .from("producoes")
    .update(artigo ? comum : { ...comum, status, autores: texto(formData, "autores", 300), revisor: texto(formData, "revisor", 200) })
    .eq("id", producaoId);
  if (error) return erro("Não foi possível salvar.");

  // Participantes: substitui a lista pelos marcados no formulário (nos artigos, só a autoria).
  const autores = formData.getAll("autor_ids").map(String).filter((v) => /^[0-9a-f-]{36}$/i.test(v));
  const revisores = artigo ? [] : formData.getAll("revisor_ids").map(String).filter((v) => /^[0-9a-f-]{36}$/i.test(v));
  const apagar = supabase.from("producao_participantes").delete().eq("producao_id", producaoId);
  const { error: erroApagar } = await (artigo ? apagar.eq("papel", "autor") : apagar);
  if (erroApagar) return erro("Os dados foram salvos, mas não foi possível atualizar os participantes.");
  const linhas = [
    ...autores.map((m) => ({ producao_id: producaoId, membro_id: m, papel: "autor" })),
    ...revisores.map((m) => ({ producao_id: producaoId, membro_id: m, papel: "revisor" })),
  ];
  if (linhas.length > 0) {
    const { error: erroP } = await supabase.from("producao_participantes").insert(linhas);
    if (erroP) return erro(artigo ? "Os dados foram salvos, mas um autor marcado é o revisor deste artigo." : "Os dados foram salvos, mas não foi possível atualizar os participantes.");
  }
  atualizar(producaoId);
  return ok("Publicação atualizada.");
}
