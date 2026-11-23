"use server";

import { revalidatePath } from "next/cache";
import { datasDoArtigo, situacaoDaEntrega, type ConclusaoParecer } from "@/lib/artigo";
import { erro, id, link, ok, texto, UUID, type Estado } from "@/lib/estado";
import { getMembroAtual, type Membro } from "@/lib/membro";
import { createClient } from "@/lib/supabase/server";

/*
 * Ações do fluxo do mini-artigo. Cada uma confere aqui quem pode agir e em que fase;
 * o banco repete a regra de quem pode (gatilhos e RLS da migração fluxo_mini_artigo).
 */

type Supabase = Awaited<ReturnType<typeof createClient>>;
type Artigo = {
  id: string;
  numero: number | null;
  fase: string;
  tema: string | null;
  entrega: string | null;
  publicacao: string | null;
  revisor: string | null;
  ciclo_id: string | null;
  producao_participantes: { membro_id: string; papel: "autor" | "revisor" }[];
};

const CONCLUSOES: ConclusaoParecer[] = ["aprovado", "aprovado_com_ajustes", "reescrever"];
const SO_LEITURA = "O conselho acompanha em modo leitura.";
const SEM_PERMISSAO = "Você não tem permissão para esta etapa.";

function atualizar(producaoId?: string) {
  revalidatePath("/producao");
  if (producaoId) revalidatePath(`/producao/${producaoId}`);
  revalidatePath("/");
  revalidatePath("/calendario");
  revalidatePath("/trajetoria");
}

function data(formData: FormData, campo: string): string | null {
  const valor = String(formData.get(campo) ?? "");
  return /^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor : null;
}

async function lerArtigo(supabase: Supabase, producaoId: string | null): Promise<Artigo | null> {
  if (!producaoId) return null;
  const { data: a } = await supabase
    .from("producoes")
    .select("id, tipo, numero, fase, tema, entrega, publicacao, revisor, ciclo_id, producao_participantes(membro_id, papel)")
    .eq("id", producaoId)
    .maybeSingle();
  return a && a.tipo === "artigo" ? (a as unknown as Artigo) : null;
}

const ehAutor = (a: Artigo, eu: Membro) => a.producao_participantes.some((x) => x.membro_id === eu.id && x.papel === "autor");
const ehRevisor = (a: Artigo, eu: Membro) => a.producao_participantes.some((x) => x.membro_id === eu.id && x.papel === "revisor");
const temRevisor = (a: Artigo) => Boolean(a.revisor) || a.producao_participantes.some((x) => x.papel === "revisor");

async function dataOcupada(supabase: Supabase, publicacao: string, ignorar?: string): Promise<string | null> {
  let consulta = supabase.from("producoes").select("id, numero").eq("tipo", "artigo").eq("publicacao", publicacao);
  if (ignorar) consulta = consulta.neq("id", ignorar);
  const { data: outro } = await consulta.limit(1).maybeSingle();
  return outro ? `Já há o artigo ${String(outro.numero ?? "").padStart(2, "0")} marcado para esse dia.` : null;
}

// ───────────── Dupla ─────────────

export async function registrarTema(_: Estado, formData: FormData): Promise<Estado> {
  const eu = await getMembroAtual();
  if (eu.papel === "conselheiro") return erro(SO_LEITURA);
  const supabase = await createClient();
  const a = await lerArtigo(supabase, id(formData, "producao_id"));
  if (!a) return erro("Artigo não encontrado.");
  if (!ehAutor(a, eu) && eu.papel !== "diretoria") return erro("Só a dupla registra o tema.");
  if (a.fase !== "tema" && a.fase !== "redacao") return erro("O tema não muda depois da entrega do rascunho.");
  const tema = texto(formData, "tema", 300);
  if (!tema) return erro("Escreva o tema.");

  const { error } = await supabase.from("producoes").update({ tema }).eq("id", a.id);
  if (error) return erro("Não foi possível registrar o tema.");
  atualizar(a.id);
  return ok(a.tema ? "Tema atualizado." : "Tema registrado. A diretoria acadêmica já pode vê-lo.");
}

export async function enviarRascunho(_: Estado, formData: FormData): Promise<Estado> {
  const eu = await getMembroAtual();
  if (eu.papel === "conselheiro") return erro(SO_LEITURA);
  const supabase = await createClient();
  const a = await lerArtigo(supabase, id(formData, "producao_id"));
  if (!a) return erro("Artigo não encontrado.");
  if (!ehAutor(a, eu) && eu.papel !== "diretoria") return erro("Só a dupla envia o rascunho.");
  if (a.fase === "tema") return erro("Registre o tema antes de enviar o rascunho.");
  if (a.fase !== "redacao" && a.fase !== "revisao") return erro("O rascunho já passou pela revisão.");
  const url = link(formData, "link");
  if (!url || url === "invalido") return erro("Cole o link do Google Docs, começando com https://");

  const { error } = await supabase.from("artigo_andamento").update({ rascunho_link: url }).eq("producao_id", a.id);
  if (error) return erro("Não foi possível registrar o rascunho.");
  atualizar(a.id);
  if (a.fase === "revisao") return ok("Link do rascunho corrigido.");
  return ok(`Rascunho entregue ${situacaoDaEntrega(a.entrega, new Date().toISOString())}. Confira se o documento está com permissão de comentário.`);
}

