"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dia } from "@/lib/datas";
import { erro, id, link, ok, texto, UUID, type Estado } from "@/lib/estado";
import { exigirDiretoria } from "@/lib/membro";
import { instante, quartasFeiras } from "@/lib/planejamento";
import { createClient } from "@/lib/supabase/server";

type Cliente = Awaited<ReturnType<typeof createClient>>;

const CODIGO = /^\d{4}\.\d(-\d)?$/;
const DIA = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^\d{2}:\d{2}$/;
const CONVITES = ["a_convidar", "convidado", "confirmado", "recusou"];
const UMA_HORA = 60 * 60 * 1000;

function atualizar(codigo?: string) {
  revalidatePath("/gestao/planejamento");
  if (codigo) revalidatePath(`/gestao/planejamento/${codigo}`);
  revalidatePath("/ciclos");
  revalidatePath("/calendario");
}

/** Ciclo que ainda pode ser planejado (status "planejado"). Null se não existe ou já começou. */
async function cicloEmPlanejamento(supabase: Cliente, cicloId: string | null) {
  if (!cicloId) return null;
  const { data } = await supabase.from("ciclos").select("id, codigo, status, cronograma_publicado, inicio, fim").eq("id", cicloId).maybeSingle();
  return data && data.status === "planejado" ? data : null;
}

/** Numera as aulas do ciclo pela data (Aula 01, 02...). */
async function renumerar(supabase: Cliente, cicloId: string) {
  const { data: aulas } = await supabase.from("aulas").select("id, numero").eq("ciclo_id", cicloId).order("data", { nullsFirst: false });
  await Promise.all(
    (aulas ?? []).map((a, i) => (a.numero === i + 1 ? null : supabase.from("aulas").update({ numero: i + 1 }).eq("id", a.id))),
  );
}

function lerDataHora(formData: FormData): { inicio: string; fim: string } | null {
  const diaEscolhido = String(formData.get("dia") ?? "");
  const hora = String(formData.get("hora") ?? "20:00") || "20:00";
  if (!DIA.test(diaEscolhido) || !HORA.test(hora)) return null;
  const inicio = instante(diaEscolhido, hora);
  return { inicio, fim: new Date(Date.parse(inicio) + UMA_HORA).toISOString() };
}

// ───────────── Ciclo ─────────────

function dadosDoCiclo(formData: FormData) {
  const titulo = texto(formData, "titulo", 200);
  const inicio = String(formData.get("inicio") ?? "");
  const fim = String(formData.get("fim") ?? "");
  const pasta = link(formData, "pasta_url");
  if (!titulo) return { falha: "Informe o tema do ciclo." };
  if ((inicio && !DIA.test(inicio)) || (fim && !DIA.test(fim))) return { falha: "Datas inválidas." };
  if (inicio && fim && fim < inicio) return { falha: "O fim do ciclo vem antes do início." };
  if (pasta === "invalido") return { falha: "A pasta do Drive precisa ser um link https." };
  return { dados: { titulo, descricao: texto(formData, "descricao", 2000), inicio: inicio || null, fim: fim || null, pasta_url: pasta } };
}

export async function criarCiclo(_: Estado, formData: FormData): Promise<Estado> {
  await exigirDiretoria();
  const codigo = String(formData.get("codigo") ?? "").trim();
  if (!CODIGO.test(codigo)) return erro("O código segue o formato 2027.1.");
  const lido = dadosDoCiclo(formData);
  if (lido.falha || !lido.dados) return erro(lido.falha ?? "Dados inválidos.");

  const supabase = await createClient();
  const { error } = await supabase.from("ciclos").insert({ codigo, ...lido.dados, status: "planejado", cronograma_publicado: false });
  if (error) return erro(error.code === "23505" ? `Já existe o ciclo ${codigo}.` : "Não foi possível criar o ciclo.");
  atualizar();
  redirect(`/gestao/planejamento/${codigo}`);
}

export async function salvarCiclo(_: Estado, formData: FormData): Promise<Estado> {
  await exigirDiretoria();
  const supabase = await createClient();
  const ciclo = await cicloEmPlanejamento(supabase, id(formData, "ciclo_id"));
  if (!ciclo) return erro("Só ciclos em planejamento podem ser editados aqui.");
  const lido = dadosDoCiclo(formData);
  if (lido.falha || !lido.dados) return erro(lido.falha ?? "Dados inválidos.");

  const { error } = await supabase.from("ciclos").update(lido.dados).eq("id", ciclo.id);
  if (error) return erro("Não foi possível salvar.");
  atualizar(ciclo.codigo);
  return ok("Dados do ciclo salvos.");
}

// ───────────── Encontros ─────────────

