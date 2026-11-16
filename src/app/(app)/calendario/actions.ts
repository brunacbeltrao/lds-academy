"use server";

import { revalidatePath } from "next/cache";
import { erro, id, ok, texto, type Estado } from "@/lib/estado";
import { exigirDiretoria } from "@/lib/membro";
import { createClient } from "@/lib/supabase/server";

const TIPOS = ["aula", "evento", "competicao", "prazo", "outro"];

export async function criarEvento(_: Estado, formData: FormData): Promise<Estado> {
  await exigirDiretoria();
  const titulo = texto(formData, "titulo", 200);
  const tipo = String(formData.get("tipo") ?? "evento");
  const data = String(formData.get("data") ?? "");
  const horario = String(formData.get("hora") ?? "") || "20:00";
  if (!titulo) return erro("Dê um título ao evento.");
  if (!TIPOS.includes(tipo) || tipo === "aula") return erro("Tipo inválido. Aulas são criadas no planejamento do ciclo.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || !/^\d{2}:\d{2}$/.test(horario)) return erro("Informe data e horário.");

  const supabase = await createClient();
  const { data: ciclo } = await supabase.from("ciclos").select("id").eq("status", "atual").limit(1).maybeSingle();
  const { error } = await supabase.from("eventos").insert({
    titulo,
    tipo,
    inicio: `${data}T${horario}:00-03:00`,
    local: texto(formData, "local", 200),
    descricao: texto(formData, "descricao", 2000),
    ciclo_id: ciclo?.id ?? null,
  });
  if (error) return erro("Não foi possível criar o evento.");
  revalidatePath("/calendario");
  revalidatePath("/ciclos");
  return ok("Evento criado.");
}

export async function apagarEvento(_: Estado, formData: FormData): Promise<Estado> {
  await exigirDiretoria();
  const eventoId = id(formData);
  if (!eventoId) return erro("Evento inválido.");
  const supabase = await createClient();
  const { error } = await supabase.from("eventos").delete().eq("id", eventoId).is("aula_id", null);
  if (error) return erro("Não foi possível apagar.");
  revalidatePath("/calendario");
  revalidatePath("/ciclos");
  return ok("Evento apagado.");
}