export async function concluirAjustes(_: Estado, formData: FormData): Promise<Estado> {
  const eu = await getMembroAtual();
  if (eu.papel === "conselheiro") return erro(SO_LEITURA);
  const supabase = await createClient();
  const a = await lerArtigo(supabase, id(formData, "producao_id"));
  if (!a) return erro("Artigo não encontrado.");
  if (!ehAutor(a, eu) && eu.papel !== "diretoria") return erro("Só a dupla conclui os ajustes.");
  if (a.fase !== "ajustes") return erro("Este artigo não está em ajustes.");

  const { error } = await supabase.from("artigo_andamento").update({ ajustes_em: new Date().toISOString() }).eq("producao_id", a.id);
  if (error) return erro("Não foi possível registrar.");
  atualizar(a.id);
  return ok("Ajustes concluídos. O artigo seguiu para a conferência final.");
}

// ───────────── Revisor ─────────────

export async function registrarParecer(_: Estado, formData: FormData): Promise<Estado> {
  const eu = await getMembroAtual();
  if (eu.papel === "conselheiro") return erro(SO_LEITURA);
  const supabase = await createClient();
  const a = await lerArtigo(supabase, id(formData, "producao_id"));
  if (!a) return erro("Artigo não encontrado.");
  if (!ehRevisor(a, eu) && !eu.diretorAcademico) return erro("Só o revisor designado registra o parecer.");
  if (a.fase !== "revisao") return erro("Este artigo não está em revisão.");
  if (!temRevisor(a)) return erro("Designe o revisor antes de registrar o parecer.");
  const conclusao = String(formData.get("conclusao") ?? "") as ConclusaoParecer;
  const parecer = texto(formData, "parecer", 3000);
  if (!CONCLUSOES.includes(conclusao)) return erro("Escolha a conclusão do parecer.");
  if (!parecer) return erro("Escreva um parecer curto: o que está bom e o que ajustar.");

  const { error } = await supabase.from("artigo_andamento").update({ parecer_conclusao: conclusao, parecer_texto: parecer }).eq("producao_id", a.id);
  if (error) return erro("Não foi possível registrar o parecer.");
  atualizar(a.id);
  return ok(
    conclusao === "aprovado"
      ? "Parecer registrado. O artigo seguiu para a conferência final."
      : conclusao === "aprovado_com_ajustes"
        ? "Parecer registrado. A dupla já vê o pedido de ajustes."
        : "Parecer registrado. O diretor acadêmico vai decidir o próximo passo.",
  );
}

// ───────────── Diretor acadêmico ─────────────

export async function designarRevisor(_: Estado, formData: FormData): Promise<Estado> {
  const eu = await getMembroAtual();
  if (!eu.diretorAcademico) return erro("Só o diretor acadêmico designa o revisor.");
  const supabase = await createClient();
  const a = await lerArtigo(supabase, id(formData, "producao_id"));
  if (!a) return erro("Artigo não encontrado.");
  if (!["tema", "redacao", "revisao"].includes(a.fase)) return erro("O parecer já foi dado; o revisor não muda mais.");

  const escolha = String(formData.get("revisor") ?? "");
  const externo = escolha === "externo" ? texto(formData, "revisor_externo", 200) : null;
  if (escolha === "externo" && !externo) return erro("Escreva o nome de quem vai revisar.");
  if (escolha !== "externo" && !UUID.test(escolha)) return erro("Escolha quem vai revisar.");
  if (UUID.test(escolha) && a.producao_participantes.some((x) => x.membro_id === escolha && x.papel === "autor"))
    return erro("Quem escreve o artigo não pode revisá-lo.");

  const { error: erroApagar } = await supabase.from("producao_participantes").delete().eq("producao_id", a.id).eq("papel", "revisor");
  if (erroApagar) return erro("Não foi possível trocar o revisor.");
  if (UUID.test(escolha)) {
    const { error } = await supabase.from("producao_participantes").insert({ producao_id: a.id, membro_id: escolha, papel: "revisor" });
    if (error) return erro("Não foi possível designar este revisor.");
  }
  const { error } = await supabase.from("producoes").update({ revisor: externo }).eq("id", a.id);
  if (error) return erro("Não foi possível designar o revisor.");
  atualizar(a.id);
  return ok(externo ? `Revisão com ${externo}. Envie o link do rascunho a ele e registre o parecer aqui.` : "Revisor designado. Ele já vê o artigo nas pendências.");
}