export async function adicionarEncontro(_: Estado, formData: FormData): Promise<Estado> {
  await exigirDiretoria();
  const supabase = await createClient();
  const ciclo = await cicloEmPlanejamento(supabase, id(formData, "ciclo_id"));
  if (!ciclo) return erro("Só ciclos em planejamento recebem encontros.");
  const tipo = String(formData.get("tipo") ?? "aula") === "evento" ? "evento" : "aula";
  const quando = lerDataHora(formData);
  const titulo = texto(formData, "titulo", 300) ?? (tipo === "aula" ? "Tema a definir" : null);
  const local = texto(formData, "local", 200);
  if (!quando) return erro("Informe a data do encontro.");
  if (!titulo) return erro("Dê um nome ao evento.");

  const publicado = ciclo.cronograma_publicado;
  let aulaId: string | null = null;
  if (tipo === "aula") {
    const { data: aula, error } = await supabase
      .from("aulas")
      .insert({ ciclo_id: ciclo.id, titulo, data: quando.inicio, local, publicada: publicado })
      .select("id")
      .single();
    if (error || !aula) return erro("Não foi possível criar a aula.");
    aulaId = aula.id;
  }
  const { error } = await supabase
    .from("eventos")
    .insert({ ciclo_id: ciclo.id, aula_id: aulaId, tipo, titulo, inicio: quando.inicio, fim: quando.fim, local, publicado });
  if (error) {
    if (aulaId) await supabase.from("aulas").delete().eq("id", aulaId);
    return erro("Não foi possível criar o encontro.");
  }
  if (aulaId) await renumerar(supabase, ciclo.id);
  atualizar(ciclo.codigo);
  return ok(tipo === "aula" ? "Aula adicionada ao cronograma." : "Evento adicionado ao cronograma.");
}

/** Cria uma aula "Tema a definir" em cada quarta-feira do ciclo que ainda não tem encontro. */
export async function preencherQuartas(_: Estado, formData: FormData): Promise<Estado> {
  await exigirDiretoria();
  const supabase = await createClient();
  const ciclo = await cicloEmPlanejamento(supabase, id(formData, "ciclo_id"));
  if (!ciclo) return erro("Ciclo inválido.");
  if (!ciclo.inicio || !ciclo.fim) return erro("Informe o início e o fim do ciclo em Dados do ciclo.");

  const { data: existentes } = await supabase.from("eventos").select("inicio").eq("ciclo_id", ciclo.id);
  const ocupados = new Set((existentes ?? []).map((e) => dia(e.inicio)));
  const livres = quartasFeiras(ciclo.inicio, ciclo.fim).filter((d) => !ocupados.has(d));
  if (livres.length === 0) return ok("Todas as quartas-feiras do período já têm encontro.");

  const publicado = ciclo.cronograma_publicado;
  const { data: aulas, error } = await supabase
    .from("aulas")
    .insert(livres.map((d) => ({ ciclo_id: ciclo.id, titulo: "Tema a definir", data: instante(d, "20:00"), local: "FDR", publicada: publicado })))
    .select("id, data");
  if (error || !aulas) return erro("Não foi possível criar as aulas.");
  const { error: erroEventos } = await supabase.from("eventos").insert(
    aulas.map((a) => ({
      ciclo_id: ciclo.id,
      aula_id: a.id,
      tipo: "aula",
      titulo: "Tema a definir",
      inicio: a.data,
      fim: new Date(Date.parse(a.data as string) + UMA_HORA).toISOString(),
      local: "FDR",
      publicado,
    })),
  );
  if (erroEventos) {
    await supabase.from("aulas").delete().in("id", aulas.map((a) => a.id));
    return erro("Não foi possível criar o cronograma.");
  }
  await renumerar(supabase, ciclo.id);
  atualizar(ciclo.codigo);
  return ok(`${livres.length} ${livres.length === 1 ? "aula criada" : "aulas criadas"}, uma por quarta-feira, às 20h.`);
}

