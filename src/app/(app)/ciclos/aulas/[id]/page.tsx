import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAula } from "@/lib/ciclos";
import { getMembroAtual } from "@/lib/membro";
import { createClient } from "@/lib/supabase/server";
import { ConteudoDaAula, type MinhaPresenca } from "./conteudo";

export const metadata: Metadata = { title: "Aula" };

export default async function AulaPage({ params }: PageProps<"/ciclos/aulas/[id]">) {
  const { id } = await params;
  const [membro, aula] = await Promise.all([getMembroAtual(), getAula(id)]);
  if (!aula) notFound();

  // Presença e justificativa só fazem sentido para aulas com data e para quem participa.
  let minha: MinhaPresenca | null = null;
  if (aula.data && membro.papel !== "conselheiro") {
    const supabase = await createClient();
    const [{ data: presenca }, { data: justificativa }] = await Promise.all([
      supabase.from("presencas").select("status").eq("aula_id", aula.id).eq("membro_id", membro.id).maybeSingle(),
      supabase.from("justificativas").select("motivo, status").eq("aula_id", aula.id).eq("membro_id", membro.id).order("criado_em", { ascending: false }).limit(1).maybeSingle(),
    ]);
    minha = { podeJustificar: true, presenca: presenca?.status ?? null, justificativa: justificativa ?? null };
  }

  return <ConteudoDaAula aula={aula} diretoria={membro.papel === "diretoria"} minha={minha} />;
}
