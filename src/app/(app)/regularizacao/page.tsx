import type { Metadata } from "next";
import type { Documento } from "@/lib/documentos";
import { exigirGestao } from "@/lib/membro";
import { createClient } from "@/lib/supabase/server";
import { ConteudoDaRegularizacao } from "./conteudo";

export const metadata: Metadata = { title: "Regularização" };

export default async function RegularizacaoPage() {
  const membro = await exigirGestao();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documentos")
    .select("id, titulo, categoria, descricao, data_documento, tamanho")
    .order("data_documento", { ascending: false, nullsFirst: false })
    .order("criado_em", { ascending: false });
  if (error) throw new Error(`Falha ao ler os documentos: ${error.message}`);

  return <ConteudoDaRegularizacao documentos={(data ?? []) as Documento[]} diretoria={membro.papel === "diretoria"} />;
}
