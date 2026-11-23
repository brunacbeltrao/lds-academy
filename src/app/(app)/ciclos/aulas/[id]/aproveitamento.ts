"use server";

import { revalidatePath } from "next/cache";
import { erro, id, ok, texto, type Estado } from "@/lib/estado";
import { getMembroAtual } from "@/lib/membro";
import { createClient } from "@/lib/supabase/server";

/** A aula existe, é do ciclo em curso e, se pedido, já começou. A RLS repete as duas regras. */
async function conferirAula(aulaId: string, precisaTerComecado: boolean): Promise<string | null> {
  const supabase = await createClient();
  const { data: aula } = await supabase.from("aulas").select("id, data, ciclo:ciclos(status)").eq("id", aulaId).maybeSingle();
  if (!aula) return "Aula não encontrada.";
  const ciclo = Array.isArray(aula.ciclo) ? aula.ciclo[0] : aula.ciclo;
  if (ciclo?.status !== "atual") return "Só vale para aulas do ciclo em curso.";
  if (precisaTerComecado && (!aula.data || new Date(aula.data) > new Date())) return "A avaliação abre quando a aula começa.";
  return null;
}

function atualizar(aulaId: string) {
  revalidatePath(`/ciclos/aulas/${aulaId}`);
  revalidatePath("/trajetoria");
  revalidatePath("/");
}

/** Marca ou desmarca a leitura da aula como feita. Ligantes e diretoria. */
export async function marcarLeitura(_: Estado, formData: FormData): Promise<Estado> {
  const membro = await getMembroAtual();
  if (membro.papel === "conselheiro") return erro("O conselho acompanha em modo leitura.");
  const aulaId = id(formData, "aulaId");
  if (!aulaId) return erro("Aula inválida.");
  const feita = formData.get("feita") === "sim";

  const supabase = await createClient();
  if (feita) {
    const problema = await conferirAula(aulaId, false);
    if (problema) return erro(problema);
    const { error } = await supabase.from("leituras_feitas").upsert({ aula_id: aulaId, membro_id: membro.id }, { onConflict: "aula_id,membro_id", ignoreDuplicates: true });
    if (error) return erro("Não foi possível marcar a leitura. Tente de novo.");
  } else {
    const { error } = await supabase.from("leituras_feitas").delete().eq("aula_id", aulaId).eq("membro_id", membro.id);
    if (error) return erro("Não foi possível desmarcar. Tente de novo.");
  }
  atualizar(aulaId);
  return ok(feita ? "Leitura marcada como feita." : "Leitura desmarcada.");
}

/** Envia ou corrige a avaliação da aula (nota de 1 a 5 e comentário opcional). Ligantes e diretoria. */
export async function avaliarAula(_: Estado, formData: FormData): Promise<Estado> {
  const membro = await getMembroAtual();
  if (membro.papel === "conselheiro") return erro("O conselho acompanha em modo leitura.");
  const aulaId = id(formData, "aulaId");
  if (!aulaId) return erro("Aula inválida.");
  const nota = Number(formData.get("nota"));
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) return erro("Escolha uma nota de 1 a 5.");
  const comentario = texto(formData, "comentario", 1000);

  const problema = await conferirAula(aulaId, true);
  if (problema) return erro(problema);

  const supabase = await createClient();
  const { error } = await supabase
    .from("avaliacoes_aula")
    .upsert(
      { aula_id: aulaId, membro_id: membro.id, nota, comentario, atualizado_em: new Date().toISOString() },
      { onConflict: "aula_id,membro_id" },
    );
  if (error) return erro("Não foi possível salvar a avaliação. Tente de novo.");
  atualizar(aulaId);
  revalidatePath("/gestao/relatorio");
  return ok("Avaliação registrada. Obrigado.");
}