export async function recusarTema(_: Estado, formData: FormData): Promise<Estado> {
  const eu = await getMembroAtual();
  if (!eu.diretorAcademico) return erro("Só o diretor acadêmico recusa temas.");
  const supabase = await createClient();
  const a = await lerArtigo(supabase, id(formData, "producao_id"));
  if (!a || !a.tema) return erro("Não há tema para recusar.");
  if (a.fase !== "redacao") return erro("O tema só pode ser recusado antes da entrega do rascunho.");
  const motivo = texto(formData, "motivo", 1000);
  if (!motivo) return erro("Explique à dupla por que o tema foi recusado.");

  const { error } = await supabase.from("producoes").update({ tema: null, tema_recusado: a.tema, tema_recusa_motivo: motivo }).eq("id", a.id);
  if (error) return erro("Não foi possível recusar o tema.");
  atualizar(a.id);
  return ok("Tema recusado. A dupla vê o motivo e registra outro.");
}

/** Depois de um parecer "Reescrever", o diretor decide caso a caso. */
export async function decidirReescrita(_: Estado, formData: FormData): Promise<Estado> {
  const eu = await getMembroAtual();
  if (!eu.diretorAcademico) return erro("Só o diretor acadêmico decide sobre a reescrita.");
  const supabase = await createClient();
  const a = await lerArtigo(supabase, id(formData, "producao_id"));
  if (!a) return erro("Artigo não encontrado.");
  if (a.fase !== "decisao") return erro("Não há decisão pendente neste artigo.");
  const decisao = String(formData.get("decisao") ?? "");

  if (decisao === "ajustar") {
    const { error } = await supabase.from("artigo_andamento").update({ ajustes_pedidos: true }).eq("producao_id", a.id);
    if (error) return erro("Não foi possível registrar a decisão.");
    atualizar(a.id);
    return ok("Decidido: a dupla ajusta o texto nesta semana.");
  }

  if (decisao === "nova_redacao") {
    const entrega = data(formData, "nova_entrega");
    if (!entrega) return erro("Informe o novo prazo do rascunho.");
    const publicacao = data(formData, "nova_publicacao");
    if (publicacao) {
      const ocupada = await dataOcupada(supabase, publicacao, a.id);
      if (ocupada) return erro(ocupada);
    }
    const { error } = await supabase
      .from("artigo_andamento")
      .update({ rascunho_link: null, parecer_conclusao: null, ajustes_pedidos: false, ajustes_em: null })
      .eq("producao_id", a.id);
    if (error) return erro("Não foi possível registrar a decisão.");
    const datas = publicacao ? { publicacao, fim_revisao: datasDoArtigo(publicacao).fim_revisao } : {};
    const { error: erroDatas } = await supabase.from("producoes").update({ entrega, ...datas }).eq("id", a.id);
    if (erroDatas) return erro("A decisão foi registrada, mas não foi possível mudar as datas.");
    atualizar(a.id);
    return ok("Decidido: a dupla reescreve e envia um novo rascunho.");
  }
  return erro("Escolha uma das decisões.");
}

export async function conferirArtigo(_: Estado, formData: FormData): Promise<Estado> {
  const eu = await getMembroAtual();
  if (!eu.diretorAcademico) return erro("Só o diretor acadêmico faz a conferência final.");
  const supabase = await createClient();
  const a = await lerArtigo(supabase, id(formData, "producao_id"));
  if (!a) return erro("Artigo não encontrado.");
  if (a.fase !== "conferencia") return erro("Este artigo não está na conferência final.");
  const decisao = String(formData.get("decisao") ?? "");

  const mudanca =
    decisao === "liberar" ? { liberado_em: new Date().toISOString() } : decisao === "devolver" ? { ajustes_pedidos: true, ajustes_em: null } : null;
  if (!mudanca) return erro("Escolha liberar ou devolver para ajustes.");
  const { error } = await supabase.from("artigo_andamento").update(mudanca).eq("producao_id", a.id);
  if (error) return erro("Não foi possível registrar a conferência.");
  atualizar(a.id);
  return ok(decisao === "liberar" ? "Publicação liberada." : "Devolvido à dupla para ajustes. Combine com eles o que mudar.");
}

// ───────────── Diretoria ─────────────