export async function salvarEncontro(_: Estado, formData: FormData): Promise<Estado> {
  await exigirDiretoria();
  const eventoId = id(formData, "evento_id");
  if (!eventoId) return erro("Encontro inválido.");
  const supabase = await createClient();
  const { data: evento } = await supabase.from("eventos").select("id, ciclo_id, aula_id").eq("id", eventoId).maybeSingle();
  const ciclo = await cicloEmPlanejamento(supabase, evento?.ciclo_id ?? null);
  if (!evento || !ciclo) return erro("Só encontros de ciclos em planejamento podem ser editados aqui.");

  const quando = lerDataHora(formData);
  const titulo = texto(formData, "titulo", 300);
  const local = texto(formData, "local", 200);
  if (!quando) return erro("Informe a data do encontro.");
  if (!titulo) return erro(evento.aula_id ? "Informe o tema da aula (ou deixe “Tema a definir”)." : "Dê um nome ao evento.");

  if (evento.aula_id) {
    const professorId = String(formData.get("professor_id") ?? "");
    if (professorId && !UUID.test(professorId)) return erro("Professor inválido.");
    const convite = String(formData.get("convite") ?? "a_convidar");
    if (!CONVITES.includes(convite)) return erro("Situação do convite inválida.");

    const { error } = await supabase
      .from("aulas")
      .update({
        titulo,
        data: quando.inicio,
        local,
        professor_id: professorId || null,
        professor: texto(formData, "professor", 200),
        professor_bio: texto(formData, "professor_bio", 4000),
      })
      .eq("id", evento.aula_id);
    if (error) return erro("Não foi possível salvar a aula.");
    const { error: erroPlano } = await supabase
      .from("aula_planejamento")
      .upsert({ aula_id: evento.aula_id, status_convite: convite, notas: texto(formData, "notas", 4000), atualizado_em: new Date().toISOString() });
    if (erroPlano) return erro("A aula foi salva, mas o convite e as notas não.");
  }

  const { error } = await supabase
    .from("eventos")
    .update({ titulo, inicio: quando.inicio, fim: quando.fim, local, descricao: evento.aula_id ? undefined : texto(formData, "descricao", 1000) })
    .eq("id", evento.id);
  if (error) return erro("Não foi possível salvar o encontro.");
  if (evento.aula_id) await renumerar(supabase, ciclo.id);
  atualizar(ciclo.codigo);
  return ok("Encontro salvo.");
}

export async function removerEncontro(_: Estado, formData: FormData): Promise<Estado> {
  await exigirDiretoria();
  const eventoId = id(formData, "evento_id");
  if (!eventoId) return erro("Encontro inválido.");
  const supabase = await createClient();
  const { data: evento } = await supabase.from("eventos").select("id, ciclo_id, aula_id").eq("id", eventoId).maybeSingle();
  const ciclo = await cicloEmPlanejamento(supabase, evento?.ciclo_id ?? null);
  if (!evento || !ciclo) return erro("Só encontros de ciclos em planejamento podem ser removidos aqui.");

  // Apagar a aula leva junto o evento, os anexos registrados e o planejamento (cascata).
  const { error } = evento.aula_id
    ? await supabase.from("aulas").delete().eq("id", evento.aula_id)
    : await supabase.from("eventos").delete().eq("id", evento.id);
  if (error) return erro("Não foi possível remover.");
  if (evento.aula_id) await renumerar(supabase, ciclo.id);
  atualizar(ciclo.codigo);
  return ok("Encontro removido.");
}

// ───────────── Publicação e início ─────────────

/** Publica (ou recolhe) o cronograma: aulas e eventos do ciclo passam a aparecer para os ligantes. */
export async function publicarCronograma(_: Estado, formData: FormData): Promise<Estado> {
  await exigirDiretoria();
  const supabase = await createClient();
  const ciclo = await cicloEmPlanejamento(supabase, id(formData, "ciclo_id"));
  if (!ciclo) return erro("Ciclo inválido.");
  const publicar = formData.get("publicar") === "sim";

  const [a, e, c] = await Promise.all([
    supabase.from("aulas").update({ publicada: publicar }).eq("ciclo_id", ciclo.id),
    supabase.from("eventos").update({ publicado: publicar }).eq("ciclo_id", ciclo.id),
    supabase.from("ciclos").update({ cronograma_publicado: publicar }).eq("id", ciclo.id),
  ]);
  if (a.error || e.error || c.error) return erro("Não foi possível concluir. Tente de novo.");
  atualizar(ciclo.codigo);
  return ok(publicar ? "Cronograma publicado: os ligantes já veem as aulas em Ciclos e aulas e no Calendário." : "Cronograma recolhido: voltou a ser rascunho.");
}

/** Começa o ciclo: ele vira o atual e o atual de agora é encerrado. */
export async function iniciarCiclo(_: Estado, formData: FormData): Promise<Estado> {
  await exigirDiretoria();
  const supabase = await createClient();
  const ciclo = await cicloEmPlanejamento(supabase, id(formData, "ciclo_id"));
  if (!ciclo) return erro("Ciclo inválido.");
  if (!ciclo.cronograma_publicado) return erro("Publique o cronograma antes de iniciar o ciclo.");

  const { error: erroAnterior } = await supabase.from("ciclos").update({ status: "encerrado" }).eq("status", "atual");
  if (erroAnterior) return erro("Não foi possível encerrar o ciclo atual.");
  const { error } = await supabase.from("ciclos").update({ status: "atual" }).eq("id", ciclo.id);
  if (error) return erro("O ciclo anterior foi encerrado, mas este não começou. Tente de novo.");
  revalidatePath("/", "layout");
  redirect("/ciclos");
}