export async function marcarPublicado(_: Estado, formData: FormData): Promise<Estado> {
  const eu = await getMembroAtual();
  if (eu.papel !== "diretoria") return erro(SEM_PERMISSAO);
  const supabase = await createClient();
  const a = await lerArtigo(supabase, id(formData, "producao_id"));
  if (!a) return erro("Artigo não encontrado.");
  if (a.fase !== "pronto") return erro("O artigo precisa ser liberado na conferência final antes.");
  const url = link(formData, "link_publicado");
  if (!url || url === "invalido") return erro("Cole o link da publicação no LinkedIn, começando com https://");

  const { error } = await supabase.from("producoes").update({ link_publicado: url, publicado_em: new Date().toISOString() }).eq("id", a.id);
  if (error) return erro("Não foi possível marcar como publicado.");
  atualizar(a.id);
  revalidatePath("/biblioteca");
  return ok("Publicado. O artigo já aparece na Biblioteca, em Artigos da liga.");
}

/** Nova data (inclusive para quem perdeu a vaga) ou reserva, sem data. */
export async function moverArtigo(_: Estado, formData: FormData): Promise<Estado> {
  const eu = await getMembroAtual();
  if (eu.papel !== "diretoria") return erro(SEM_PERMISSAO);
  const supabase = await createClient();
  const a = await lerArtigo(supabase, id(formData, "producao_id"));
  if (!a) return erro("Artigo não encontrado.");
  if (a.fase === "publicado") return erro("O artigo já foi publicado.");
  const reserva = formData.get("reserva") === "sim";
  const publicacao = data(formData, "publicacao");
  if (!reserva && !publicacao) return erro("Escolha a nova data de publicação ou marque como reserva.");
  const antesDoRascunho = a.fase === "tema" || a.fase === "redacao";

  let mudanca: Record<string, string | null>;
  if (reserva) {
    mudanca = { publicacao: null, fim_revisao: null, ...(antesDoRascunho ? { entrega: data(formData, "entrega") } : {}) };
  } else {
    const ocupada = await dataOcupada(supabase, publicacao as string, a.id);
    if (ocupada) return erro(ocupada);
    const datas = datasDoArtigo(publicacao as string);
    mudanca = { publicacao: datas.publicacao, fim_revisao: datas.fim_revisao, ...(antesDoRascunho ? { entrega: datas.entrega } : {}) };
  }
  const { error } = await supabase.from("producoes").update(mudanca).eq("id", a.id);
  if (error) return erro("Não foi possível mudar a data.");
  atualizar(a.id);
  return ok(reserva ? "Artigo guardado como reserva, sem data marcada." : "Nova data confirmada. Os prazos foram recalculados.");
}

/** Abre a vaga de um novo artigo: dupla (ou trio) e data, ou reserva. */
export async function criarArtigo(_: Estado, formData: FormData): Promise<Estado> {
  const eu = await getMembroAtual();
  if (eu.papel !== "diretoria") return erro(SEM_PERMISSAO);
  const autores = [...new Set(formData.getAll("autor_ids").map(String).filter((v) => UUID.test(v)))];
  if (autores.length === 0) return erro("Marque quem vai escrever.");
  if (autores.length > 3) return erro("Cada artigo é escrito em dupla ou trio.");
  const reserva = formData.get("reserva") === "sim";
  const publicacao = data(formData, "publicacao");
  if (!reserva && !publicacao) return erro("Escolha a segunda-feira de publicação ou marque como reserva.");

  const supabase = await createClient();
  if (publicacao && !reserva) {
    const ocupada = await dataOcupada(supabase, publicacao);
    if (ocupada) return erro(ocupada);
  }
  const [{ data: ciclo }, { data: ultimo }] = await Promise.all([
    supabase.from("ciclos").select("id").eq("status", "atual").limit(1).maybeSingle(),
    supabase.from("producoes").select("numero").eq("tipo", "artigo").order("numero", { ascending: false, nullsFirst: false }).limit(1).maybeSingle(),
  ]);
  const numero = (ultimo?.numero ?? 0) + 1;
  const datas = publicacao && !reserva ? datasDoArtigo(publicacao) : { publicacao: null, inicio_redacao: null, entrega: data(formData, "entrega"), fim_revisao: null };

  const { data: novo, error } = await supabase
    .from("producoes")
    .insert({ tipo: "artigo", numero, ciclo_id: ciclo?.id ?? null, ...datas })
    .select("id")
    .single();
  if (error || !novo) return erro("Não foi possível abrir a vaga.");
  const { error: erroAutores } = await supabase
    .from("producao_participantes")
    .insert(autores.map((m) => ({ producao_id: novo.id, membro_id: m, papel: "autor" })));
  if (erroAutores) return erro("A vaga foi aberta, mas não foi possível vincular os autores. Edite o artigo para marcá-los.");
  atualizar(novo.id);
  return ok(`Artigo ${String(numero).padStart(2, "0")} aberto. A dupla já vê a vaga e registra o tema.`);
}
